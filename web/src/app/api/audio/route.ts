/**
 * Serve a block's voice-over mp3 from R2.
 *
 * GET /api/audio?id=<block_id>
 *
 * Query-string param rather than a dynamic segment to avoid an OpenNext-
 * Cloudflare bundling regression with /api/[param]/route — surfaces as
 * "TypeError: Cannot read properties of undefined (reading 'default')".
 *
 * Public — voice-overs are part of public course content and the cache
 * headers below allow CDN reuse across all listeners.
 */
import { db } from "@/lib/db";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const blockId = url.searchParams.get("id");
  if (!blockId) return new Response("missing id", { status: 400 });

  const row = await db()
    .prepare(`SELECT audio_r2_key FROM content_blocks WHERE id = ?`)
    .bind(blockId)
    .first<{ audio_r2_key: string | null }>();
  if (!row?.audio_r2_key) {
    return new Response("not found", { status: 404 });
  }

  const { env } = getCloudflareContext();
  const obj = await env.ASSETS_BUCKET.get(row.audio_r2_key);
  if (!obj) return new Response("not found", { status: 404 });

  return new Response(obj.body, {
    headers: {
      "content-type": "audio/mpeg",
      "cache-control": "public, max-age=31536000, immutable",
      "accept-ranges": "bytes",
    },
  });
}
