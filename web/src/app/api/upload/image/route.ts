/**
 * POST /api/upload/image — multipart upload of an image into a content_blocks
 * row. The block must already exist (created via the editor's "+ Add image
 * block" button); this endpoint just attaches the file.
 *
 * Body (multipart/form-data):
 *   file           — the image (PNG / JPEG / WebP / GIF) ≤ 8 MB
 *   operator_slug  — for role gating
 *   course_slug    — for revalidation
 *   module_id      — block's parent module
 *   block_id       — the block to update
 *
 * Auth: must have operator_membership for `operator_slug` (or be platform admin,
 * or be supplier-member of the parent supplier — see requireOperatorMembership).
 *
 * Storage layout in R2:
 *   images/<course_id>/<block_id>.<ext>
 *
 * Old image (if any) is deleted before the new key is written.
 */
import { db } from "@/lib/db";
import { requireOperatorMembership } from "@/lib/roles";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return new Response("invalid multipart body", { status: 400 });
  }
  const operatorSlug = String(form.get("operator_slug") ?? "");
  const courseSlug = String(form.get("course_slug") ?? "");
  const moduleId = String(form.get("module_id") ?? "");
  const blockId = String(form.get("block_id") ?? "");
  const file = form.get("file");
  if (!operatorSlug || !blockId || !moduleId || !courseSlug) {
    return new Response("missing required fields", { status: 400 });
  }
  if (!(file instanceof Blob)) {
    return new Response("file required", { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return new Response(`file exceeds ${MAX_BYTES} bytes`, { status: 413 });
  }
  const type = file.type || "application/octet-stream";
  if (!ALLOWED.has(type)) {
    return new Response(`unsupported type: ${type}`, { status: 415 });
  }

  try {
    await requireOperatorMembership(operatorSlug);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "forbidden";
    return new Response(msg, { status: msg === "unauthorised" ? 401 : 403 });
  }

  // Resolve block + course to authorize the (block, module) link and find
  // course_id for the R2 key layout.
  const row = await db()
    .prepare(
      `SELECT cb.id, cb.image_r2_key, m.course_id
       FROM content_blocks cb
       JOIN modules m ON m.id = cb.module_id
       WHERE cb.id = ? AND cb.module_id = ?`,
    )
    .bind(blockId, moduleId)
    .first<{ id: string; image_r2_key: string | null; course_id: string }>();
  if (!row) return new Response("block not found", { status: 404 });

  const ext = type === "image/png" ? "png" : type === "image/webp" ? "webp" : type === "image/gif" ? "gif" : "jpg";
  const key = `images/${row.course_id}/${blockId}.${ext}`;

  const { env } = getCloudflareContext();
  // Best-effort delete old object (if extension differs).
  if (row.image_r2_key && row.image_r2_key !== key) {
    await env.ASSETS_BUCKET.delete(row.image_r2_key).catch(() => {});
  }
  await env.ASSETS_BUCKET.put(key, file.stream(), {
    httpMetadata: { contentType: type },
  });

  await db()
    .prepare(`UPDATE content_blocks SET image_r2_key = ? WHERE id = ?`)
    .bind(key, blockId)
    .run();

  revalidatePath(`/product/${operatorSlug}/courses/${courseSlug}/edit`);
  revalidatePath(`/learn/${operatorSlug}/${courseSlug}`);

  return Response.json({ ok: true, key });
}
