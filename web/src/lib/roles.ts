/**
 * Role detection.
 *
 * Four roles (post-migration 0005):
 *   - learner          (default — anyone who signs up via Clerk)
 *   - operator         (rows in operator_memberships — one product)
 *   - supplier_member  (rows in supplier_memberships — aggregated across the
 *                       supplier's products; SkyCity-manager use case)
 *   - platform_admin   (row in platform_admins)
 *
 * Roles are NOT mutually exclusive. The topbar reflects all roles a user has.
 *
 * Naming note: the on-disk table is still `operators` (= Product in UX).
 * We don't rename the table to avoid churn across ~200 references and FKs.
 */
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "./db";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export interface OperatorMembership {
  operator_id: string;
  operator_slug: string;
  operator_name: string;
  role: string; // 'admin' | 'editor'
}

/** Migration 0005 — a supplier-level grant gives aggregated read access to
 *  every product (= operator row) the supplier owns. SkyCity manager use-case. */
export interface SupplierMembership {
  supplier_id: string;
  supplier_slug: string;
  supplier_name: string;
  role: string; // 'owner' | 'manager' | 'viewer'
}

export interface CurrentRole {
  userId: string | null;
  isAdmin: boolean;
  operators: OperatorMembership[];
  suppliers: SupplierMembership[];
  /** Convenience: true if user has any operator / supplier / admin permission. */
  hasBackofficeAccess: boolean;
}

export async function getCurrentRole(): Promise<CurrentRole> {
  const { userId } = await auth();
  if (!userId) {
    return {
      userId: null,
      isAdmin: false,
      operators: [],
      suppliers: [],
      hasBackofficeAccess: false,
    };
  }
  const [admin, ops, sups] = await Promise.all([
    db()
      .prepare(`SELECT 1 FROM platform_admins WHERE user_id = ?`)
      .bind(userId)
      .first<{ "1": number }>(),
    db()
      .prepare(
        `SELECT om.operator_id, o.slug AS operator_slug, o.name AS operator_name, om.role
         FROM operator_memberships om
         JOIN operators o ON o.id = om.operator_id
         WHERE om.user_id = ?
         ORDER BY o.name`,
      )
      .bind(userId)
      .all<OperatorMembership>(),
    db()
      .prepare(
        `SELECT sm.supplier_id, s.slug AS supplier_slug, s.name AS supplier_name, sm.role
         FROM supplier_memberships sm
         JOIN suppliers s ON s.id = sm.supplier_id
         WHERE sm.user_id = ?
         ORDER BY s.name`,
      )
      .bind(userId)
      .all<SupplierMembership>(),
  ]);
  const operators = ops.results ?? [];
  const suppliers = sups.results ?? [];
  return {
    userId,
    isAdmin: !!admin,
    operators,
    suppliers,
    hasBackofficeAccess: !!admin || operators.length > 0 || suppliers.length > 0,
  };
}

/**
 * Bootstrap: if the current user's email is in ADMIN_EMAILS (comma-separated
 * env var), insert them into platform_admins. Idempotent. Called from /learn
 * since that's the post-signup landing.
 */
export async function bootstrapAdminFromEmailList(): Promise<void> {
  const { userId } = await auth();
  if (!userId) return;
  const { env } = getCloudflareContext();
  const allow = (env.ADMIN_EMAILS as string | undefined)?.split(",").map((s) => s.trim().toLowerCase()) ?? [];
  if (allow.length === 0) return;

  const u = await currentUser().catch(() => null);
  const email = u?.emailAddresses?.[0]?.emailAddress?.toLowerCase();
  if (!email || !allow.includes(email)) return;

  await db()
    .prepare(`INSERT OR IGNORE INTO platform_admins (user_id) VALUES (?)`)
    .bind(userId)
    .run();
}

export async function requireAdmin(): Promise<string> {
  const r = await getCurrentRole();
  if (!r.userId) throw new Error("unauthorised");
  if (!r.isAdmin) throw new Error("forbidden");
  return r.userId;
}

export async function requireOperatorMembership(operatorSlug: string): Promise<{
  userId: string;
  operatorId: string;
  isAdmin: boolean;
}> {
  const r = await getCurrentRole();
  if (!r.userId) throw new Error("unauthorised");
  if (r.isAdmin) {
    // Admins can operate any operator. Resolve operator_id.
    const op = await db()
      .prepare(`SELECT id FROM operators WHERE slug = ?`)
      .bind(operatorSlug)
      .first<{ id: string }>();
    if (!op) throw new Error("not_found");
    return { userId: r.userId, operatorId: op.id, isAdmin: true };
  }
  // Direct operator grant first.
  const direct = r.operators.find((o) => o.operator_slug === operatorSlug);
  if (direct) return { userId: r.userId, operatorId: direct.operator_id, isAdmin: false };

  // Fall back to supplier grant — supplier members get access to every product
  // their supplier owns.
  if (r.suppliers.length > 0) {
    const row = await db()
      .prepare(
        `SELECT o.id, o.supplier_id FROM operators o WHERE o.slug = ?`,
      )
      .bind(operatorSlug)
      .first<{ id: string; supplier_id: string | null }>();
    if (
      row?.supplier_id &&
      r.suppliers.some((s) => s.supplier_id === row.supplier_id)
    ) {
      return { userId: r.userId, operatorId: row.id, isAdmin: false };
    }
  }
  throw new Error("forbidden");
}

/** Supplier-level guard for /supplier/<slug> routes. */
export async function requireSupplierMembership(supplierSlug: string): Promise<{
  userId: string;
  supplierId: string;
  isAdmin: boolean;
}> {
  const r = await getCurrentRole();
  if (!r.userId) throw new Error("unauthorised");
  if (r.isAdmin) {
    const s = await db()
      .prepare(`SELECT id FROM suppliers WHERE slug = ?`)
      .bind(supplierSlug)
      .first<{ id: string }>();
    if (!s) throw new Error("not_found");
    return { userId: r.userId, supplierId: s.id, isAdmin: true };
  }
  const m = r.suppliers.find((s) => s.supplier_slug === supplierSlug);
  if (!m) throw new Error("forbidden");
  return { userId: r.userId, supplierId: m.supplier_id, isAdmin: false };
}
