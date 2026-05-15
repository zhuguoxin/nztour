/**
 * Thin D1 access layer. All app queries go through here so we can swap binding
 * names or add caching in one place.
 */
import { getCloudflareContext } from "@opennextjs/cloudflare";

export function db() {
  const { env } = getCloudflareContext();
  if (!env.DB) {
    throw new Error(
      "D1 binding `DB` not available. Are you running in `next dev` without an initialised OpenNext context?",
    );
  }
  return env.DB;
}

// =============== Types ===============

export interface OperatorRow {
  id: string;
  slug: string;
  name: string;
  display_name: string | null;
  country: string;
  primary_lang: string;
  cover_color: string | null;
  contact_email: string | null;
  status: string;
}

export interface CourseRow {
  id: string;
  operator_id: string;
  slug: string;
  title: string;
  summary: string | null;
  cover_color: string | null;
  emoji: string | null;
  primary_lang: string;
  status: string;
  est_minutes: number | null;
}

export interface ModuleRow {
  id: string;
  course_id: string;
  slug: string;
  title: string;
  summary: string | null;
  est_minutes: number | null;
  position: number;
}

export interface BlockRow {
  id: string;
  module_id: string;
  position: number;
  kind: "text" | "image" | "video" | "pdf" | "callout";
  text_md: string | null;
  image_r2_key: string | null;
  video_uid: string | null;
  pdf_r2_key: string | null;
  caption: string | null;
  lang: string;
}

export interface CourseWithOperator extends CourseRow {
  operator_name: string;
  operator_slug: string;
}

// =============== Reads ===============

export async function listPublishedCourses(): Promise<CourseWithOperator[]> {
  const { results } = await db()
    .prepare(
      `SELECT c.*, o.name AS operator_name, o.slug AS operator_slug
       FROM courses c
       JOIN operators o ON o.id = c.operator_id
       WHERE c.status = 'published' AND o.status = 'active'
       ORDER BY o.name, c.title`,
    )
    .all<CourseWithOperator>();
  return results ?? [];
}

export async function getCourseBySlug(
  operatorSlug: string,
  courseSlug: string,
): Promise<{ operator: OperatorRow; course: CourseRow; modules: ModuleRow[] } | null> {
  const row = await db()
    .prepare(
      `SELECT c.*, o.id AS o_id, o.slug AS o_slug, o.name AS o_name, o.display_name AS o_display_name,
              o.country AS o_country, o.primary_lang AS o_primary_lang, o.cover_color AS o_cover_color,
              o.contact_email AS o_contact_email, o.status AS o_status
       FROM courses c
       JOIN operators o ON o.id = c.operator_id
       WHERE o.slug = ? AND c.slug = ?`,
    )
    .bind(operatorSlug, courseSlug)
    .first<
      CourseRow & {
        o_id: string;
        o_slug: string;
        o_name: string;
        o_display_name: string | null;
        o_country: string;
        o_primary_lang: string;
        o_cover_color: string | null;
        o_contact_email: string | null;
        o_status: string;
      }
    >();
  if (!row) return null;

  const { results: modules } = await db()
    .prepare(
      `SELECT id, course_id, slug, title, summary, est_minutes, position
       FROM modules WHERE course_id = ? ORDER BY position`,
    )
    .bind(row.id)
    .all<ModuleRow>();

  const operator: OperatorRow = {
    id: row.o_id,
    slug: row.o_slug,
    name: row.o_name,
    display_name: row.o_display_name,
    country: row.o_country,
    primary_lang: row.o_primary_lang,
    cover_color: row.o_cover_color,
    contact_email: row.o_contact_email,
    status: row.o_status,
  };
  const course: CourseRow = {
    id: row.id,
    operator_id: row.operator_id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    cover_color: row.cover_color,
    emoji: row.emoji,
    primary_lang: row.primary_lang,
    status: row.status,
    est_minutes: row.est_minutes,
  };
  return { operator, course, modules: modules ?? [] };
}

export async function getModuleBlocks(moduleId: string): Promise<BlockRow[]> {
  const { results } = await db()
    .prepare(
      `SELECT id, module_id, position, kind, text_md, image_r2_key, video_uid, pdf_r2_key, caption, lang
       FROM content_blocks WHERE module_id = ? ORDER BY position`,
    )
    .bind(moduleId)
    .all<BlockRow>();
  return results ?? [];
}
