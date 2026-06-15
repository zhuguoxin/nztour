/**
 * Supplier media library.
 *
 *   POST /api/media          multipart {file, supplier_slug}  → upload + add to library
 *   GET  /api/media?id=<id>                                   → serve bytes (public)
 *
 * Stored in R2 under media/<supplier_id>/<media_id>.<ext>; a media_assets row
 * is the library record. Mutations require supplier membership; GET is public
 * (library images back public covers and courseware).
 */
import { db } from "@/lib/db";
import { requireSupplierMembership } from "@/lib/roles";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
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
  return `media_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return new Response("missing id", { status: 400 });

  const row = await db()
    .prepare(`SELECT r2_key, mime FROM media_assets WHERE id = ?`)
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
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return new Response("invalid multipart body", { status: 400 });
  }
  const supplierSlug = String(form.get("supplier_slug") ?? "");
  if (!supplierSlug) return new Response("missing supplier_slug", { status: 400 });

  let access;
  try {
    access = await requireSupplierMembership(supplierSlug);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "forbidden";
    return new Response(msg, { status: msg === "unauthorised" ? 401 : 403 });
  }

  const file = form.get("file");
  if (!(file instanceof Blob)) return new Response("file required", { status: 400 });
  if (file.size > MAX_BYTES) return new Response(`file exceeds ${MAX_BYTES} bytes`, { status: 413 });
  const mime = file.type || "application/octet-stream";
  const ext = ALLOWED[mime];
  if (!ext) return new Response(`unsupported type: ${mime}`, { status: 415 });

  const id = newId();
  const key = `media/${access.supplierId}/${id}.${ext}`;
  const { env } = getCloudflareContext();
  await env.ASSETS_BUCKET.put(key, file.stream(), { httpMetadata: { contentType: mime } });

  const filename = file instanceof File ? file.name.slice(0, 200) : null;
  await db()
    .prepare(
      `INSERT INTO media_assets (id, supplier_id, r2_key, filename, mime, size_bytes, source, created_by)
       VALUES (?, ?, ?, ?, ?, ?, 'upload', ?)`,
    )
    .bind(id, access.supplierId, key, filename, mime, file.size, access.userId)
    .run();

  return Response.json({ id, r2_key: key, mime, url: `/api/media?id=${id}` });
}
