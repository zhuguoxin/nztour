/**
 * POST /api/voice/update — edit a cloned voice's metadata WITHOUT re-recording.
 *
 * Body (form or multipart):
 *   voice_id       — the cloned voice_profiles row to edit
 *   supplier_slug  — the owning supplier (auth scope)
 *   name           — new display label
 *   gender         — male | female | neutral
 *   langs          — JSON array of language codes the clone may narrate
 *
 * Auth: supplier_membership for `supplier_slug` (or platform admin). The row
 * must be a cloned voice owned by that supplier.
 *
 * Re-recording (new audio sample) goes to /api/voice/clone with a voice_id.
 */
import { db } from "@/lib/db";
import { requireSupplierMembership } from "@/lib/roles";

export const dynamic = "force-dynamic";

const ALLOWED_LANGS = new Set(["en", "zh", "ja", "ko", "es", "fr", "de", "pt"]);

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return new Response("invalid body", { status: 400 });
  }

  const voiceId = String(form.get("voice_id") ?? "").trim();
  const supplierSlug = String(form.get("supplier_slug") ?? "");
  const name = String(form.get("name") ?? "").trim().slice(0, 80);
  const gender = String(form.get("gender") ?? "neutral");
  if (!voiceId || !supplierSlug || !name) {
    return new Response("missing required fields", { status: 400 });
  }

  const rawLangs = form.get("langs");
  if (typeof rawLangs !== "string" || !rawLangs.trim()) {
    return new Response("pick at least one language", { status: 400 });
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawLangs);
  } catch {
    return new Response("invalid langs", { status: 400 });
  }
  if (!Array.isArray(parsed)) return new Response("invalid langs", { status: 400 });
  const clean = [...new Set(parsed.map(String))].filter((c) => ALLOWED_LANGS.has(c));
  if (clean.length === 0) return new Response("pick at least one language", { status: 400 });
  const langsJson = JSON.stringify(clean);

  let access;
  try {
    access = await requireSupplierMembership(supplierSlug);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "forbidden";
    return new Response(msg, { status: msg === "unauthorised" ? 401 : 403 });
  }

  const row = await db()
    .prepare(
      `SELECT id FROM voice_profiles
       WHERE id = ? AND supplier_id = ? AND kind = 'cloned'`,
    )
    .bind(voiceId, access.supplierId)
    .first<{ id: string }>();
  if (!row) return new Response("voice not found", { status: 404 });

  await db()
    .prepare(`UPDATE voice_profiles SET name = ?, gender = ?, langs = ? WHERE id = ?`)
    .bind(name, gender, langsJson, voiceId)
    .run();

  return Response.json({ ok: true });
}
