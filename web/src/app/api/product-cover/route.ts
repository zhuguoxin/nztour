/**
 * Serve a product's (operator's) cover image from R2.
 *
 *   GET /api/product-cover?slug=<operator_slug>   → bytes
 *
 * Reads operators.cover_r2_key (a media-library asset key chosen via the media
 * picker). Public — product covers are shown on public cards. Selection /
 * upload happen through the media library (/api/media + setCoverFromMedia).
 */
import { db } from "@/lib/db";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const dynamic = "force-dynamic";

const EXT_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");
  if (!slug) return new Response("missing slug", { status: 400 });

  const row = await db()
    .prepare(`SELECT cover_r2_key FROM operators WHERE slug = ?`)
    .bind(slug)
    .first<{ cover_r2_key: string | null }>();
  if (!row?.cover_r2_key) return new Response("not found", { status: 404 });

  const { env } = getCloudflareContext();
  const obj = await env.ASSETS_BUCKET.get(row.cover_r2_key);
  if (!obj) return new Response("not found", { status: 404 });

  const ext = row.cover_r2_key.split(".").pop()?.toLowerCase() ?? "jpg";
  return new Response(obj.body, {
    headers: {
      "content-type": obj.httpMetadata?.contentType || EXT_TYPES[ext] || "image/jpeg",
      "cache-control": "public, max-age=30, must-revalidate",
    },
  });
}
