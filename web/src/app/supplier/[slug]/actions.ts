"use server";

import { db } from "@/lib/db";
import { requireSupplierMembership } from "@/lib/roles";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hasMiniMaxKey } from "@/lib/minimax";
import type { VoiceRow } from "./voices-panel";
import { listGlossaryEntries, type GlossaryRow } from "@/lib/glossary";

/** Glossary entries for the supplier (for the glossary modal). */
export async function listSupplierGlossary(
  supplierSlug: string,
): Promise<{ ok: boolean; entries?: GlossaryRow[]; error?: string }> {
  try {
    const access = await requireSupplierMembership(supplierSlug);
    const entries = await listGlossaryEntries({ supplierId: access.supplierId });
    return { ok: true, entries };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "failed" };
  }
}

/** Billing fields for the supplier (for the billing modal). */
export async function getSupplierBilling(
  supplierSlug: string,
): Promise<{ ok: boolean; billing_email?: string | null; plan_tier?: string; error?: string }> {
  try {
    const access = await requireSupplierMembership(supplierSlug);
    const row = await db()
      .prepare(`SELECT plan_tier, billing_email FROM suppliers WHERE id = ?`)
      .bind(access.supplierId)
      .first<{ plan_tier: string; billing_email: string | null }>();
    return { ok: true, billing_email: row?.billing_email ?? null, plan_tier: row?.plan_tier ?? "free" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "failed" };
  }
}

/** List a supplier's voices (cloned + platform stock) for the voices modal. */
export async function listSupplierVoices(
  supplierSlug: string,
): Promise<{ ok: boolean; voices?: VoiceRow[]; hasXIKey?: boolean; error?: string }> {
  try {
    const access = await requireSupplierMembership(supplierSlug);
    const { results = [] } = await db()
      .prepare(
        `SELECT id, name, provider, external_id, kind, gender, langs, status, status_detail, created_at
         FROM voice_profiles WHERE supplier_id = ? OR supplier_id IS NULL
         ORDER BY (supplier_id IS NULL) DESC, created_at DESC`,
      )
      .bind(access.supplierId)
      .all<VoiceRow>();
    return { ok: true, voices: results, hasXIKey: hasMiniMaxKey() };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "failed" };
  }
}

const CATEGORY_SET = new Set(["snow", "adventure", "cruise", "hiking", "stay", "entertainment"]);
const REGION_SET = new Set([
  "queenstown", "fiordland", "aoraki", "rotorua", "auckland", "waikato", "canterbury", "australia",
]);

