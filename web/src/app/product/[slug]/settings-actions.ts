"use server";

import { db } from "@/lib/db";
import { requireOperatorMembership } from "@/lib/roles";
import { RTO_SET } from "@/lib/rto";
import { revalidatePath } from "next/cache";

function shortId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export interface ProductMemberRow {
  user_id: string;
  email: string;
  name: string | null;
  role: string;
}

/** List members with editor/admin access to THIS product. */
export async function listProductMembers(
  operatorSlug: string,
): Promise<{ ok: boolean; members?: ProductMemberRow[]; error?: string }> {
  try {
    const access = await requireOperatorMembership(operatorSlug);
    const { results = [] } = await db()
      .prepare(
        `SELECT om.user_id, om.role, u.email, u.name
         FROM operator_memberships om JOIN users u ON u.id = om.user_id
         WHERE om.operator_id = ? ORDER BY (om.role='admin') DESC, u.email`,
      )
      .bind(access.operatorId)
      .all<ProductMemberRow>();
    return { ok: true, members: results };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "failed" };
  }
}

/** Caller must be a product admin, the supplier's owner/manager, or platform admin. */
async function assertProductManager(operatorSlug: string) {
  const access = await requireOperatorMembership(operatorSlug);
  if (access.isAdmin) return access;
  const om = await db()
    .prepare(`SELECT role FROM operator_memberships WHERE user_id = ? AND operator_id = ?`)
    .bind(access.userId, access.operatorId)
    .first<{ role: string }>();
  if (om?.role === "admin") return access;
  const sm = await db()
    .prepare(
      `SELECT sm.role FROM supplier_memberships sm
       JOIN operators o ON o.supplier_id = sm.supplier_id
       WHERE sm.user_id = ? AND o.id = ?`,
    )
    .bind(access.userId, access.operatorId)
    .first<{ role: string }>();
  if (sm && ["owner", "manager"].includes(sm.role)) return access;
  throw new Error("forbidden");
}

/** Grant a user editor/admin access to this product by email (invites new users). */
export async function addProductMember(
  operatorSlug: string,
  email: string,
  role: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const access = await assertProductManager(operatorSlug);
    const e = email.trim().toLowerCase().slice(0, 200);
    if (!e || !e.includes("@")) throw new Error("valid email required");
    const r = ["editor", "admin"].includes(role) ? role : "editor";
    const existing = await db().prepare(`SELECT id FROM users WHERE email = ?`).bind(e).first<{ id: string }>();
    let userId = existing?.id;
    if (!userId) {
      userId = shortId("usr");
      await db().prepare(`INSERT INTO users (id, email, preferred_lang) VALUES (?, ?, 'en')`).bind(userId, e).run();
    }
    await db()
      .prepare(
        `INSERT INTO operator_memberships (user_id, operator_id, role) VALUES (?, ?, ?)
         ON CONFLICT(user_id, operator_id) DO UPDATE SET role = excluded.role`,
      )
      .bind(userId, access.operatorId, r)
      .run();
    revalidatePath(`/product/${operatorSlug}/settings`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "failed" };
  }
}

export async function removeProductMember(
  operatorSlug: string,
  userId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const access = await assertProductManager(operatorSlug);
    await db()
      .prepare(`DELETE FROM operator_memberships WHERE user_id = ? AND operator_id = ?`)
      .bind(userId, access.operatorId)
      .run();
    revalidatePath(`/product/${operatorSlug}/settings`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "failed" };
  }
}

function clean(v: FormDataEntryValue | null, max = 500): string | null {
  const s = String(v ?? "").trim().slice(0, max);
  return s.length ? s : null;
}

function cleanLinks(v: FormDataEntryValue | null): string {
  try {
    const arr = JSON.parse(String(v ?? "[]"));
    if (!Array.isArray(arr)) return "[]";
    return JSON.stringify(
      arr
        .map((e) => ({
          label: String(e?.label ?? "").trim().slice(0, 60),
          url: String(e?.url ?? "").trim().slice(0, 400),
        }))
        .filter((e) => e.url && /^https?:\/\//i.test(e.url))
        .slice(0, 12),
    );
  } catch {
    return "[]";
  }
}

const CATEGORIES = new Set([
  "attractions", "adventure", "culture", "water", "land", "air", "accommodation", "tour", "rto",
]);

/**
 * Update a Product's (operator's) profile. Identity-critical columns (slug,
 * status, supplier_id) and visual theme/cover (managed in the Branding panel)
 * are not editable here. Returns {ok,error} to dodge Next prod redaction.
 */
export async function updateProductProfile(
  form: FormData,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const operatorSlug = String(form.get("operator_slug") ?? "");
    if (!operatorSlug) throw new Error("missing operator_slug");
    const access = await requireOperatorMembership(operatorSlug);

    const name = clean(form.get("name"), 200);
    if (!name) throw new Error("name is required");

    const categoryRaw = clean(form.get("category"), 40);
    const regionRaw = clean(form.get("region"), 80);
    const category = categoryRaw && CATEGORIES.has(categoryRaw) ? categoryRaw : null;
    const region = regionRaw && RTO_SET.has(regionRaw) ? regionRaw : null;
    const primaryLang = clean(form.get("primary_lang"), 16) ?? "en";

    await db()
      .prepare(
        `UPDATE operators SET
           name = ?, display_name = ?, intro = ?, website = ?,
           country = ?, region = ?, category = ?, nzbn = ?,
           contact_email = ?, phone = ?, address = ?,
           primary_lang = ?, timezone = ?,
           poc_name = ?, poc_title = ?, poc_email = ?, poc_phone = ?,
           links_json = ?
         WHERE id = ?`,
      )
      .bind(
        name,
        clean(form.get("display_name"), 200),
        clean(form.get("intro"), 2000),
        clean(form.get("website"), 400),
        clean(form.get("country"), 60) ?? "NZ",
        region,
        category,
        clean(form.get("nzbn"), 40),
        clean(form.get("contact_email"), 200),
        clean(form.get("phone"), 60),
        clean(form.get("address"), 400),
        primaryLang,
        clean(form.get("timezone"), 60),
        clean(form.get("poc_name"), 120),
        clean(form.get("poc_title"), 120),
        clean(form.get("poc_email"), 200),
        clean(form.get("poc_phone"), 60),
        cleanLinks(form.get("links_json")),
        access.operatorId,
      )
      .run();

    revalidatePath(`/product/${operatorSlug}`);
    revalidatePath(`/product/${operatorSlug}/settings`);
    revalidatePath(`/products/${operatorSlug}`);
    revalidatePath(`/explore`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "failed" };
  }
}
