/**
 * GET /api/image?id=<block_id> — serve a content block's image from R2.
 *
 * Same query-string pattern as /api/audio (OpenNext-Cloudflare doesn't like
 * dynamic [param] segments for R2-streaming routes).
 *
 * Public — images embedded in published courses are public content; agents
 * can preview them while a course is in draft via the same URL (the route
 * doesn't authorize the viewer, only the upload).
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
  const blockId = url.searchParams.get("id");
  if (!blockId) return new Response("missing id", { status: 400 });
  // ?n=<index> → serve an extra slide from images_json (multi-image block).
  const nParam = url.searchParams.get("n");

  const row = await db()
    .prepare(`SELECT image_r2_key, images_json FROM content_blocks WHERE id = ?`)
    .bind(blockId)
    .first<{ image_r2_key: string | null; images_json: string | null }>();

  let r2Key: string | null = row?.image_r2_key ?? null;
  if (nParam !== null) {
    const n = parseInt(nParam, 10);
    let list: string[] = [];
    try {
      const v = JSON.parse(row?.images_json ?? "[]");
      if (Array.isArray(v)) list = v.filter((s): s is string => typeof s === "string");
    } catch {
      /* ignore */
    }
    r2Key = Number.isInteger(n) && n >= 0 && n < list.length ? list[n] : null;
  }
  if (!r2Key) return new Response("not found", { status: 404 });

  const { env } = getCloudflareContext();
  const obj = await env.ASSETS_BUCKET.get(r2Key);
  if (!obj) return new Response("not found", { status: 404 });

  const ext = r2Key.split(".").pop()?.toLowerCase() ?? "";
  const contentType =
    obj.httpMetadata?.contentType || EXT_TYPES[ext] || "application/octet-stream";

  return new Response(obj.body, {
    headers: {
      "content-type": contentType,
      // Same-key images can be replaced — keep cache shorter than audio so
      // operators see updated previews promptly.
      "cache-control": "public, max-age=300, must-revalidate",
    },
  });
}
