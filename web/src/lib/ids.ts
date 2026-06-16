import { db } from "./db";

/**
 * Shared id / slug helpers. Mirrors the inline copies in admin/actions.ts and
 * supplier/[slug]/actions.ts so new code (self-serve onboarding) has one
 * canonical source.
 */

/** Short prefixed id, e.g. shortId("sup") → "sup_lq8f3za1". */
export function shortId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** URL-safe slug from a free-text name. */
export function slugify(s: string): string {
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
export async function uniqueSlug(table: "suppliers" | "operators", base: string): Promise<string> {
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
