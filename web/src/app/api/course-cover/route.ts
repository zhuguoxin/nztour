/**
 * Course cover image: upload (POST) and serve (GET ?id=).
 *
 *   POST /api/course-cover   multipart {file, operator_slug, course_slug}
 *   GET  /api/course-cover?id=<course_id>
 *
 * Stored in R2 under covers/<course_id>.<ext>; key written to
 * courses.cover_r2_key. A course can have EITHER an emoji or a cover image;
 * the cover image takes precedence wherever both could show. Uploading sets
 * cover_r2_key; the editor's emoji picker clears it by saving an emoji.
 *
 * Mutations require operator membership; GET is public (covers are public
 * course art shown in the marketplace + dashboards).
 */
import { db } from "@/lib/db";
import { requireOperatorMembership } from "@/lib/roles";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

const MAX_BYTES = 4 * 1024 * 1024; // 4 MB
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
  const id = url.searchParams.get("id");
  if (!id) return new Response("missing id", { status: 400 });

  const row = await db()
    .prepare(`SELECT cover_r2_key FROM courses WHERE id = ?`)
    .bind(id)
    .first<{ cover_r2_key: string | null }>();
  if (!row?.cover_r2_key) return new Response("not found", { status: 404 });

  const { env } = getCloudflareContext();
  const obj = await env.ASSETS_BUCKET.get(row.cover_r2_key);
  if (!obj) return new Response("not found", { status: 404 });

  const ext = row.cover_r2_key.split(".").pop()?.toLowerCase() ?? "jpg";
  return new Response(obj.body, {
    headers: {
      "content-type": obj.httpMetadata?.contentType || EXT_TYPES[ext] || "image/jpeg",
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
  const operatorSlug = String(form.get("operator_slug") ?? "");
  const courseSlug = String(form.get("course_slug") ?? "");
  if (!operatorSlug || !courseSlug) {
    return new Response("missing required fields", { status: 400 });
  }

  let access;
  try {
    access = await requireOperatorMembership(operatorSlug);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "forbidden";
    return new Response(msg, { status: msg === "unauthorised" ? 401 : 403 });
  }

  const course = await db()
    .prepare(`SELECT id, cover_r2_key FROM courses WHERE operator_id = ? AND slug = ?`)
    .bind(access.operatorId, courseSlug)
    .first<{ id: string; cover_r2_key: string | null }>();
  if (!course) return new Response("course not found", { status: 404 });

  const { env: envEarly } = getCloudflareContext();
  if (remove) {
    if (course.cover_r2_key) {
      await envEarly.ASSETS_BUCKET.delete(course.cover_r2_key).catch(() => {});
    }
    await db()
      .prepare(`UPDATE courses SET cover_r2_key = NULL, updated_at = unixepoch() WHERE id = ?`)
      .bind(course.id)
      .run();
    revalidatePath(`/product/${operatorSlug}/courses/${courseSlug}/edit`);
    revalidatePath(`/product/${operatorSlug}`);
    return Response.json({ ok: true, removed: true });
  }

  const file = form.get("file");
  if (!(file instanceof Blob)) return new Response("file required", { status: 400 });
  if (file.size > MAX_BYTES) return new Response(`file exceeds ${MAX_BYTES} bytes`, { status: 413 });
  const mime = file.type || "application/octet-stream";
  const ext = ALLOWED[mime];
  if (!ext) return new Response(`unsupported type: ${mime}`, { status: 415 });

  const key = `covers/${course.id}.${ext}`;
  const { env } = getCloudflareContext();
  if (course.cover_r2_key && course.cover_r2_key !== key) {
    await env.ASSETS_BUCKET.delete(course.cover_r2_key).catch(() => {});
  }
  await env.ASSETS_BUCKET.put(key, file.stream(), { httpMetadata: { contentType: mime } });
  // Setting a cover image clears the emoji so the cover takes over everywhere.
  await db()
    .prepare(`UPDATE courses SET cover_r2_key = ?, emoji = NULL, updated_at = unixepoch() WHERE id = ?`)
    .bind(key, course.id)
    .run();

  revalidatePath(`/product/${operatorSlug}/courses/${courseSlug}/edit`);
  revalidatePath(`/product/${operatorSlug}`);
  revalidatePath(`/learn`);
  return Response.json({ ok: true, key });
}
