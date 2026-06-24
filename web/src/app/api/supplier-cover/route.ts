/**
 * Supplier cover image: upload (POST), remove (POST ?remove=1), serve (GET ?slug=).
 *
 *   POST /api/supplier-cover            multipart {file, supplier_slug}  → store
 *   POST /api/supplier-cover?remove=1   multipart {supplier_slug}        → clear
 *   GET  /api/supplier-cover?slug=<s>                                    → bytes
 *
 * Stored in R2 under covers/supplier-<supplier_id>.<ext>; key written to
 * suppliers.cover_r2_key. Mutations require supplier membership; GET is public
 * (the cover is shown atop the supplier panel).
 */
import { db } from "@/lib/db";
import { requireSupplierMembership } from "@/lib/roles";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

const MAX_BYTES = 3 * 1024 * 1024; // 3 MB — photographic cover
const ALLOWED: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};
const EXT_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");
  if (!slug) return new Response("missing slug", { status: 400 });

  const row = await db()
    .prepare(`SELECT cover_r2_key FROM suppliers WHERE slug = ?`)
    .bind(slug)
    .first<{ cover_r2_key: string | null }>();
  if (!row?.cover_r2_key) return new Response("not found", { status: 404 });

  const { env } = getCloudflareContext();
  const obj = await env.ASSETS_BUCKET.get(row.cover_r2_key);
  if (!obj) return new Response("not found", { status: 404 });

  const ext = row.cover_r2_key.split(".").pop()?.toLowerCase() ?? "jpg";
  return new Response(obj.body, {
    headers: {
      "content-type": obj.httpMetadata?.contentType || EXT_TYPES[ext] || "image/jpeg",
      // Short cache: covers change in-place (stable slug URL), so keep it brief
      // so a freshly uploaded cover shows up quickly on pages that don't
      // cache-bust the URL. The editor preview adds &v=<token> for instant swap.
      "cache-control": "public, max-age=30, must-revalidate",
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
  const supplierSlug = String(form.get("supplier_slug") ?? "");
  if (!supplierSlug) return new Response("missing supplier_slug", { status: 400 });

  let access;
  try {
    access = await requireSupplierMembership(supplierSlug);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "forbidden";
    return new Response(msg, { status: msg === "unauthorised" ? 401 : 403 });
  }

  const { env } = getCloudflareContext();
  const existing = await db()
    .prepare(`SELECT cover_r2_key FROM suppliers WHERE id = ?`)
    .bind(access.supplierId)
    .first<{ cover_r2_key: string | null }>();

  if (remove) {
    if (existing?.cover_r2_key) {
      await env.ASSETS_BUCKET.delete(existing.cover_r2_key).catch(() => {});
    }
    await db()
      .prepare(`UPDATE suppliers SET cover_r2_key = NULL WHERE id = ?`)
      .bind(access.supplierId)
      .run();
    revalidatePath(`/supplier/${supplierSlug}`);
    return Response.json({ ok: true, removed: true });
  }

  const file = form.get("file");
  if (!(file instanceof Blob)) return new Response("file required", { status: 400 });
  if (file.size > MAX_BYTES) return new Response(`file exceeds ${MAX_BYTES} bytes`, { status: 413 });
  const mime = file.type || "application/octet-stream";
  const ext = ALLOWED[mime];
  if (!ext) return new Response(`unsupported type: ${mime}`, { status: 415 });

  const key = `covers/supplier-${access.supplierId}.${ext}`;
  if (existing?.cover_r2_key && existing.cover_r2_key !== key) {
    await env.ASSETS_BUCKET.delete(existing.cover_r2_key).catch(() => {});
  }
  await env.ASSETS_BUCKET.put(key, file.stream(), { httpMetadata: { contentType: mime } });
  await db()
    .prepare(`UPDATE suppliers SET cover_r2_key = ? WHERE id = ?`)
    .bind(key, access.supplierId)
    .run();

  revalidatePath(`/supplier/${supplierSlug}`);
  return Response.json({ ok: true, key });
}
