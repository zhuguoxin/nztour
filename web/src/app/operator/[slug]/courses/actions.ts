"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOperatorMembership } from "@/lib/roles";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80) || `c-${Date.now().toString(36)}`;
}

function shortId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

// =========================================================================
//  COURSES
// =========================================================================

export async function createCourse(form: FormData) {
  const operatorSlug = String(form.get("operator_slug") ?? "");
  const access = await requireOperatorMembership(operatorSlug);
  const title = String(form.get("title") ?? "").trim().slice(0, 200);
  const summary = String(form.get("summary") ?? "").trim().slice(0, 1000) || null;
  const emoji = String(form.get("emoji") ?? "").trim().slice(0, 8) || null;
  const lang = String(form.get("primary_lang") ?? "en");
  const est = parseInt(String(form.get("est_minutes") ?? "0"), 10) || null;
  if (!title) throw new Error("title required");

  const id = shortId("c");
  let slug = slugify(title);

  // Ensure slug is unique per operator (append short suffix if not).
  const exists = await db()
    .prepare(`SELECT 1 FROM courses WHERE operator_id = ? AND slug = ?`)
    .bind(access.operatorId, slug)
    .first();
  if (exists) slug = `${slug}-${id.slice(-4)}`;

  await db()
    .prepare(
      `INSERT INTO courses
         (id, operator_id, slug, title, summary, emoji, primary_lang, status, est_minutes, position)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', ?, 0)`,
    )
    .bind(id, access.operatorId, slug, title, summary, emoji, lang, est)
    .run();

  revalidatePath(`/operator/${operatorSlug}`);
  redirect(`/operator/${operatorSlug}/courses/${slug}/edit`);
}

export async function updateCourse(form: FormData) {
  const operatorSlug = String(form.get("operator_slug") ?? "");
  const courseSlug = String(form.get("course_slug") ?? "");
  const access = await requireOperatorMembership(operatorSlug);
  const course = await db()
    .prepare(`SELECT id FROM courses WHERE operator_id = ? AND slug = ?`)
    .bind(access.operatorId, courseSlug)
    .first<{ id: string }>();
  if (!course) throw new Error("not_found");

  const title = String(form.get("title") ?? "").trim().slice(0, 200);
  const summary = String(form.get("summary") ?? "").trim().slice(0, 1000) || null;
  const emoji = String(form.get("emoji") ?? "").trim().slice(0, 8) || null;
  const status = String(form.get("status") ?? "draft");
  const est = parseInt(String(form.get("est_minutes") ?? "0"), 10) || null;
  if (!title) throw new Error("title required");
  if (!["draft", "published"].includes(status)) throw new Error("invalid status");

  await db()
    .prepare(
      `UPDATE courses
         SET title = ?, summary = ?, emoji = ?, status = ?, est_minutes = ?, updated_at = unixepoch()
       WHERE id = ?`,
    )
    .bind(title, summary, emoji, status, est, course.id)
    .run();

  revalidatePath(`/operator/${operatorSlug}`);
  revalidatePath(`/operator/${operatorSlug}/courses/${courseSlug}/edit`);
  revalidatePath(`/learn/${operatorSlug}/${courseSlug}`);
}

export async function deleteCourse(form: FormData) {
  const operatorSlug = String(form.get("operator_slug") ?? "");
  const courseSlug = String(form.get("course_slug") ?? "");
  const access = await requireOperatorMembership(operatorSlug);
  await db()
    .prepare(`DELETE FROM courses WHERE operator_id = ? AND slug = ?`)
    .bind(access.operatorId, courseSlug)
    .run();
  revalidatePath(`/operator/${operatorSlug}`);
  redirect(`/operator/${operatorSlug}`);
}

// =========================================================================
//  MODULES
// =========================================================================

async function authCourse(operatorSlug: string, courseSlug: string) {
  const access = await requireOperatorMembership(operatorSlug);
  const course = await db()
    .prepare(`SELECT id FROM courses WHERE operator_id = ? AND slug = ?`)
    .bind(access.operatorId, courseSlug)
    .first<{ id: string }>();
  if (!course) throw new Error("not_found");
  return { access, courseId: course.id };
}

export async function createModule(form: FormData) {
  const operatorSlug = String(form.get("operator_slug") ?? "");
  const courseSlug = String(form.get("course_slug") ?? "");
  const { courseId } = await authCourse(operatorSlug, courseSlug);
  const title = String(form.get("title") ?? "").trim().slice(0, 200);
  if (!title) throw new Error("title required");

  const id = shortId("m");
  let slug = slugify(title);
  const exists = await db()
    .prepare(`SELECT 1 FROM modules WHERE course_id = ? AND slug = ?`)
    .bind(courseId, slug)
    .first();
  if (exists) slug = `${slug}-${id.slice(-4)}`;

  const next = await db()
    .prepare(`SELECT COALESCE(MAX(position), 0) + 1 AS n FROM modules WHERE course_id = ?`)
    .bind(courseId)
    .first<{ n: number }>();

  await db()
    .prepare(
      `INSERT INTO modules (id, course_id, slug, title, summary, est_minutes, position)
       VALUES (?, ?, ?, ?, NULL, NULL, ?)`,
    )
    .bind(id, courseId, slug, title, next?.n ?? 1)
    .run();

  revalidatePath(`/operator/${operatorSlug}/courses/${courseSlug}/edit`);
}

