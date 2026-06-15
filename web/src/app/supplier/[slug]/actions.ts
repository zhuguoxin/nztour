"use server";

import { db } from "@/lib/db";
import { requireSupplierMembership } from "@/lib/roles";
import { revalidatePath } from "next/cache";

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
