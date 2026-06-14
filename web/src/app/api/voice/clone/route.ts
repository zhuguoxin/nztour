/**
 * POST /api/voice/clone — clone a sales rep's voice from a 30-90s audio sample
 * using MiniMax voice cloning.
 *
 * Body (multipart):
 *   file           — wav / mp3 / m4a sample (10 s–5 min, ≤ 20 MB)
 *   supplier_slug  — voice belongs to this supplier (shared across its products)
 *   name           — display label e.g. "Maya — sales lead"
 *   gender         — male | female | neutral  (UI hint only)
 *   langs          — JSON array of language codes the clone may narrate
 *   voice_id       — (optional) re-record an existing cloned voice in place
 *                    instead of creating a new one
 *
 * Auth: supplier_membership for `supplier_slug` (or platform admin).
 * Metadata-only edits (rename / change languages without a new recording) go
 * to /api/voice/update.
 *
 * Flow:
 *   1. Validate + upload sample to R2 under voices/<voice_id>/sample.<ext>
 *   2. Insert voice_profiles row provider='minimax', kind='cloned',
 *      langs=<the languages the supplier picked> (so it only surfaces in those
 *      languages' voice dropdowns), status='pending'
 *   3. Upload sample to MiniMax → file_id; clone → custom MiniMax voice_id
 *   4. Update row external_id=<minimax voice_id>, status='active'
 *   5. On failure: status='failed' with status_detail
 *
 * If MINIMAX_API_KEY isn't set the route returns 503.
 */
import { db } from "@/lib/db";
import { requireSupplierMembership } from "@/lib/roles";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import {
  hasMiniMaxKey,
  uploadCloneSample,
  cloneVoice,
  newMiniMaxVoiceId,
} from "@/lib/minimax";

export const dynamic = "force-dynamic";

const MAX_BYTES = 20 * 1024 * 1024;
const ALLOWED_EXT: Record<string, string> = {
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/wave": "wav",
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/mp4": "m4a",
  "audio/m4a": "m4a",
  "audio/x-m4a": "m4a",
};

function shortId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export async function POST(req: Request) {
  if (!hasMiniMaxKey()) {
    return new Response(
      "MiniMax not configured. Set MINIMAX_API_KEY via `wrangler secret put MINIMAX_API_KEY`.",
      { status: 503 },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return new Response("invalid multipart body", { status: 400 });
  }
  const supplierSlug = String(form.get("supplier_slug") ?? "");
  const name = String(form.get("name") ?? "").trim().slice(0, 80);
  const gender = String(form.get("gender") ?? "neutral");
  const file = form.get("file");
  if (!supplierSlug || !name || !(file instanceof Blob)) {
    return new Response("missing required fields", { status: 400 });
  }
  // Languages this cloned voice may narrate. Stored as a JSON array so it only
  // surfaces in those languages' voice dropdowns. "zh" covers both zh-CN and
  // zh-TW via the editor's base-code match. Empty/absent → universal (NULL).
  const ALLOWED_LANGS = new Set(["en", "zh", "ja", "ko", "es", "fr", "de", "pt"]);
  let langsJson: string | null = null;
  const rawLangs = form.get("langs");
  if (typeof rawLangs === "string" && rawLangs.trim()) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawLangs);
    } catch {
      return new Response("invalid langs", { status: 400 });
    }
    if (!Array.isArray(parsed)) return new Response("invalid langs", { status: 400 });
    const clean = [...new Set(parsed.map(String))].filter((c) => ALLOWED_LANGS.has(c));
    if (clean.length === 0) return new Response("pick at least one language", { status: 400 });
    langsJson = JSON.stringify(clean);
  } else {
    return new Response("pick at least one language", { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return new Response(`file exceeds ${MAX_BYTES} bytes`, { status: 413 });
  }
  const mime = file.type || "application/octet-stream";
  const ext = ALLOWED_EXT[mime];
  if (!ext) return new Response(`unsupported audio type: ${mime} (use mp3 / wav / m4a)`, { status: 415 });

  let access;
  try {
    access = await requireSupplierMembership(supplierSlug);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "forbidden";
    return new Response(msg, { status: msg === "unauthorised" ? 401 : 403 });
  }

  // Re-record path: an existing cloned voice owned by this supplier gets a new
  // sample (and refreshed name/gender/langs). Otherwise we insert a new row.
  const existingId = String(form.get("voice_id") ?? "").trim();
  let voiceRowId: string;
  if (existingId) {
    const row = await db()
      .prepare(
        `SELECT id FROM voice_profiles
         WHERE id = ? AND supplier_id = ? AND kind = 'cloned'`,
      )
      .bind(existingId, access.supplierId)
      .first<{ id: string }>();
    if (!row) return new Response("voice not found", { status: 404 });
    voiceRowId = existingId;
  } else {
    voiceRowId = shortId("voice");
  }

  const sampleKey = `voices/${voiceRowId}/sample.${ext}`;
  const { env } = getCloudflareContext();
  const bytes = new Uint8Array(await file.arrayBuffer());

  // 1) Stash the sample in R2 so we keep the original for re-cloning.
  await env.ASSETS_BUCKET.put(sampleKey, bytes, { httpMetadata: { contentType: mime } });

  // 2) Pending row (insert new, or flip an existing one back to pending while
  //    its new sample re-clones). langs restricts which language dropdowns this
  //    voice shows in (the supplier picked them at clone time).
  if (existingId) {
    await db()
      .prepare(
        `UPDATE voice_profiles
           SET name = ?, gender = ?, langs = ?, sample_r2_key = ?,
               status = 'pending', status_detail = NULL
         WHERE id = ?`,
      )
      .bind(name, gender, langsJson, sampleKey, voiceRowId)
      .run();
  } else {
    await db()
      .prepare(
        `INSERT INTO voice_profiles
           (id, supplier_id, name, provider, kind, gender, langs, sample_r2_key, status, created_by)
         VALUES (?, ?, ?, 'minimax', 'cloned', ?, ?, ?, 'pending', ?)`,
      )
      .bind(voiceRowId, access.supplierId, name, gender, langsJson, sampleKey, access.userId)
      .run();
  }

  // 3) Upload to MiniMax + clone.
  try {
    const { fileId } = await uploadCloneSample({
      bytes,
      filename: `sample.${ext}`,
      mime,
    });
    const mmxVoiceId = newMiniMaxVoiceId(`${access.supplierId}${voiceRowId}`);
    await cloneVoice({ fileId, voiceId: mmxVoiceId });

    await db()
      .prepare(`UPDATE voice_profiles SET external_id = ?, status = 'active' WHERE id = ?`)
      .bind(mmxVoiceId, voiceRowId)
      .run();
    return Response.json({ ok: true, voice_id: voiceRowId, external_id: mmxVoiceId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    await db()
      .prepare(`UPDATE voice_profiles SET status = 'failed', status_detail = ? WHERE id = ?`)
      .bind(msg.slice(0, 500), voiceRowId)
      .run();
    return new Response(msg, { status: 502 });
  }
}
