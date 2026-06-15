"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOperatorMembership } from "@/lib/roles";
import { synthesizeAndStore, isValidLang } from "@/lib/tts";
import { translateBatch, translateOne, readI18nMap, writeI18nMap, isSupportedLang } from "@/lib/translate";
import { glossaryForTranslation } from "@/lib/glossary";

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

  revalidatePath(`/product/${operatorSlug}`);
  redirect(`/product/${operatorSlug}/courses/${slug}/edit`);
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

  revalidatePath(`/product/${operatorSlug}`);
  revalidatePath(`/product/${operatorSlug}/courses/${courseSlug}/edit`);
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
  revalidatePath(`/product/${operatorSlug}`);
  redirect(`/product/${operatorSlug}`);
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

  revalidatePath(`/product/${operatorSlug}/courses/${courseSlug}/edit`);
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
  revalidatePath(`/product/${operatorSlug}/courses/${courseSlug}/edit`);
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
  revalidatePath(`/product/${operatorSlug}/courses/${courseSlug}/edit`);
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
  revalidatePath(`/product/${operatorSlug}/courses/${courseSlug}/edit`);
}

/**
 * Bulk reorder modules by submitting the full ordered ID list. Used by the
 * drag-drop UI: client sends the list after a drop, server renumbers from 1.
 * Only modules belonging to this course are touched (others rejected).
 */
export async function reorderModulesBulk(input: {
  operatorSlug: string;
  courseSlug: string;
  orderedIds: string[];
}): Promise<void> {
  const { operatorSlug, courseSlug, orderedIds } = input;
  const { courseId } = await authCourse(operatorSlug, courseSlug);

  // Validate every id belongs to this course — refuse if any stray.
  const ph = orderedIds.map(() => "?").join(",");
  const { results } = await db()
    .prepare(`SELECT id FROM modules WHERE course_id = ? AND id IN (${ph})`)
    .bind(courseId, ...orderedIds)
    .all<{ id: string }>();
  const ours = new Set((results ?? []).map((r) => r.id));
  if (ours.size !== orderedIds.length) throw new Error("forbidden");

  const stmts = orderedIds.map((id, i) =>
    db().prepare(`UPDATE modules SET position = ? WHERE id = ? AND course_id = ?`).bind(i + 1, id, courseId),
  );
  if (stmts.length > 0) await db().batch(stmts);
  revalidatePath(`/product/${operatorSlug}/courses/${courseSlug}/edit`);
}

/**
 * Bulk reorder blocks within a single module. Same shape as reorderModulesBulk.
 * (Cross-module drags would require updating module_id too — out of scope here;
 * the UI confines drag sources to a single module's block list.)
 */
export async function reorderBlocksBulk(input: {
  operatorSlug: string;
  courseSlug: string;
  moduleId: string;
  orderedIds: string[];
}): Promise<void> {
  const { operatorSlug, courseSlug, moduleId, orderedIds } = input;
  await authModule(operatorSlug, courseSlug, moduleId);

  const ph = orderedIds.map(() => "?").join(",");
  const { results } = await db()
    .prepare(`SELECT id FROM content_blocks WHERE module_id = ? AND id IN (${ph})`)
    .bind(moduleId, ...orderedIds)
    .all<{ id: string }>();
  const ours = new Set((results ?? []).map((r) => r.id));
  if (ours.size !== orderedIds.length) throw new Error("forbidden");

  const stmts = orderedIds.map((id, i) =>
    db().prepare(`UPDATE content_blocks SET position = ? WHERE id = ? AND module_id = ?`).bind(i, id, moduleId),
  );
  if (stmts.length > 0) await db().batch(stmts);
  revalidatePath(`/product/${operatorSlug}/courses/${courseSlug}/edit`);
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
  revalidatePath(`/product/${operatorSlug}/courses/${courseSlug}/edit`);
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
  // Checkbox: present if checked, absent if not. Map to a stable enum.
  const visibility = form.get("visibility_assistant_only") ? "assistant_only" : "training";
  // Duration recompute: text → words/180wpm; audio block reuses its audio_duration_s
  // (set by generateBlockAudio); video/image blocks stay NULL.
  const duration =
    text && (text.split(/\s+/).filter(Boolean).length > 0)
      ? Math.max(3, Math.round((text.split(/\s+/).filter(Boolean).length / 180) * 60))
      : null;
  await db()
    .prepare(
      `UPDATE content_blocks
         SET text_md = ?, video_uid = ?, caption = ?, visibility = ?,
             duration_s = COALESCE(?, audio_duration_s, duration_s)
       WHERE id = ? AND module_id = ?`,
    )
    .bind(text, videoUid, caption, visibility, duration, blockId, moduleId)
    .run();
  revalidatePath(`/product/${operatorSlug}/courses/${courseSlug}/edit`);
}

