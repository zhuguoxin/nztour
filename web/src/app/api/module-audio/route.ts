/**
 * Serve a MODULE's narration (voice-over) mp3 from R2.
 *
 * GET /api/module-audio?id=<module_id>&lang=zh-CN — the language's narration
 * GET /api/module-audio?id=<module_id>            — any available narration
 *
 * Module-level counterpart of /api/audio (which serves per-block audio).
 * Public — narration is part of public course content.
 */
import { db } from "@/lib/db";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const moduleId = url.searchParams.get("id");
  const langParam = url.searchParams.get("lang");
  if (!moduleId) return new Response("missing id", { status: 400 });

  const row = await db()
    .prepare(`SELECT narration_audio_i18n FROM modules WHERE id = ?`)
    .bind(moduleId)
    .first<{ narration_audio_i18n: string | null }>();
  if (!row) return new Response("not found", { status: 404 });

  let map: Record<string, { r2_key?: string }> = {};
  try {
    const v = JSON.parse(row.narration_audio_i18n ?? "{}");
    if (v && typeof v === "object") map = v;
  } catch {
    /* empty */
  }
  const entry = langParam ? map[langParam] : Object.values(map)[0];
  const key = entry?.r2_key ?? null;
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
