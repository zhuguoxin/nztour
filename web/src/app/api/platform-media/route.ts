/**
 * Platform public asset library.
 *
 *   POST   /api/platform-media          multipart {file}   → upload (admin)
 *   POST   /api/platform-media?remove=1 multipart {id}      → delete (admin)
 *   GET    /api/platform-media?id=<id>                       → serve bytes (public)
 *
 * Stored in R2 under media/platform/<id>.<ext>; a platform_media row is the
 * library record. Uploads/deletes require platform-admin. GET is public (the
 * assets back public covers / courseware).
 */
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/roles";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};
const EXT_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
};

function newId() {
  return `pmedia_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return new Response("missing id", { status: 400 });

  const row = await db()
    .prepare(`SELECT r2_key, mime FROM platform_media WHERE id = ?`)
    .bind(id)
    .first<{ r2_key: string; mime: string }>();
  if (!row) return new Response("not found", { status: 404 });

  const { env } = getCloudflareContext();
  const obj = await env.ASSETS_BUCKET.get(row.r2_key);
  if (!obj) return new Response("not found", { status: 404 });

  const ext = row.r2_key.split(".").pop()?.toLowerCase() ?? "jpg";
  return new Response(obj.body, {
    headers: {
      "content-type": obj.httpMetadata?.contentType || row.mime || EXT_TYPES[ext] || "image/jpeg",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}

export async function POST(req: Request) {
  let userId: string;
  try {
    userId = await requireAdmin();
  } catch {
    return new Response("forbidden", { status: 403 });
  }

  const url = new URL(req.url);
  const remove = url.searchParams.get("remove") === "1";

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return new Response("invalid multipart body", { status: 400 });
  }
  const { env } = getCloudflareContext();

  if (remove) {
    const id = String(form.get("id") ?? "");
    if (!id) return new Response("missing id", { status: 400 });
    const row = await db()
      .prepare(`SELECT r2_key FROM platform_media WHERE id = ?`)
      .bind(id)
      .first<{ r2_key: string }>();
    if (row?.r2_key) await env.ASSETS_BUCKET.delete(row.r2_key).catch(() => {});
    await db().prepare(`DELETE FROM platform_media WHERE id = ?`).bind(id).run();
    return Response.json({ ok: true, removed: true });
  }

  const file = form.get("file");
  if (!(file instanceof Blob)) return new Response("file required", { status: 400 });
  if (file.size > MAX_BYTES) return new Response(`file exceeds ${MAX_BYTES} bytes`, { status: 413 });
  const mime = file.type || "application/octet-stream";
  const ext = ALLOWED[mime];
  if (!ext) return new Response(`unsupported type: ${mime}`, { status: 415 });

  const id = newId();
  const key = `media/platform/${id}.${ext}`;
  await env.ASSETS_BUCKET.put(key, file.stream(), { httpMetadata: { contentType: mime } });

  const filename = file instanceof File ? file.name.slice(0, 200) : null;
  await db()
    .prepare(
      `INSERT INTO platform_media (id, r2_key, filename, mime, size_bytes, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(id, key, filename, mime, file.size, userId)
    .run();

  return Response.json({ id, r2_key: key, mime, url: `/api/platform-media?id=${id}` });
}