// =========================================================================
//  VOICE-OVER (TTS) — OpenAI TTS-1 via @/lib/tts, mp3 stored in R2.
// =========================================================================

/**
 * Generate audio for a block in a specific target language with a chosen voice.
 *
 * Resolves voice by id:
 *   • `voice_id = 'voice_melotts_auto'` (or empty) → Workers AI melotts. Free.
 *   • Otherwise: ElevenLabs voice. Requires XI_API_KEY. Premium quality,
 *     supports cloned voices.
 *
 * Storage:
 *   • Primary lang (== course.primary_lang): writes to legacy columns AND
 *     `audio_i18n[lang]` (for uniform read path).
 *   • Non-primary: writes ONLY to `audio_i18n[lang]`. Legacy columns
 *     untouched so existing audio at primary_lang isn't clobbered.
 */
/** FormData wrapper kept for any progressive-enhancement form usage. */
export async function generateBlockAudio(form: FormData) {
  return generateBlockAudioAction({
    operatorSlug: String(form.get("operator_slug") ?? ""),
    courseSlug: String(form.get("course_slug") ?? ""),
    moduleId: String(form.get("module_id") ?? ""),
    blockId: String(form.get("block_id") ?? ""),
    lang: String(form.get("lang") ?? "auto"),
    voiceId: String(form.get("voice_id") ?? "").trim() || "voice_melotts_auto",
  });
}

/**
 * Object-arg variant called directly from the editor's client component (via
 * useTransition) so we get clear loading + error feedback instead of relying
 * on a bare form submit. Returns void; throws on failure with a message the
 * client surfaces to the operator.
 */
