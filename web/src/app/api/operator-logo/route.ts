/**
 * Operator logo: upload (POST), remove (POST ?remove=1), and serve (GET ?slug=).
 *
 *   POST /api/operator-logo            multipart {file, operator_slug}  → store
 *   POST /api/operator-logo?remove=1   multipart {operator_slug}        → clear
 *   GET  /api/operator-logo?slug=<s>                                    → bytes
 *
 * Stored in R2 under logos/<operator_id>.<ext>; key written to
 * operators.theme_logo_r2_key. Mutations require operator membership; GET is
 * public (logos are public brand assets shown on /learn and /verify).
 */
import { db } from "@/lib/db";
import { requireOperatorMembership } from "@/lib/roles";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

const MAX_BYTES = 1024 * 1024; // 1 MB
const ALLOWED: Record<string, string> = {
  "image/png": "png",
  "image/svg+xml": "svg",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

const EXT_TYPES: Record<string, string> = {
  png: "image/png",
  svg: "image/svg+xml",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");
  if (!slug) return new Response("missing slug", { status: 400 });

  const row = await db()
    .prepare(`SELECT theme_logo_r2_key FROM operators WHERE slug = ?`)
    .bind(slug)
    .first<{ theme_logo_r2_key: string | null }>();
  if (!row?.theme_logo_r2_key) return new Response("not found", { status: 404 });

  const { env } = getCloudflareContext();
  const obj = await env.ASSETS_BUCKET.get(row.theme_logo_r2_key);
  if (!obj) return new Response("not found", { status: 404 });

  const ext = row.theme_logo_r2_key.split(".").pop()?.toLowerCase() ?? "png";
  return new Response(obj.body, {
    headers: {
      "content-type": obj.httpMetadata?.contentType || EXT_TYPES[ext] || "image/png",
      "cache-control": "public, max-age=300, must-revalidate",
    },
  });
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const remove = url.searchParams.get("remove") === "1";

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return new Response("invalid multipart body", { status: 400 });
  }
  const operatorSlug = String(form.get("operator_slug") ?? "");
  if (!operatorSlug) return new Response("missing operator_slug", { status: 400 });

  let access;
  try {
    access = await requireOperatorMembership(operatorSlug);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "forbidden";
    return new Response(msg, { status: msg === "unauthorised" ? 401 : 403 });
  }

  const { env } = getCloudflareContext();

  // Existing key (for replace/remove cleanup)
  const existing = await db()
    .prepare(`SELECT theme_logo_r2_key FROM operators WHERE id = ?`)
    .bind(access.operatorId)
    .first<{ theme_logo_r2_key: string | null }>();

  if (remove) {
    if (existing?.theme_logo_r2_key) {
      await env.ASSETS_BUCKET.delete(existing.theme_logo_r2_key).catch(() => {});
    }
    await db()
      .prepare(`UPDATE operators SET theme_logo_r2_key = NULL WHERE id = ?`)
      .bind(access.operatorId)
      .run();
    revalidatePath(`/operator/${operatorSlug}`);
    revalidatePath(`/learn/${operatorSlug}`, "layout");
    return Response.json({ ok: true, removed: true });
  }

  const file = form.get("file");
  if (!(file instanceof Blob)) return new Response("file required", { status: 400 });
  if (file.size > MAX_BYTES) return new Response(`file exceeds ${MAX_BYTES} bytes`, { status: 413 });
  const mime = file.type || "application/octet-stream";
  const ext = ALLOWED[mime];
  if (!ext) return new Response(`unsupported type: ${mime}`, { status: 415 });

  const key = `logos/${access.operatorId}.${ext}`;
  // Remove the old object if it had a different extension.
  if (existing?.theme_logo_r2_key && existing.theme_logo_r2_key !== key) {
    await env.ASSETS_BUCKET.delete(existing.theme_logo_r2_key).catch(() => {});
  }
  await env.ASSETS_BUCKET.put(key, file.stream(), { httpMetadata: { contentType: mime } });
  await db()
    .prepare(`UPDATE operators SET theme_logo_r2_key = ? WHERE id = ?`)
    .bind(key, access.operatorId)
    .run();

  revalidatePath(`/operator/${operatorSlug}`);
  revalidatePath(`/learn/${operatorSlug}`, "layout");
  return Response.json({ ok: true, key });
}
