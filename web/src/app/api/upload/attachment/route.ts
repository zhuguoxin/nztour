/**
 * POST /api/upload/attachment — upload a supplementary material to a course.
 *
 * Attachments are RAG-only: they're never rendered in /learn but their
 * content feeds the AI assistant. Use cases: rate sheets, FAQs, internal
 * SOPs, supplier docs — anything the AI should know but the learner
 * doesn't need to read linearly.
 *
 * Body (multipart):
 *   file           — PDF / TXT / Markdown / DOCX ≤ 16 MB
 *   operator_slug  — for role gating
 *   course_slug    — target course
 *
 * Storage layout in R2:
 *   attachments/<course_id>/<attachment_id>.<ext>
 *
 * The row is written with rag_status='pending'. A separate ingestion
 * worker (PARSE_QUEUE consumer) will chunk + embed + write to Vectorize.
 */
import { db } from "@/lib/db";
import { requireOperatorMembership } from "@/lib/roles";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

const MAX_BYTES = 16 * 1024 * 1024;
const ALLOWED_EXT: Record<string, string> = {
  "application/pdf": "pdf",
  "text/plain": "txt",
  "text/markdown": "md",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

function shortId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return new Response("invalid multipart body", { status: 400 });
  }
  const operatorSlug = String(form.get("operator_slug") ?? "");
  const courseSlug = String(form.get("course_slug") ?? "");
  const file = form.get("file");
  if (!operatorSlug || !courseSlug || !(file instanceof Blob)) {
    return new Response("missing required fields", { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return new Response(`file exceeds ${MAX_BYTES} bytes`, { status: 413 });
  }
  const mime = file.type || "application/octet-stream";
  const ext = ALLOWED_EXT[mime];
  if (!ext) return new Response(`unsupported type: ${mime}`, { status: 415 });
  const filename = (file as File).name || `attachment.${ext}`;

  let access;
  try {
    access = await requireOperatorMembership(operatorSlug);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "forbidden";
    return new Response(msg, { status: msg === "unauthorised" ? 401 : 403 });
  }

  const course = await db()
    .prepare(`SELECT id FROM courses WHERE operator_id = ? AND slug = ?`)
    .bind(access.operatorId, courseSlug)
    .first<{ id: string }>();
  if (!course) return new Response("course not found", { status: 404 });

  const id = shortId("att");
  const key = `attachments/${course.id}/${id}.${ext}`;

  const { env } = getCloudflareContext();
  await env.ASSETS_BUCKET.put(key, file.stream(), {
    httpMetadata: { contentType: mime },
  });

  await db()
    .prepare(
      `INSERT INTO course_attachments
         (id, course_id, filename, mime_type, size_bytes, r2_key, uploaded_by, rag_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
    )
    .bind(id, course.id, filename.slice(0, 200), mime, file.size, key, access.userId)
    .run();

  // Best-effort enqueue for the RAG parser. If PARSE_QUEUE consumer isn't
  // wired (it lands in a later phase), the row stays rag_status='pending'
  // and the UI shows that to the operator.
  try {
    await env.PARSE_QUEUE.send({
      kind: "attachment",
      attachment_id: id,
      course_id: course.id,
      r2_key: key,
      mime,
    });
  } catch {
    // Swallow — consumer may not be deployed yet; row state is recoverable.
  }

  revalidatePath(`/operator/${operatorSlug}/courses/${courseSlug}/edit`);
  return Response.json({ ok: true, id });
}