export async function generateBlockAudioAction(input: {
  operatorSlug: string;
  courseSlug: string;
  moduleId: string;
  blockId: string;
  lang: string;
  voiceId: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    await generateBlockAudioCore(input);
    return { ok: true };
  } catch (e) {
    // Return the real error as DATA so it isn't redacted by Next's production
    // server-error masking — the editor displays it inline.
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

async function generateBlockAudioCore(input: {
  operatorSlug: string;
  courseSlug: string;
  moduleId: string;
  blockId: string;
  lang: string;
  voiceId: string;
}) {
  const operatorSlug = input.operatorSlug;
  const courseSlug = input.courseSlug;
  const moduleId = input.moduleId;
  const blockId = input.blockId;
  const requestedLang = input.lang || "auto";
  const voiceId = (input.voiceId || "").trim() || "voice_melotts_auto";
  await authModule(operatorSlug, courseSlug, moduleId);

  // Pull block + parent module + course (need primary_lang).
  const block = await db()
    .prepare(
      `SELECT cb.text_md, cb.text_md_i18n, cb.audio_i18n, cb.lang AS block_lang,
              c.primary_lang AS course_primary_lang
       FROM content_blocks cb
       JOIN modules m ON m.id = cb.module_id
       JOIN courses c ON c.id = m.course_id
       WHERE cb.id = ? AND cb.module_id = ?`,
    )
    .bind(blockId, moduleId)
    .first<{
      text_md: string | null;
      text_md_i18n: string;
      audio_i18n: string;
      block_lang: string;
      course_primary_lang: string;
    }>();
  if (!block) throw new Error("not_found");

  // Resolve target lang. 'auto' means primary.
  const targetLang =
    requestedLang === "auto" || !requestedLang ? block.course_primary_lang : requestedLang;

  // Pull the right source text for that target lang.
  const i18nMap = readI18nMap(block.text_md_i18n);
  let sourceText =
    targetLang === block.course_primary_lang ? block.text_md ?? "" : i18nMap[targetLang] ?? "";

  // If this block lacks a translation for the target language but the primary
  // text exists, auto-translate just this block on demand and persist it. This
  // keeps "generate <lang> audio" working even when individual blocks were
  // edited/added after the course was translated.
  if (!sourceText.trim() && targetLang !== block.course_primary_lang && block.text_md?.trim()) {
    const translated = await translateOne(block.course_primary_lang, targetLang, block.text_md);
    if (translated.trim()) {
      sourceText = translated;
      const newMap = { ...i18nMap, [targetLang]: translated };
      await db()
        .prepare(`UPDATE content_blocks SET text_md_i18n = ? WHERE id = ? AND module_id = ?`)
        .bind(writeI18nMap(newMap), blockId, moduleId)
        .run();
    }
  }

  if (!sourceText.trim()) {
    throw new Error(
      `Block has no text to narrate in ${targetLang}.`,
    );
  }

  // Look up the voice profile.
  const voice = await db()
    .prepare(`SELECT id, provider, external_id, status FROM voice_profiles WHERE id = ?`)
    .bind(voiceId)
    .first<{ id: string; provider: string; external_id: string | null; status: string }>();
  if (!voice) throw new Error("voice not found");
  if (voice.status !== "active") throw new Error(`voice is ${voice.status}`);

  let r2Key: string;
  let durationSeconds: number;

  if (voice.provider === "elevenlabs" || voice.provider === "minimax") {
    if (!voice.external_id) throw new Error(`${voice.provider} voice missing external_id`);
    const { plainTextFromMarkdown } = await import("@/lib/tts");
    const cleanText = plainTextFromMarkdown(sourceText).slice(0, 2000);
    let bytes: Uint8Array;
    if (voice.provider === "minimax") {
      const { synthesizeMiniMax } = await import("@/lib/minimax");
      ({ bytes } = await synthesizeMiniMax({
        text: cleanText,
        voiceId: voice.external_id,
        lang: targetLang,
      }));
    } else {
      const { synthesizeWithVoice } = await import("@/lib/elevenlabs");
      ({ bytes } = await synthesizeWithVoice({
        text: cleanText,
        voiceId: voice.external_id,
        lang: targetLang,
      }));
    }
    r2Key = `audio/${blockId}-${targetLang}-${voice.id}.mp3`;
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = getCloudflareContext();
    await env.ASSETS_BUCKET.put(r2Key, bytes, { httpMetadata: { contentType: "audio/mpeg" } });
    // Rough duration estimate based on plain-text length (160 wpm).
    durationSeconds = Math.max(2, Math.round((cleanText.split(/\s+/).length / 160) * 60));
  } else {
    // Workers AI melotts. The existing helper only accepts hard-coded lang
    // codes; map BCP-47 → its short form.
    const shortLang =
      targetLang.startsWith("zh") ? "zh"
        : targetLang.startsWith("en") ? "en"
        : targetLang.startsWith("ja") ? "ja"
        : targetLang.startsWith("ko") ? "ko"
        : targetLang.startsWith("es") ? "es"
        : targetLang.startsWith("fr") ? "fr"
        : "auto";
    if (!isValidLang(shortLang)) throw new Error("melotts: invalid lang");
    const result = await synthesizeAndStore(`${blockId}-${targetLang}`, sourceText, shortLang);
    r2Key = result.r2Key;
    durationSeconds = result.durationSeconds;
  }

  // Update the audio_i18n map (always) + legacy columns (primary only).
  const audioMap = (() => {
    try {
      const v = JSON.parse(block.audio_i18n);
      return v && typeof v === "object" && !Array.isArray(v) ? v : {};
    } catch {
      return {};
    }
  })();
  audioMap[targetLang] = {
    r2_key: r2Key,
    voice_id: voice.id,
    duration_s: durationSeconds,
    generated_at: Math.floor(Date.now() / 1000),
  };

  if (targetLang === block.course_primary_lang) {
    await db()
      .prepare(
        `UPDATE content_blocks
           SET audio_r2_key = ?, audio_voice = ?, audio_lang = ?,
               audio_duration_s = ?, duration_s = ?,
               audio_generated_at = unixepoch(),
               audio_i18n = ?
         WHERE id = ? AND module_id = ?`,
      )
      .bind(
        r2Key,
        voice.id,
        targetLang,
        durationSeconds,
        durationSeconds,
        JSON.stringify(audioMap),
        blockId,
        moduleId,
      )
      .run();
  } else {
    // Non-primary: don't clobber legacy fields.
    await db()
      .prepare(`UPDATE content_blocks SET audio_i18n = ? WHERE id = ? AND module_id = ?`)
      .bind(JSON.stringify(audioMap), blockId, moduleId)
      .run();
  }

  revalidatePath(`/product/${operatorSlug}/courses/${courseSlug}/edit`);
  revalidatePath(`/learn/${operatorSlug}/${courseSlug}`);
}

export async function clearBlockAudio(form: FormData) {
  const operatorSlug = String(form.get("operator_slug") ?? "");
  const courseSlug = String(form.get("course_slug") ?? "");
  const moduleId = String(form.get("module_id") ?? "");
  const blockId = String(form.get("block_id") ?? "");
  await authModule(operatorSlug, courseSlug, moduleId);

  // Best-effort R2 delete; ignore if missing.
  const row = await db()
    .prepare(`SELECT audio_r2_key FROM content_blocks WHERE id = ? AND module_id = ?`)
    .bind(blockId, moduleId)
    .first<{ audio_r2_key: string | null }>();
  if (row?.audio_r2_key) {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = getCloudflareContext();
    await env.ASSETS_BUCKET.delete(row.audio_r2_key).catch(() => {});
  }

  await db()
    .prepare(
      `UPDATE content_blocks
         SET audio_r2_key = NULL, audio_voice = NULL, audio_lang = NULL,
             audio_duration_s = NULL, audio_generated_at = NULL
       WHERE id = ? AND module_id = ?`,
    )
    .bind(blockId, moduleId)
    .run();
  revalidatePath(`/product/${operatorSlug}/courses/${courseSlug}/edit`);
  revalidatePath(`/learn/${operatorSlug}/${courseSlug}`);
}

// =========================================================================
//  QUIZ AUTHORING (per-module question pool)
// =========================================================================

export async function createQuizQuestion(form: FormData) {
  const operatorSlug = String(form.get("operator_slug") ?? "");
  const courseSlug = String(form.get("course_slug") ?? "");
  const moduleId = String(form.get("module_id") ?? "");
  await authModule(operatorSlug, courseSlug, moduleId);
  const prompt = String(form.get("prompt") ?? "").trim().slice(0, 500);
  const choices = JSON.parse(String(form.get("choices_json") ?? "[]"));
  const correct = parseInt(String(form.get("correct_idx") ?? "0"), 10);
  const explanation = String(form.get("explanation") ?? "").trim().slice(0, 1000) || null;
  if (!prompt) throw new Error("prompt required");
  if (!Array.isArray(choices) || choices.length < 2 || choices.length > 6) {
    throw new Error("2-6 choices required");
  }
  if (!Number.isInteger(correct) || correct < 0 || correct >= choices.length) {
    throw new Error("correct_idx out of range");
  }
  const id = shortId("q");
  const next = await db()
    .prepare(`SELECT COALESCE(MAX(position), -1) + 1 AS n FROM quiz_questions WHERE module_id = ?`)
    .bind(moduleId)
    .first<{ n: number }>();
  await db()
    .prepare(
      `INSERT INTO quiz_questions
         (id, module_id, prompt, choices_json, correct_idx, explanation, position)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(id, moduleId, prompt, JSON.stringify(choices), correct, explanation, next?.n ?? 0)
    .run();
  revalidatePath(`/product/${operatorSlug}/courses/${courseSlug}/edit`);
}

export async function deleteQuizQuestion(form: FormData) {
  const operatorSlug = String(form.get("operator_slug") ?? "");
  const courseSlug = String(form.get("course_slug") ?? "");
  const moduleId = String(form.get("module_id") ?? "");
  const id = String(form.get("question_id") ?? "");
  await authModule(operatorSlug, courseSlug, moduleId);
  await db()
    .prepare(`DELETE FROM quiz_questions WHERE id = ? AND module_id = ?`)
    .bind(id, moduleId)
    .run();
  revalidatePath(`/product/${operatorSlug}/courses/${courseSlug}/edit`);
}

/**
 * AI-generate N quiz questions for a module from its block content. Uses
 * Claude to produce structured JSON, then bulk-inserts. Existing questions
 * are NOT touched — generator appends so operators can review/curate.
 */
export async function generateModuleQuiz(form: FormData) {
  const operatorSlug = String(form.get("operator_slug") ?? "");
  const courseSlug = String(form.get("course_slug") ?? "");
  const moduleId = String(form.get("module_id") ?? "");
  const count = Math.max(1, Math.min(10, parseInt(String(form.get("count") ?? "5"), 10) || 5));
  await authModule(operatorSlug, courseSlug, moduleId);

  // Pull the module + all training-visibility text blocks as the source.
  const mod = await db()
    .prepare(`SELECT title, summary FROM modules WHERE id = ?`)
    .bind(moduleId)
    .first<{ title: string; summary: string | null }>();
  if (!mod) throw new Error("module not found");

  const { results: blocks = [] } = await db()
    .prepare(
      `SELECT kind, text_md, caption FROM content_blocks
       WHERE module_id = ? AND visibility = 'training' AND text_md IS NOT NULL
       ORDER BY position`,
    )
    .bind(moduleId)
    .all<{ kind: string; text_md: string | null; caption: string | null }>();
  const source = [
    `# ${mod.title}`,
    mod.summary ?? "",
    ...blocks.flatMap((b) => [b.text_md ?? "", b.caption ?? ""]),
  ]
    .filter(Boolean)
    .join("\n\n")
    .slice(0, 8000);
  if (source.length < 100) {
    throw new Error("Module has too little text content to generate a quiz from.");
  }

  const { getCloudflareContext } = await import("@opennextjs/cloudflare");
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const { env } = getCloudflareContext();
  if (!env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY missing");
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  const resp = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 4096,
    system: `You write end-of-chapter quiz questions for B2B travel-trade training content.

Rules:
- Each question tests a SPECIFIC, factual detail from the source (price tier, time window, lift name, what to recommend for X customer type, etc.). No generic "what is the main idea" filler.
- 4 plausible multiple-choice answers per question. Distractors should be the kind of mistake a hurried agent would actually make — close-but-wrong, not silly.
- Mix difficulty: ~half should be answerable directly from one sentence; half should require synthesis across two facts.
- Avoid trick questions, negations ("which is NOT"), and "all of the above" / "none of the above".
- Explanation: one sentence pointing back to where in the source the answer lives.
- Output ONLY valid JSON, no markdown fences, no preamble.`,
    messages: [
      {
        role: "user",
        content: `Write ${count} multiple-choice questions from the source below.

Output: a JSON array of ${count} objects, each shaped:
  { "prompt": string, "choices": [string, string, string, string], "correct_idx": 0-3, "explanation": string }

Make the correct_idx vary across the set (not all 0 or all 1).

SOURCE:
${source}`,
      },
    ],
  });
  const text = resp.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("");
  const cleaned = text.replace(/^\s*```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  type GeneratedQ = { prompt: string; choices: string[]; correct_idx: number; explanation?: string };
  let parsed: GeneratedQ[];
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("Quiz generator returned invalid JSON");
  }
  if (!Array.isArray(parsed)) throw new Error("expected JSON array");

  const baseRow = await db()
    .prepare(`SELECT COALESCE(MAX(position), -1) AS n FROM quiz_questions WHERE module_id = ?`)
    .bind(moduleId)
    .first<{ n: number }>();
  let pos = (baseRow?.n ?? -1) + 1;
  const stmts = parsed
    .filter(
      (q) =>
        q &&
        typeof q.prompt === "string" &&
        Array.isArray(q.choices) &&
        q.choices.length >= 2 &&
        q.choices.length <= 6 &&
        Number.isInteger(q.correct_idx) &&
        q.correct_idx >= 0 &&
        q.correct_idx < q.choices.length,
    )
    .map((q) =>
      db()
        .prepare(
          `INSERT INTO quiz_questions
             (id, module_id, prompt, choices_json, correct_idx, explanation, position)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          shortId("q"),
          moduleId,
          q.prompt.slice(0, 500),
          JSON.stringify(q.choices.map((c) => String(c).slice(0, 200))),
          q.correct_idx,
          (q.explanation ?? "").slice(0, 1000) || null,
          pos++,
        ),
    );
  if (stmts.length > 0) await db().batch(stmts);
  revalidatePath(`/product/${operatorSlug}/courses/${courseSlug}/edit`);
}

