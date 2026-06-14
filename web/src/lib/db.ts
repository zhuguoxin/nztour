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
  // Per-operator theme tokens (migration 0004). Null = use Libretour defaults.
  theme_bg: string | null;
  theme_accent: string | null;
  theme_ink: string | null;
  theme_logo_r2_key: string | null;
}

export interface CourseRow {
  id: string;
  operator_id: string;
  slug: string;
  title: string;
  summary: string | null;
  cover_color: string | null;
  emoji: string | null;
  cover_r2_key?: string | null;
  primary_lang: string;
  status: string;
  est_minutes: number | null;
  ai_examples_json: string | null;
  /** JSON array of BCP-47 codes the course has content in (migration 0007). */
  available_langs?: string | null;
  title_i18n?: string | null;
  summary_i18n?: string | null;
}

/** Parse the JSON-encoded string[] in courses.ai_examples_json safely. */
export function parseAiExamples(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v.filter((s) => typeof s === "string") : [];
  } catch {
    return [];
  }
}

export interface ModuleRow {
  id: string;
  course_id: string;
  slug: string;
  title: string;
  summary: string | null;
  est_minutes: number | null;
  position: number;
  /** JSON map of lang code → translated title (excludes primary lang) */
  title_i18n?: string | null;
  summary_i18n?: string | null;
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
  // Voice-over audio (migration 0003). NULL until a text/callout block has had
  // TTS generated. Served via /api/audio/<block_id>.
  audio_r2_key: string | null;
  audio_voice: string | null;
  audio_lang: string | null;
  audio_duration_s: number | null;
  audio_generated_at: number | null;
  /** Migration 0007 — translation maps. */
  text_md_i18n?: string | null;
  caption_i18n?: string | null;
  audio_i18n?: string | null;
}

export interface CourseWithOperator extends CourseRow {
  operator_name: string;
  operator_slug: string;
}

// =============== Reads ===============

export interface OperatorCard {
  id: string;
  slug: string;
  name: string;
  course_count: number;
  module_count: number;
  est_minutes: number;
  emoji: string | null;
  cover_color: string | null;
  primary_lang: string;
  status: string;
  sample_course_title: string | null;
  sample_course_slug: string | null;
}

export async function listOperatorsWithCourseCounts(): Promise<OperatorCard[]> {
  const { results } = await db()
    .prepare(
      `SELECT
         o.id, o.slug, o.name, o.primary_lang, o.status,
         COUNT(DISTINCT c.id) AS course_count,
         COUNT(DISTINCT m.id) AS module_count,
         COALESCE(SUM(c.est_minutes), 0) AS est_minutes,
         (SELECT emoji FROM courses WHERE operator_id = o.id AND status='published'
           ORDER BY position, created_at LIMIT 1) AS emoji,
         (SELECT cover_color FROM courses WHERE operator_id = o.id AND status='published'
           ORDER BY position, created_at LIMIT 1) AS cover_color,
         (SELECT title FROM courses WHERE operator_id = o.id AND status='published'
           ORDER BY position, created_at LIMIT 1) AS sample_course_title,
         (SELECT slug FROM courses WHERE operator_id = o.id AND status='published'
           ORDER BY position, created_at LIMIT 1) AS sample_course_slug
       FROM operators o
       LEFT JOIN courses c ON c.operator_id = o.id AND c.status='published'
       LEFT JOIN modules m ON m.course_id = c.id
       WHERE o.status = 'active'
       GROUP BY o.id
       ORDER BY (course_count > 0) DESC, o.name`,
    )
    .all<OperatorCard>();
  return results ?? [];
}

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
              o.contact_email AS o_contact_email, o.status AS o_status,
              o.theme_bg AS o_theme_bg, o.theme_accent AS o_theme_accent,
              o.theme_ink AS o_theme_ink, o.theme_logo_r2_key AS o_theme_logo_r2_key
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
        o_theme_bg: string | null;
        o_theme_accent: string | null;
        o_theme_ink: string | null;
        o_theme_logo_r2_key: string | null;
      }
    >();
  if (!row) return null;

  const { results: modules } = await db()
    .prepare(
      `SELECT id, course_id, slug, title, summary, est_minutes, position,
              title_i18n, summary_i18n
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
    theme_bg: row.o_theme_bg,
    theme_accent: row.o_theme_accent,
    theme_ink: row.o_theme_ink,
    theme_logo_r2_key: row.o_theme_logo_r2_key,
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
    ai_examples_json: row.ai_examples_json ?? null,
    available_langs: (row as unknown as { available_langs?: string | null }).available_langs ?? null,
    title_i18n: (row as unknown as { title_i18n?: string | null }).title_i18n ?? null,
    summary_i18n: (row as unknown as { summary_i18n?: string | null }).summary_i18n ?? null,
  };
  return { operator, course, modules: modules ?? [] };
}

/**
 * Fetch blocks for a module. `opts.includeAssistantOnly` defaults to false:
 * learner-facing pages get only `visibility='training'` blocks; the editor
 * preview and any RAG-internal call pass `true` to include
 * `visibility='assistant_only'` blocks (which are fed to the AI but never
 * shown in /learn).
 */
export async function getModuleBlocks(
  moduleId: string,
  opts: { includeAssistantOnly?: boolean } = {},
): Promise<BlockRow[]> {
  const { results } = opts.includeAssistantOnly
    ? await db()
        .prepare(
          `SELECT id, module_id, position, kind, text_md, image_r2_key, video_uid, pdf_r2_key,
                  caption, lang, audio_r2_key, audio_voice, audio_lang, audio_duration_s,
                  audio_generated_at, text_md_i18n, caption_i18n, audio_i18n
           FROM content_blocks WHERE module_id = ? ORDER BY position`,
        )
        .bind(moduleId)
        .all<BlockRow>()
    : await db()
        .prepare(
          `SELECT id, module_id, position, kind, text_md, image_r2_key, video_uid, pdf_r2_key,
                  caption, lang, audio_r2_key, audio_voice, audio_lang, audio_duration_s,
                  audio_generated_at, text_md_i18n, caption_i18n, audio_i18n
           FROM content_blocks WHERE module_id = ? AND visibility = 'training' ORDER BY position`,
        )
        .bind(moduleId)
        .all<BlockRow>();
  return results ?? [];
}
