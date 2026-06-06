/**
 * POST /api/voice/clone — clone a sales rep's voice from a 30-90s audio sample.
 *
 * Body (multipart):
 *   file           — wav / mp3 / m4a / webm sample (≥ 10 s, ≤ 10 MB ideally)
 *   supplier_slug  — voice belongs to this supplier (visible only to its products)
 *   name           — display label e.g. "Maya — sales lead"
 *   gender         — male | female | neutral  (UI hint only)
 *
 * Auth: supplier_membership for `supplier_slug` (or platform admin).
 *
 * Flow:
 *   1. Validate + upload sample to R2 under voices/<voice_id>/sample.<ext>
 *   2. Insert voice_profiles row status='pending'
 *   3. POST sample to ElevenLabs IVC → voice_id
 *   4. Update row status='active' with external_id
 *   5. On failure: status='failed' with status_detail
 *
 * If XI_API_KEY isn't set the route returns 503 — the supplier UI must
 * already gate the "clone" button.
 */
import { db } from "@/lib/db";
import { requireSupplierMembership } from "@/lib/roles";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createVoiceFromSample, hasElevenLabsKey } from "@/lib/elevenlabs";

export const dynamic = "force-dynamic";

const MAX_BYTES = 12 * 1024 * 1024;
const ALLOWED_EXT: Record<string, string> = {
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/wave": "wav",
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/mp4": "m4a",
  "audio/m4a": "m4a",
  "audio/webm": "webm",
  "audio/ogg": "ogg",
};

function shortId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export async function POST(req: Request) {
  if (!hasElevenLabsKey()) {
    return new Response(
      "ElevenLabs not configured. Set XI_API_KEY via `wrangler secret put XI_API_KEY`.",
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
  if (file.size > MAX_BYTES) {
    return new Response(`file exceeds ${MAX_BYTES} bytes`, { status: 413 });
  }
  const mime = file.type || "application/octet-stream";
  const ext = ALLOWED_EXT[mime];
  if (!ext) return new Response(`unsupported audio type: ${mime}`, { status: 415 });

  let access;
  try {
    access = await requireSupplierMembership(supplierSlug);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "forbidden";
    return new Response(msg, { status: msg === "unauthorised" ? 401 : 403 });
  }

  const voiceId = shortId("voice");
  const sampleKey = `voices/${voiceId}/sample.${ext}`;
  const { env } = getCloudflareContext();

  // 1) Upload the sample to R2 first so we still have it if the IVC step fails.
  const bytes = new Uint8Array(await file.arrayBuffer());
  await env.ASSETS_BUCKET.put(sampleKey, bytes, {
    httpMetadata: { contentType: mime },
  });

  // 2) Insert pending row
  await db()
    .prepare(
      `INSERT INTO voice_profiles
         (id, supplier_id, name, provider, kind, gender, sample_r2_key, status, created_by)
       VALUES (?, ?, ?, 'elevenlabs', 'cloned', ?, ?, 'pending', ?)`,
    )
    .bind(voiceId, access.supplierId, name, gender, sampleKey, access.userId)
    .run();

  // 3) Call ElevenLabs IVC
  try {
    const { voiceId: externalId } = await createVoiceFromSample({
      name: `${access.supplierId}/${name}`,
      description: `Cloned voice for supplier ${access.supplierId} — managed via Libretour`,
      samples: [{ filename: `sample.${ext}`, bytes, mime }],
      labels: { gender, source: "libretour" },
    });
    await db()
      .prepare(
        `UPDATE voice_profiles SET external_id = ?, status = 'active' WHERE id = ?`,
      )
      .bind(externalId, voiceId)
      .run();
    return Response.json({ ok: true, voice_id: voiceId, external_id: externalId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    await db()
      .prepare(`UPDATE voice_profiles SET status = 'failed', status_detail = ? WHERE id = ?`)
      .bind(msg.slice(0, 500), voiceId)
      .run();
    return new Response(msg, { status: 502 });
  }
}
