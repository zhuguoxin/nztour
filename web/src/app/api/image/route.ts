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

  const row = await db()
    .prepare(`SELECT image_r2_key FROM content_blocks WHERE id = ?`)
    .bind(blockId)
    .first<{ image_r2_key: string | null }>();
  if (!row?.image_r2_key) return new Response("not found", { status: 404 });

  const { env } = getCloudflareContext();
  const obj = await env.ASSETS_BUCKET.get(row.image_r2_key);
  if (!obj) return new Response("not found", { status: 404 });

  const ext = row.image_r2_key.split(".").pop()?.toLowerCase() ?? "";
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
