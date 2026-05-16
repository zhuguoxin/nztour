/**
 * Role detection.
 *
 * Three roles:
 *   - learner      (default — anyone who signs up via Clerk)
 *   - operator     (rows in operator_memberships table)
 *   - platform_admin (row in platform_admins table)
 *
 * Roles are NOT mutually exclusive. A platform admin can also be a learner;
 * an operator can also be a learner. The topbar reflects all roles a user has.
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

export interface CurrentRole {
  userId: string | null;
  isAdmin: boolean;
  operators: OperatorMembership[];
  /** Convenience: true if user has any operator-or-admin permission. */
  hasBackofficeAccess: boolean;
}

export async function getCurrentRole(): Promise<CurrentRole> {
  const { userId } = await auth();
  if (!userId) {
    return { userId: null, isAdmin: false, operators: [], hasBackofficeAccess: false };
  }
  const [admin, ops] = await Promise.all([
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
  ]);
  const operators = ops.results ?? [];
  return {
    userId,
    isAdmin: !!admin,
    operators,
    hasBackofficeAccess: !!admin || operators.length > 0,
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
  const m = r.operators.find((o) => o.operator_slug === operatorSlug);
  if (!m) throw new Error("forbidden");
  return { userId: r.userId, operatorId: m.operator_id, isAdmin: false };
}
