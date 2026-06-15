"use server";

import { db } from "@/lib/db";
import { requireOperatorMembership } from "@/lib/roles";
import { revalidatePath } from "next/cache";

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

const CATEGORIES = new Set(["snow", "adventure", "cruise", "hiking", "stay", "entertainment"]);
const REGIONS = new Set([
  "queenstown", "fiordland", "aoraki", "rotorua", "auckland", "waikato", "canterbury", "australia",
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
    const regionRaw = clean(form.get("region"), 40);
    const category = categoryRaw && CATEGORIES.has(categoryRaw) ? categoryRaw : null;
    const region = regionRaw && REGIONS.has(regionRaw) ? regionRaw : null;
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