function shortId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
function slugify(s: string): string {
  return (
    s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9\s-]/g, "").trim()
      .replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 50) || `x-${Date.now().toString(36)}`
  );
}
async function uniqueOperatorSlug(base: string): Promise<string> {
  let slug = base;
  for (let i = 0; i < 5; i++) {
    const hit = await db().prepare(`SELECT 1 AS x FROM operators WHERE slug = ?`).bind(slug).first<{ x: number }>();
    if (!hit) return slug;
    slug = `${base}-${Math.random().toString(36).slice(2, 5)}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

/**
 * Create a product (operator) under a supplier. Supplier-scoped: any manager of
 * the supplier can add products (no platform-admin needed). Redirects back to
 * the supplier panel on success.
 */
export async function createProduct(form: FormData) {
  const supplierSlug = String(form.get("supplier_slug") ?? "");
  if (!supplierSlug) throw new Error("missing supplier_slug");
  const access = await requireSupplierMembership(supplierSlug);

  const name = String(form.get("name") ?? "").trim().slice(0, 200);
  if (!name) throw new Error("name required");
  const slug = await uniqueOperatorSlug(slugify(String(form.get("slug") ?? "").trim() || name));
  const categoryRaw = String(form.get("category") ?? "").trim();
  const regionRaw = String(form.get("region") ?? "").trim();
  const category = CATEGORY_SET.has(categoryRaw) ? categoryRaw : null;
  const region = REGION_SET.has(regionRaw) ? regionRaw : null;
  const primaryLang = String(form.get("primary_lang") ?? "en").trim() || "en";

  await db()
    .prepare(
      `INSERT INTO operators (id, slug, name, supplier_id, country, primary_lang, category, region, status)
       VALUES (?, ?, ?, ?, 'NZ', ?, ?, ?, 'active')`,
    )
    .bind(shortId("op"), slug, name, access.supplierId, primaryLang, category, region)
    .run();

  revalidatePath(`/supplier/${supplierSlug}`);
  redirect(`/supplier/${supplierSlug}`);
}

/** Trim + cap a text field; empty string → null so we don't store blanks. */
function clean(v: FormDataEntryValue | null, max = 500): string | null {
  const s = String(v ?? "").trim().slice(0, max);
  return s.length ? s : null;
}

/** Normalise the social/booking links JSON: array of {label,url}, http(s) only. */
function cleanLinks(v: FormDataEntryValue | null): string {
  try {
    const arr = JSON.parse(String(v ?? "[]"));
    if (!Array.isArray(arr)) return "[]";
    const out = arr
      .map((e) => ({
        label: String(e?.label ?? "").trim().slice(0, 60),
        url: String(e?.url ?? "").trim().slice(0, 400),
      }))
      .filter((e) => e.url && /^https?:\/\//i.test(e.url))
      .slice(0, 12);
    return JSON.stringify(out);
  } catch {
    return "[]";
  }
}

/**
 * Update a supplier's editable profile fields. Identity-critical columns
 * (slug, plan_tier, status) are intentionally NOT editable here — those are
 * platform-admin concerns. Returns {ok,error} to avoid Next prod redaction.
 */
export async function updateSupplierProfile(
  form: FormData,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supplierSlug = String(form.get("supplier_slug") ?? "");
    if (!supplierSlug) throw new Error("missing supplier_slug");
    const access = await requireSupplierMembership(supplierSlug);

    const name = clean(form.get("name"), 200);
    if (!name) throw new Error("name is required");

    await db()
      .prepare(
        `UPDATE suppliers SET
           name = ?, legal_name = ?, intro = ?, website = ?,
           country = ?, hq_city = ?, address = ?,
           contact_email = ?, phone = ?, billing_email = ?,
           poc_name = ?, poc_title = ?, poc_email = ?, poc_phone = ?,
           links_json = ?, default_lang = ?, timezone = ?
         WHERE id = ?`,
      )
      .bind(
        name,
        clean(form.get("legal_name"), 200),
        clean(form.get("intro"), 2000),
        clean(form.get("website"), 400),
        clean(form.get("country"), 60) ?? "NZ",
        clean(form.get("hq_city"), 120),
        clean(form.get("address"), 400),
        clean(form.get("contact_email"), 200),
        clean(form.get("phone"), 60),
        clean(form.get("billing_email"), 200),
        clean(form.get("poc_name"), 120),
        clean(form.get("poc_title"), 120),
        clean(form.get("poc_email"), 200),
        clean(form.get("poc_phone"), 60),
        cleanLinks(form.get("links_json")),
        clean(form.get("default_lang"), 16),
        clean(form.get("timezone"), 60),
        access.supplierId,
      )
      .run();

    revalidatePath(`/supplier/${supplierSlug}`);
    revalidatePath(`/supplier/${supplierSlug}/profile`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "failed" };
  }
}

/** Update just the billing fields (billing email). Plan tier / status stay
 *  platform-admin concerns and are not editable here. */
export async function updateSupplierBilling(
  form: FormData,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supplierSlug = String(form.get("supplier_slug") ?? "");
    if (!supplierSlug) throw new Error("missing supplier_slug");
    await requireSupplierMembership(supplierSlug);
    await db()
      .prepare(`UPDATE suppliers SET billing_email = ? WHERE slug = ?`)
      .bind(clean(form.get("billing_email"), 200), supplierSlug)
      .run();
    revalidatePath(`/supplier/${supplierSlug}/billing`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "failed" };
  }
}
