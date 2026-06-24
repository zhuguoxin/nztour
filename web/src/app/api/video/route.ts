/**
 * GET /api/video?id=<block_id> — stream an uploaded video block from R2.
 *
 * Supports HTTP Range requests so the <video> player can seek. Public — videos
 * embedded in published courses are public content (same policy as /api/image).
 */
import { db } from "@/lib/db";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const dynamic = "force-dynamic";

const EXT_TYPES: Record<string, string> = {
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  ogv: "video/ogg",
};

export async function GET(req: Request) {
  const blockId = new URL(req.url).searchParams.get("id");
  if (!blockId) return new Response("missing id", { status: 400 });

  const row = await db()
    .prepare(`SELECT video_r2_key FROM content_blocks WHERE id = ?`)
    .bind(blockId)
    .first<{ video_r2_key: string | null }>();
  if (!row?.video_r2_key) return new Response("not found", { status: 404 });

  const { env } = getCloudflareContext();
  const ext = row.video_r2_key.split(".").pop()?.toLowerCase() ?? "";
  const contentType = EXT_TYPES[ext] || "video/mp4";

  // Range request → 206 partial content so the player can seek.
  const rangeHeader = req.headers.get("range");
  const m = rangeHeader?.match(/bytes=(\d+)-(\d*)/);
  if (m) {
    const head = await env.ASSETS_BUCKET.head(row.video_r2_key);
    const total = head?.size ?? 0;
    const start = parseInt(m[1], 10);
    const end = m[2] ? Math.min(parseInt(m[2], 10), total - 1) : total - 1;
    if (total && start <= end) {
      const obj = await env.ASSETS_BUCKET.get(row.video_r2_key, {
        range: { offset: start, length: end - start + 1 },
      });
      if (obj) {
        return new Response(obj.body, {
          status: 206,
          headers: {
            "content-type": contentType,
            "accept-ranges": "bytes",
            "content-range": `bytes ${start}-${end}/${total}`,
            "content-length": String(end - start + 1),
            "cache-control": "public, max-age=3600",
          },
        });
      }
    }
  }

  const obj = await env.ASSETS_BUCKET.get(row.video_r2_key);
  if (!obj) return new Response("not found", { status: 404 });
  return new Response(obj.body, {
    headers: {
      "content-type": contentType,
      "accept-ranges": "bytes",
      "content-length": String(obj.size),
      "cache-control": "public, max-age=3600",
    },
  });
}