// =========================================================================
//  MULTI-LANGUAGE TRANSLATION (Claude)
// =========================================================================

/**
 * Translate every text fragment in a course into the target language, in a
 * single Claude call per module (terminology stays consistent within a
 * module).
 *
 * Walks the course → modules → blocks tree, pulls source text from the
 * primary lang fields, and writes results to *_i18n JSON map columns.
 * If target == primary lang we skip (would be a no-op). Adds `toLang` to
 * `courses.available_langs` so the learner picker shows it.
 */
async function translateCourseCore(form: FormData): Promise<void> {
  const operatorSlug = String(form.get("operator_slug") ?? "");
  const courseSlug = String(form.get("course_slug") ?? "");
  const toLang = String(form.get("to_lang") ?? "");
  if (!isSupportedLang(toLang)) throw new Error("unsupported target language");
  const { access, courseId } = await authCourse(operatorSlug, courseSlug);

  // Approved supplier/product term translations to enforce during this run.
  const glossary = await glossaryForTranslation(access.operatorId, toLang);

  const course = await db()
    .prepare(
      `SELECT id, primary_lang, title, summary, title_i18n, summary_i18n, available_langs
       FROM courses WHERE id = ?`,
    )
    .bind(courseId)
    .first<{
      id: string;
      primary_lang: string;
      title: string;
      summary: string | null;
      title_i18n: string;
      summary_i18n: string;
      available_langs: string;
    }>();
  if (!course) throw new Error("not_found");
  if (toLang === course.primary_lang) return; // no-op

  // === Course-level title / summary
  const courseInputs = [
    { id: "title", text: course.title },
    { id: "summary", text: course.summary ?? "" },
  ];
  const courseTrans = await translateBatch(course.primary_lang, toLang, courseInputs, glossary);
  const titleMap = { ...readI18nMap(course.title_i18n), [toLang]: courseTrans[0].translation };
  const summaryMap = { ...readI18nMap(course.summary_i18n), [toLang]: courseTrans[1].translation };

  // === Modules
  const { results: modules = [] } = await db()
    .prepare(
      `SELECT id, title, summary, title_i18n, summary_i18n
       FROM modules WHERE course_id = ? ORDER BY position, id`,
    )
    .bind(courseId)
    .all<{
      id: string;
      title: string;
      summary: string | null;
      title_i18n: string;
      summary_i18n: string;
    }>();

  const moduleUpdates: Array<{ id: string; title_i18n: string; summary_i18n: string }> = [];

  for (const m of modules) {
    // Build the per-module batch: module title + summary, then all block
    // text + captions for blocks belonging to this module. Single Claude call.
    const { results: blocks = [] } = await db()
      .prepare(
        `SELECT id, text_md, caption, text_md_i18n, caption_i18n
         FROM content_blocks WHERE module_id = ? ORDER BY position`,
      )
      .bind(m.id)
      .all<{
        id: string;
        text_md: string | null;
        caption: string | null;
        text_md_i18n: string;
        caption_i18n: string;
      }>();

    const batch = [
      { id: `m:title`, text: m.title },
      { id: `m:summary`, text: m.summary ?? "" },
      ...blocks.flatMap((b) => [
        { id: `b:${b.id}:text`, text: b.text_md ?? "" },
        { id: `b:${b.id}:caption`, text: b.caption ?? "" },
      ]),
    ];
    const out = await translateBatch(course.primary_lang, toLang, batch, glossary);
    const byId = new Map(out.map((r) => [r.id, r.translation]));

    moduleUpdates.push({
      id: m.id,
      title_i18n: writeI18nMap({ ...readI18nMap(m.title_i18n), [toLang]: byId.get("m:title") ?? "" }),
      summary_i18n: writeI18nMap({
        ...readI18nMap(m.summary_i18n),
        [toLang]: byId.get("m:summary") ?? "",
      }),
    });

    // Per-block updates — one batch insert
    const blockStmts = blocks.map((b) => {
      const txt = byId.get(`b:${b.id}:text`) ?? "";
      const cap = byId.get(`b:${b.id}:caption`) ?? "";
      return db()
        .prepare(`UPDATE content_blocks SET text_md_i18n = ?, caption_i18n = ? WHERE id = ?`)
        .bind(
          writeI18nMap({ ...readI18nMap(b.text_md_i18n), [toLang]: txt }),
          writeI18nMap({ ...readI18nMap(b.caption_i18n), [toLang]: cap }),
          b.id,
        );
    });
    if (blockStmts.length > 0) await db().batch(blockStmts);
  }

  // Apply module updates
  if (moduleUpdates.length > 0) {
    await db().batch(
      moduleUpdates.map((mu) =>
        db()
          .prepare(`UPDATE modules SET title_i18n = ?, summary_i18n = ? WHERE id = ?`)
          .bind(mu.title_i18n, mu.summary_i18n, mu.id),
      ),
    );
  }

  // Apply course updates + mark this lang available
  const availParsed = (() => {
    try {
      const a = JSON.parse(course.available_langs);
      return Array.isArray(a) ? a.filter((s): s is string => typeof s === "string") : [];
    } catch {
      return [];
    }
  })();
  const avail = Array.from(new Set([...availParsed, course.primary_lang, toLang]));

  await db()
    .prepare(
      `UPDATE courses
         SET title_i18n = ?, summary_i18n = ?, available_langs = ?, updated_at = unixepoch()
       WHERE id = ?`,
    )
    .bind(writeI18nMap(titleMap), writeI18nMap(summaryMap), JSON.stringify(avail), courseId)
    .run();

  revalidatePath(`/product/${operatorSlug}/courses/${courseSlug}/edit`);
  revalidatePath(`/learn/${operatorSlug}/${courseSlug}`);
}