export async function updateModule(form: FormData) {
  const operatorSlug = String(form.get("operator_slug") ?? "");
  const courseSlug = String(form.get("course_slug") ?? "");
  const moduleId = String(form.get("module_id") ?? "");
  const { courseId } = await authCourse(operatorSlug, courseSlug);
  const title = String(form.get("title") ?? "").trim().slice(0, 200);
  const summary = String(form.get("summary") ?? "").trim().slice(0, 1000) || null;
  const est = parseInt(String(form.get("est_minutes") ?? "0"), 10) || null;
  if (!title) throw new Error("title required");

  await db()
    .prepare(
      `UPDATE modules SET title = ?, summary = ?, est_minutes = ?
       WHERE id = ? AND course_id = ?`,
    )
    .bind(title, summary, est, moduleId, courseId)
    .run();
  revalidatePath(`/operator/${operatorSlug}/courses/${courseSlug}/edit`);
}

export async function deleteModule(form: FormData) {
  const operatorSlug = String(form.get("operator_slug") ?? "");
  const courseSlug = String(form.get("course_slug") ?? "");
  const moduleId = String(form.get("module_id") ?? "");
  const { courseId } = await authCourse(operatorSlug, courseSlug);
  await db()
    .prepare(`DELETE FROM modules WHERE id = ? AND course_id = ?`)
    .bind(moduleId, courseId)
    .run();
  revalidatePath(`/operator/${operatorSlug}/courses/${courseSlug}/edit`);
}

export async function reorderModule(form: FormData) {
  const operatorSlug = String(form.get("operator_slug") ?? "");
  const courseSlug = String(form.get("course_slug") ?? "");
  const moduleId = String(form.get("module_id") ?? "");
  const dir = String(form.get("dir") ?? "up");
  const { courseId } = await authCourse(operatorSlug, courseSlug);

  const { results } = await db()
    .prepare(`SELECT id, position FROM modules WHERE course_id = ? ORDER BY position, id`)
    .bind(courseId)
    .all<{ id: string; position: number }>();
  const list = results ?? [];
  const i = list.findIndex((m) => m.id === moduleId);
  if (i < 0) return;
  const j = dir === "up" ? i - 1 : i + 1;
  if (j < 0 || j >= list.length) return;
  const a = list[i];
  const b = list[j];
  // Renumber to avoid collisions.
  await db()
    .batch([
      db().prepare(`UPDATE modules SET position = ? WHERE id = ?`).bind(b.position, a.id),
      db().prepare(`UPDATE modules SET position = ? WHERE id = ?`).bind(a.position, b.id),
    ]);
  revalidatePath(`/operator/${operatorSlug}/courses/${courseSlug}/edit`);
}

// =========================================================================
//  CONTENT BLOCKS
// =========================================================================

async function authModule(operatorSlug: string, courseSlug: string, moduleId: string) {
  const { courseId } = await authCourse(operatorSlug, courseSlug);
  const mod = await db()
    .prepare(`SELECT id FROM modules WHERE id = ? AND course_id = ?`)
    .bind(moduleId, courseId)
    .first<{ id: string }>();
  if (!mod) throw new Error("not_found");
  return { courseId, moduleId };
}

export async function createBlock(form: FormData) {
  const operatorSlug = String(form.get("operator_slug") ?? "");
  const courseSlug = String(form.get("course_slug") ?? "");
  const moduleId = String(form.get("module_id") ?? "");
  await authModule(operatorSlug, courseSlug, moduleId);
  const kind = String(form.get("kind") ?? "text");
  if (!["text", "callout", "video", "image", "pdf"].includes(kind)) {
    throw new Error("invalid kind");
  }
  const text = String(form.get("text_md") ?? "").trim() || null;
  const caption = String(form.get("caption") ?? "").trim() || null;
  const videoUid = String(form.get("video_uid") ?? "").trim() || null;

  const id = shortId("b");
  const next = await db()
    .prepare(`SELECT COALESCE(MAX(position), -1) + 1 AS n FROM content_blocks WHERE module_id = ?`)
    .bind(moduleId)
    .first<{ n: number }>();

  await db()
    .prepare(
      `INSERT INTO content_blocks
         (id, module_id, position, kind, text_md, video_uid, caption, lang)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'en')`,
    )
    .bind(id, moduleId, next?.n ?? 0, kind, text, videoUid, caption)
    .run();
  revalidatePath(`/operator/${operatorSlug}/courses/${courseSlug}/edit`);
}

export async function updateBlock(form: FormData) {
  const operatorSlug = String(form.get("operator_slug") ?? "");
  const courseSlug = String(form.get("course_slug") ?? "");
  const moduleId = String(form.get("module_id") ?? "");
  const blockId = String(form.get("block_id") ?? "");
  await authModule(operatorSlug, courseSlug, moduleId);
  const text = String(form.get("text_md") ?? "").trim() || null;
  const caption = String(form.get("caption") ?? "").trim() || null;
  const videoUid = String(form.get("video_uid") ?? "").trim() || null;
  await db()
    .prepare(
      `UPDATE content_blocks
         SET text_md = ?, video_uid = ?, caption = ?
       WHERE id = ? AND module_id = ?`,
    )
    .bind(text, videoUid, caption, blockId, moduleId)
    .run();
  revalidatePath(`/operator/${operatorSlug}/courses/${courseSlug}/edit`);
}

export async function deleteBlock(form: FormData) {
  const operatorSlug = String(form.get("operator_slug") ?? "");
  const courseSlug = String(form.get("course_slug") ?? "");
  const moduleId = String(form.get("module_id") ?? "");
  const blockId = String(form.get("block_id") ?? "");
  await authModule(operatorSlug, courseSlug, moduleId);
  await db()
    .prepare(`DELETE FROM content_blocks WHERE id = ? AND module_id = ?`)
    .bind(blockId, moduleId)
    .run();
  revalidatePath(`/operator/${operatorSlug}/courses/${courseSlug}/edit`);
}
