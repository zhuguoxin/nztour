/**
 * Serve a block's voice-over mp3 from R2.
 *
 * GET /api/audio?id=<block_id>           — primary-language audio (legacy column)
 * GET /api/audio?id=<block_id>&lang=zh-CN — language-specific audio (audio_i18n map)
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
  const langParam = url.searchParams.get("lang");
  if (!blockId) return new Response("missing id", { status: 400 });

  const row = await db()
    .prepare(`SELECT audio_r2_key, audio_i18n FROM content_blocks WHERE id = ?`)
    .bind(blockId)
    .first<{ audio_r2_key: string | null; audio_i18n: string | null }>();
  if (!row) return new Response("not found", { status: 404 });

  // Resolve R2 key: with a lang param, look it up in audio_i18n map.
  // Without a lang param, serve the legacy audio_r2_key (primary lang).
  let key: string | null = row.audio_r2_key;
  if (langParam) {
    try {
      const map = JSON.parse(row.audio_i18n ?? "{}");
      const entry = map?.[langParam];
      key = entry?.r2_key ?? null;
    } catch {
      key = null;
    }
  }
  if (!key) return new Response("not found", { status: 404 });

  const { env } = getCloudflareContext();
  const obj = await env.ASSETS_BUCKET.get(key);
  if (!obj) return new Response("not found", { status: 404 });

  return new Response(obj.body, {
    headers: {
      "content-type": "audio/mpeg",
      "cache-control": "public, max-age=31536000, immutable",
      "accept-ranges": "bytes",
    },
  });
}