/**
 * Public translate action. Returns the error as DATA (never throws) so the real
 * message reaches the client — Next redacts thrown server-action errors in prod
 * ("An error occurred in the Server Components render…").
 */
export async function translateCourse(
  form: FormData,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await translateCourseCore(form);
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "translation failed";
    return { ok: false, error: msg.slice(0, 500) };
  }
}

/** Strip one key from an audio_i18n JSON object ({lang: {…}}). */
function removeAudioLang(json: string | null, lang: string): string {
  try {
    const v = JSON.parse(json ?? "{}");
    if (v && typeof v === "object" && !Array.isArray(v)) {
      delete (v as Record<string, unknown>)[lang];
      return JSON.stringify(v);
    }
  } catch {
    /* fall through */
  }
  return "{}";
}

/**
 * Enable or disable a language for a course (enable/disable model).
 *
 *   enable  + never translated  → translate the whole course, then enable
 *   enable  + already translated → just enable (no re-translation; the
 *                                   previously generated translation + audio
 *                                   are reused)
 *   disable                      → hide from learners; translation + audio are
 *                                   KEPT so re-enabling is instant
 *
 * The source/primary language is always enabled and cannot be toggled.
 */
export async function setCourseLanguageEnabled(
  form: FormData,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const operatorSlug = String(form.get("operator_slug") ?? "");
    const courseSlug = String(form.get("course_slug") ?? "");
    const lang = String(form.get("lang") ?? "");
    const enabled = String(form.get("enabled") ?? "") === "1";
    if (!isSupportedLang(lang)) throw new Error("unsupported language");
    const { courseId } = await authCourse(operatorSlug, courseSlug);

    const course = await db()
      .prepare(`SELECT id, primary_lang, title_i18n, available_langs FROM courses WHERE id = ?`)
      .bind(courseId)
      .first<{ id: string; primary_lang: string; title_i18n: string; available_langs: string }>();
    if (!course) throw new Error("not_found");
    if (lang === course.primary_lang) return { ok: true }; // source is always on

    const avail = (() => {
      try {
        const a = JSON.parse(course.available_langs);
        return Array.isArray(a) ? a.filter((l: unknown): l is string => typeof l === "string") : [];
      } catch {
        return [course.primary_lang];
      }
    })();
    const alreadyTranslated = !!readI18nMap(course.title_i18n)[lang];

    if (enabled) {
      if (!alreadyTranslated) {
        // Translate the whole course (this also adds the lang to available_langs).
        const fd = new FormData();
        fd.set("operator_slug", operatorSlug);
        fd.set("course_slug", courseSlug);
        fd.set("to_lang", lang);
        await translateCourseCore(fd);
        return { ok: true };
      }
      // Already translated → just turn it back on, reusing existing content.
      const next = Array.from(new Set([...avail, course.primary_lang, lang]));
      await db()
        .prepare(`UPDATE courses SET available_langs = ? WHERE id = ?`)
        .bind(JSON.stringify(next), courseId)
        .run();
    } else {
      // Disable: remove from available_langs but KEEP all translation + audio.
      const next = avail.filter((l) => l !== lang);
      await db()
        .prepare(`UPDATE courses SET available_langs = ? WHERE id = ?`)
        .bind(JSON.stringify(next), courseId)
        .run();
    }

    revalidatePath(`/product/${operatorSlug}/courses/${courseSlug}/edit`);
    revalidatePath(`/learn/${operatorSlug}/${courseSlug}`);
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "failed";
    return { ok: false, error: msg.slice(0, 500) };
  }
}

