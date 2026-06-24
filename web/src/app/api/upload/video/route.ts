/**
 * POST /api/upload/video — upload a video file into a content_blocks row.
 *
 * The block must already exist (created via "+ Add video block"); this attaches
 * the file. Stored in R2 and streamed back via /api/video?id=<block_id>. An
 * uploaded file takes priority over the block's YouTube link (video_uid).
 *
 * Body (multipart/form-data):
 *   file           — MP4 / WebM / MOV / OGG ≤ 100 MB
 *   operator_slug  — for role gating
 *   course_slug    — for revalidation
 *   module_id      — block's parent module
 *   block_id       — the block to update
 *
 * Storage layout in R2: videos/<course_id>/<block_id>.<ext>
 */
import { db } from "@/lib/db";
import { requireOperatorMembership } from "@/lib/roles";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

const MAX_BYTES = 100 * 1024 * 1024;
const EXT: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "video/ogg": "ogv",
};

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
  if (!operatorSlug || !courseSlug || !moduleId || !blockId) {
    return new Response("missing required fields", { status: 400 });
  }
  if (!(file instanceof Blob)) return new Response("file required", { status: 400 });
  if (file.size > MAX_BYTES) {
    return new Response(`file exceeds ${MAX_BYTES} bytes — use a YouTube link for large videos`, {
      status: 413,
    });
  }
  const type = file.type || "application/octet-stream";
  const ext = EXT[type];
  if (!ext) return new Response(`unsupported type: ${type}`, { status: 415 });

  try {
    await requireOperatorMembership(operatorSlug);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "forbidden";
    return new Response(msg, { status: msg === "unauthorised" ? 401 : 403 });
  }

  const row = await db()
    .prepare(
      `SELECT cb.id, cb.video_r2_key, m.course_id
       FROM content_blocks cb JOIN modules m ON m.id = cb.module_id
       WHERE cb.id = ? AND cb.module_id = ?`,
    )
    .bind(blockId, moduleId)
    .first<{ id: string; video_r2_key: string | null; course_id: string }>();
  if (!row) return new Response("block not found", { status: 404 });

  const key = `videos/${row.course_id}/${blockId}.${ext}`;
  const { env } = getCloudflareContext();
  if (row.video_r2_key && row.video_r2_key !== key) {
    await env.ASSETS_BUCKET.delete(row.video_r2_key).catch(() => {});
  }
  await env.ASSETS_BUCKET.put(key, file.stream(), { httpMetadata: { contentType: type } });
  await db()
    .prepare(`UPDATE content_blocks SET video_r2_key = ? WHERE id = ?`)
    .bind(key, blockId)
    .run();

  revalidatePath(`/product/${operatorSlug}/courses/${courseSlug}/edit`);
  revalidatePath(`/learn/${operatorSlug}/${courseSlug}`);
  return Response.json({ ok: true, key });
}
