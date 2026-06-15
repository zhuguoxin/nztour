"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/roles";

export async function grantMembership(form: FormData) {
  await requireAdmin();
  const userId = String(form.get("user_id") ?? "");
  const operatorId = String(form.get("operator_id") ?? "");
  const role = String(form.get("role") ?? "admin");
  if (!userId || !operatorId) throw new Error("missing fields");
  if (!["admin", "editor"].includes(role)) throw new Error("invalid role");
  await db()
    .prepare(
      `INSERT INTO operator_memberships (user_id, operator_id, role)
       VALUES (?, ?, ?)
       ON CONFLICT(user_id, operator_id) DO UPDATE SET role = excluded.role`,
    )
    .bind(userId, operatorId, role)
    .run();
  revalidatePath("/admin");
}

export async function revokeMembership(form: FormData) {
  await requireAdmin();
  const userId = String(form.get("user_id") ?? "");
  const operatorId = String(form.get("operator_id") ?? "");
  if (!userId || !operatorId) throw new Error("missing fields");
  await db()
    .prepare(`DELETE FROM operator_memberships WHERE user_id = ? AND operator_id = ?`)
    .bind(userId, operatorId)
    .run();
  revalidatePath("/admin");
}

// ---------------------------------------------------------------------------
//  Onboarding: create suppliers / products + assign supplier managers.
//  Admin-only. This is the MVP onboarding path (no public self-serve signup).
// ---------------------------------------------------------------------------

function shortId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 50) || `x-${Date.now().toString(36)}`
  );
}

/** Ensure a slug is unique in the given table, appending a short suffix if not. */
async function uniqueSlug(table: "suppliers" | "operators", base: string): Promise<string> {
  let slug = base;
  for (let i = 0; i < 5; i++) {
    const hit = await db()
      .prepare(`SELECT 1 AS x FROM ${table} WHERE slug = ?`)
      .bind(slug)
      .first<{ x: number }>();
    if (!hit) return slug;
    slug = `${base}-${Math.random().toString(36).slice(2, 5)}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

export async function createSupplier(form: FormData) {
  await requireAdmin();
  const name = String(form.get("name") ?? "").trim().slice(0, 200);
  if (!name) throw new Error("name required");
  const slugIn = String(form.get("slug") ?? "").trim();
  const slug = await uniqueSlug("suppliers", slugify(slugIn || name));
  const plan = String(form.get("plan_tier") ?? "free");
  const planTier = ["free", "starter", "pro", "enterprise"].includes(plan) ? plan : "free";
  const country = String(form.get("country") ?? "NZ").trim().slice(0, 60) || "NZ";
  await db()
    .prepare(
      `INSERT INTO suppliers (id, slug, name, country, plan_tier, status)
       VALUES (?, ?, ?, ?, ?, 'active')`,
    )
    .bind(shortId("sup"), slug, name, country, planTier)
    .run();
  revalidatePath("/admin");
}

export async function createOperator(form: FormData) {
  await requireAdmin();
  const name = String(form.get("name") ?? "").trim().slice(0, 200);
  if (!name) throw new Error("name required");
  const supplierId = String(form.get("supplier_id") ?? "").trim();
  if (!supplierId) throw new Error("supplier required");
  const sup = await db()
    .prepare(`SELECT id FROM suppliers WHERE id = ?`)
    .bind(supplierId)
    .first<{ id: string }>();
  if (!sup) throw new Error("unknown supplier");

  const slugIn = String(form.get("slug") ?? "").trim();
  const slug = await uniqueSlug("operators", slugify(slugIn || name));
  const category = String(form.get("category") ?? "").trim() || null;
  const region = String(form.get("region") ?? "").trim() || null;
  const primaryLang = String(form.get("primary_lang") ?? "en").trim() || "en";
  const country = String(form.get("country") ?? "NZ").trim().slice(0, 60) || "NZ";
  await db()
    .prepare(
      `INSERT INTO operators (id, slug, name, supplier_id, country, primary_lang, category, region, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
    )
    .bind(shortId("op"), slug, name, supplierId, country, primaryLang, category, region)
    .run();
  revalidatePath("/admin");
}

export async function grantSupplierMembership(form: FormData) {
  await requireAdmin();
  const userId = String(form.get("user_id") ?? "");
  const supplierId = String(form.get("supplier_id") ?? "");
  const role = String(form.get("role") ?? "manager");
  if (!userId || !supplierId) throw new Error("missing fields");
  if (!["owner", "manager", "viewer"].includes(role)) throw new Error("invalid role");
  await db()
    .prepare(
      `INSERT INTO supplier_memberships (user_id, supplier_id, role)
       VALUES (?, ?, ?)
       ON CONFLICT(user_id, supplier_id) DO UPDATE SET role = excluded.role`,
    )
    .bind(userId, supplierId, role)
    .run();
  revalidatePath("/admin");
}

export async function revokeSupplierMembership(form: FormData) {
  await requireAdmin();
  const userId = String(form.get("user_id") ?? "");
  const supplierId = String(form.get("supplier_id") ?? "");
  if (!userId || !supplierId) throw new Error("missing fields");
  await db()
    .prepare(`DELETE FROM supplier_memberships WHERE user_id = ? AND supplier_id = ?`)
    .bind(userId, supplierId)
    .run();
  revalidatePath("/admin");
}