/**
 * Permanently delete a language's translation + audio from a course (the harder
 * "forget" action, distinct from disable). Cannot remove the source language.
 */
export async function removeCourseLanguage(form: FormData): Promise<void> {
  const operatorSlug = String(form.get("operator_slug") ?? "");
  const courseSlug = String(form.get("course_slug") ?? "");
  const lang = String(form.get("lang") ?? "");
  if (!isSupportedLang(lang)) throw new Error("unsupported language");
  const { courseId } = await authCourse(operatorSlug, courseSlug);

  const course = await db()
    .prepare(
      `SELECT id, primary_lang, title_i18n, summary_i18n, available_langs FROM courses WHERE id = ?`,
    )
    .bind(courseId)
    .first<{
      id: string;
      primary_lang: string;
      title_i18n: string;
      summary_i18n: string;
      available_langs: string;
    }>();
  if (!course) throw new Error("not_found");
  if (lang === course.primary_lang) throw new Error("cannot remove the source language");

  const avail = (() => {
    try {
      const a = JSON.parse(course.available_langs);
      return Array.isArray(a) ? a.filter((l: unknown) => l !== lang && typeof l === "string") : [];
    } catch {
      return [course.primary_lang];
    }
  })();
  const titleMap = readI18nMap(course.title_i18n);
  delete titleMap[lang];
  const summaryMap = readI18nMap(course.summary_i18n);
  delete summaryMap[lang];
  await db()
    .prepare(
      `UPDATE courses SET available_langs = ?, title_i18n = ?, summary_i18n = ?, updated_at = unixepoch() WHERE id = ?`,
    )
    .bind(JSON.stringify(avail), writeI18nMap(titleMap), writeI18nMap(summaryMap), courseId)
    .run();

  const { results: modules = [] } = await db()
    .prepare(`SELECT id, title_i18n, summary_i18n FROM modules WHERE course_id = ?`)
    .bind(courseId)
    .all<{ id: string; title_i18n: string; summary_i18n: string }>();
  if (modules.length > 0) {
    await db().batch(
      modules.map((m) => {
        const tm = readI18nMap(m.title_i18n);
        delete tm[lang];
        const sm = readI18nMap(m.summary_i18n);
        delete sm[lang];
        return db()
          .prepare(`UPDATE modules SET title_i18n = ?, summary_i18n = ? WHERE id = ?`)
          .bind(writeI18nMap(tm), writeI18nMap(sm), m.id);
      }),
    );
  }

  const { results: blocks = [] } = await db()
    .prepare(
      `SELECT cb.id, cb.text_md_i18n, cb.caption_i18n, cb.audio_i18n
       FROM content_blocks cb JOIN modules m ON m.id = cb.module_id
       WHERE m.course_id = ?`,
    )
    .bind(courseId)
    .all<{ id: string; text_md_i18n: string; caption_i18n: string; audio_i18n: string }>();
  if (blocks.length > 0) {
    await db().batch(
      blocks.map((b) => {
        const tx = readI18nMap(b.text_md_i18n);
        delete tx[lang];
        const cap = readI18nMap(b.caption_i18n);
        delete cap[lang];
        const audio = removeAudioLang(b.audio_i18n, lang);
        return db()
          .prepare(
            `UPDATE content_blocks SET text_md_i18n = ?, caption_i18n = ?, audio_i18n = ? WHERE id = ?`,
          )
          .bind(writeI18nMap(tx), writeI18nMap(cap), audio, b.id);
      }),
    );
  }

  revalidatePath(`/product/${operatorSlug}/courses/${courseSlug}/edit`);
  revalidatePath(`/learn/${operatorSlug}/${courseSlug}`);
}

// =========================================================================
//  COURSE ATTACHMENTS (RAG-only supplementary materials)
// =========================================================================

export async function deleteCourseAttachment(form: FormData) {
  const operatorSlug = String(form.get("operator_slug") ?? "");
  const courseSlug = String(form.get("course_slug") ?? "");
  const attachmentId = String(form.get("attachment_id") ?? "");
  const { courseId } = await authCourse(operatorSlug, courseSlug);

  const row = await db()
    .prepare(`SELECT r2_key FROM course_attachments WHERE id = ? AND course_id = ?`)
    .bind(attachmentId, courseId)
    .first<{ r2_key: string }>();
  if (!row) return;

  const { getCloudflareContext } = await import("@opennextjs/cloudflare");
  const { env } = getCloudflareContext();
  await env.ASSETS_BUCKET.delete(row.r2_key).catch(() => {});
  await db()
    .prepare(`DELETE FROM course_attachments WHERE id = ? AND course_id = ?`)
    .bind(attachmentId, courseId)
    .run();

  revalidatePath(`/product/${operatorSlug}/courses/${courseSlug}/edit`);
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
  revalidatePath(`/product/${operatorSlug}/courses/${courseSlug}/edit`);
}
