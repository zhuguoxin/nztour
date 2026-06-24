import { notFound } from "next/navigation";
import { mediaUrl } from "@/lib/media";
import Link from "next/link";
import { TopBar } from "../../../../../_components/top-bar";
import { requireOperatorMembership } from "@/lib/roles";
import { db } from "@/lib/db";
import { estimateReadingMinutes } from "@/lib/reading-time";
import { updateCourse, deleteCourse, unpublishCourse } from "../../actions";
import {
  EditorModules,
  type BlockData,
  type ModuleData,
  type QuizQuestionData,
} from "./editor-modules";
import { PublishDialog } from "./publish-dialog";
import { PublishWatcher } from "./publish-watcher";
import { SaveBar } from "./save-bar";
import { CourseQuizAuthor } from "./course-quiz-author";
import { RegenerateModuleButton } from "./regenerate-module-button";
import { CoverImageField } from "./cover-image-field";
import { CourseSwitcher } from "./course-switcher";
import { ModuleNav } from "./module-nav";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

interface CourseEditRow {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  emoji: string | null;
  cover_r2_key: string | null;
  status: string;
  est_minutes: number | null;
  primary_lang: string;
  available_langs: string;
  title_i18n: string | null;
  publish_at: number | null;
}

type ModuleRow = ModuleData;
type BlockRow = BlockData;

export default async function EditCoursePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; courseSlug: string }>;
  searchParams: Promise<{ m?: string }>;
}) {
  const { slug, courseSlug } = await params;
  const { m: activeModuleId } = await searchParams;
  try {
    await requireOperatorMembership(slug);
  } catch {
    notFound();
  }

  const op = await db()
    .prepare(
      `SELECT o.id, o.name, s.slug AS supplier_slug
       FROM operators o LEFT JOIN suppliers s ON s.id = o.supplier_id
       WHERE o.slug = ?`,
    )
    .bind(slug)
    .first<{ id: string; name: string; supplier_slug: string | null }>();
  if (!op) notFound();

  const tr = await t();

  const course = await db()
    .prepare(
      `SELECT id, slug, title, summary, emoji, cover_r2_key, status, est_minutes, primary_lang, available_langs, title_i18n, publish_at
       FROM courses WHERE operator_id = ? AND slug = ?`,
    )
    .bind(op.id, courseSlug)
    .first<CourseEditRow>();
  if (!course) notFound();

  // All of this product's courses, for the left-rail course switcher.
  const { results: allCourses = [] } = await db()
    .prepare(`SELECT slug, title FROM courses WHERE operator_id = ? ORDER BY position, title`)
    .bind(op.id)
    .all<{ slug: string; title: string }>();

  // Enabled languages = shown to learners (available_langs).
  const availableLangs: string[] = (() => {
    try {
      const a = JSON.parse(course.available_langs);
      return Array.isArray(a)
        ? a.filter((s): s is string => typeof s === "string")
        : [course.primary_lang];
    } catch {
      return [course.primary_lang];
    }
  })();

  const { results: modules } = await db()
    .prepare(
      `SELECT id, title, summary, est_minutes, position,
              narration_md_i18n, narration_audio_i18n, regen_at
       FROM modules WHERE course_id = ? ORDER BY position, id`,
    )
    .bind(course.id)
    .all<ModuleRow>();

  const moduleList = modules ?? [];
  const activeModule = moduleList.find((m) => m.id === activeModuleId) ?? moduleList[0] ?? null;

  // Pull every block at once and group client-side.
  const moduleIds = moduleList.map((m) => m.id);
  const blocksByModule: Record<string, BlockRow[]> = {};
  const estTexts: (string | null)[] = [];
  if (moduleIds.length > 0) {
    const ph = moduleIds.map(() => "?").join(",");
    const { results: blocks } = await db()
      .prepare(
        `SELECT id, module_id, position, kind, text_md, video_uid, video_r2_key, image_r2_key, images_json, caption,
                visibility, narrate, duration_s, audio_i18n,
                audio_r2_key, audio_voice, audio_duration_s, audio_generated_at
         FROM content_blocks WHERE module_id IN (${ph}) ORDER BY module_id, position`,
      )
      .bind(...moduleIds)
      .all<BlockRow>();
    for (const b of blocks ?? []) {
      (blocksByModule[b.module_id] ??= []).push(b);
      estTexts.push(b.text_md, b.caption);
    }
  }
  // Auto reading-time estimate from the course's text content (drives the cards'
  // "~N min" and the sidebar). Recomputed on every save, so it never drifts to 0.
  const estReadingMin = estimateReadingMinutes(estTexts);
  // Length guidance shown beside the estimate (no separate audio-duration box).
  // Bands: <5 min too short (slate) · 5–20 min good (green) · >20 min too long
  // (rose). Sweet spot ~15 min. No yellow.
  const LEN_TARGET = 20;
  const LEN_SWEET = 15;
  const lenBand =
    estReadingMin === 0 ? "none" : estReadingMin < 5 ? "low" : estReadingMin > LEN_TARGET ? "over" : "good";
  const lenBarCls =
    lenBand === "over" ? "bg-rose-400" : lenBand === "low" ? "bg-slate-400" : "bg-emerald-600";
  const lenTip =
    lenBand === "low" ? tr.ed_len_low : lenBand === "over" ? tr.ed_len_over : lenBand === "good" ? tr.ed_len_good : null;
  const lenPct = Math.min(100, (estReadingMin / LEN_TARGET) * 100);

  // Languages the active module already has narration in — drives the
  // centre-column 🎧 preview chips next to "Regenerate".
  const activeNarration: { lang: string; t: number }[] = (() => {
    if (!activeModule) return [];
    try {
      const v = JSON.parse(activeModule.narration_audio_i18n ?? "{}");
      if (!v || typeof v !== "object" || Array.isArray(v)) return [];
      return Object.entries(v as Record<string, { r2_key?: string; generated_at?: number }>)
        .filter(([, e]) => e?.r2_key)
        .map(([lang, e]) => ({ lang, t: e?.generated_at ?? 0 }));
    } catch {
      return [];
    }
  })();

  // Course-level final-exam question pool (no longer per-module).
  const { results: courseQuiz = [] } = await db()
    .prepare(
      `SELECT id, prompt, choices_json, correct_idx, explanation, position
       FROM quiz_questions WHERE course_id = ? ORDER BY position, id`,
    )
    .bind(course.id)
    .all<QuizQuestionData>();

  // Voices available to this product.
  const { results: voices = [] } = await db()
    .prepare(
      `SELECT v.id, v.name, v.provider, v.kind, v.gender, v.langs, v.status
       FROM voice_profiles v
       LEFT JOIN operators o ON o.supplier_id = v.supplier_id
       WHERE v.status = 'active'
         AND (v.supplier_id IS NULL OR o.slug = ?)
       GROUP BY v.id
       ORDER BY (v.kind = 'cloned') DESC, v.created_at DESC`,
    )
    .bind(slug)
    .all<{
      id: string;
      name: string;
      provider: string;
      kind: string;
      gender: string | null;
      langs: string | null;
      status: string;
    }>();

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased">
      <TopBar />
      <PublishWatcher />

      <div className="max-w-[1300px] mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-[230px_1fr_300px] gap-6 items-start">
        {/* ============ Left rail (sticky): course switch · languages · modules ============ */}
        <aside className="lg:sticky lg:top-[76px] space-y-5 order-1">
          <CourseSwitcher
            operatorSlug={slug}
            current={course.slug}
            courses={allCourses}
            label={tr.ed_course_label}
          />
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="font-semibold text-small text-slate-900 mb-3">{tr.ed_cover_label}</div>
            <CoverImageField
              courseId={course.id}
              operatorSlug={slug}
              supplierSlug={op.supplier_slug}
              hasCover={!!course.cover_r2_key}
              coverR2Key={course.cover_r2_key}
            />
          </div>
          <ModuleNav
            operatorSlug={slug}
            courseSlug={course.slug}
            modules={moduleList}
            activeId={activeModule?.id ?? null}
          />
        </aside>

        {/* ============ Centre: course title/summary + the active module ============ */}
        <main id="course-editor-main" className="order-3 lg:order-2 min-w-0 space-y-6">
          <form
            id="course-form"
            action={updateCourse}
            className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4"
          >
            <input type="hidden" name="operator_slug" value={slug} />
            <input type="hidden" name="course_slug" value={course.slug} />
            <Field label={tr.nc_f_title}>
              <input name="title" defaultValue={course.title} required maxLength={200} className={inputClass} />
            </Field>
            <Field label={tr.nc_f_summary}>
              <textarea
                name="summary"
                rows={2}
                maxLength={1000}
                defaultValue={course.summary ?? ""}
                className={inputClass + " resize-y"}
              />
            </Field>
          </form>

          <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <EditorModules
              solo
              operatorSlug={slug}
              supplierSlug={op.supplier_slug}
              courseSlug={course.slug}
              primaryLang={course.primary_lang}
              availableLangs={availableLangs}
              voices={voices ?? []}
              modules={activeModule ? [activeModule] : []}
              blocksByModuleId={blocksByModule}
              moduleOptionsSlot={
                activeModule ? (
                  <RegenerateModuleButton
                    operatorSlug={slug}
                    courseSlug={course.slug}
                    moduleId={activeModule.id}
                    narration={activeNarration}
                    regenAt={activeModule.regen_at ?? 0}
                  />
                ) : null
              }
            />
          </section>

          {/* Course-level final exam — after all chapters */}
          <CourseQuizAuthor
            operatorSlug={slug}
            courseSlug={course.slug}
            questions={courseQuiz ?? []}
          />
        </main>

        {/* ============ Right rail (sticky): one save button + course settings ============ */}
        <aside className="lg:sticky lg:top-[76px] space-y-5 order-2 lg:order-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
            {/* Current status */}
            <div className="flex items-center justify-between">
              <span className="text-caption text-slate-500">{tr.ed_status}</span>
              {course.status === "published" ? (
                <span className="px-2 py-0.5 rounded-full bg-lime-100 border border-lime-200 text-lime-700 text-micro font-medium">
                  {tr.ed_published}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 border border-amber-200 text-slate-900 text-micro font-medium">
                  {tr.ed_draft}
                </span>
              )}
            </div>

            {/* All three buttons submit the single #course-form, so edits are
                saved either way; formAction sets the resulting status. */}
            <SaveBar label={tr.ed_save_changes} />
            {/* Publish opens a dialog: pick languages + voices, generate all
                narration in the background, then go live. Save changes first. */}
            <PublishDialog
              operatorSlug={slug}
              courseSlug={course.slug}
              courseTitle={course.title}
              primaryLang={course.primary_lang}
              voices={voices ?? []}
              enabledLangs={availableLangs}
              publishAt={course.publish_at ?? 0}
              triggerClassName="w-full px-4 py-2 rounded-md bg-lime-600 text-white font-semibold text-small hover:bg-lime-700"
            >
              {course.status === "published" ? tr.ed_republish : tr.ed_publish}
            </PublishDialog>
            {course.status === "published" ? (
              <button
                type="submit"
                form="course-form"
                formAction={unpublishCourse}
                className="w-full px-4 py-2 rounded-md border border-slate-300 text-slate-700 font-semibold text-small hover:bg-slate-50"
              >
                {tr.ed_unpublish}
              </button>
            ) : null}

            <div className="flex items-center gap-3 text-caption">
              <Link
                href={`/learn/${slug}/${course.slug}?preview=1`}
                target="_blank"
                className="text-slate-900 hover:underline"
                title={tr.ed_preview_title}
              >
                {tr.ed_preview}
              </Link>
              {course.status === "published" ? (
                <Link
                  href={`/learn/${slug}/${course.slug}`}
                  target="_blank"
                  className="text-slate-900 hover:underline"
                >
                  {tr.ed_view_live}
                </Link>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
            <div className="font-semibold text-small text-slate-900">{tr.ed_course_details}</div>

            <Field label={tr.ed_minutes}>
              <div className="flex items-baseline gap-2">
                <span className="text-h2 font-semibold text-slate-900 tabular-nums">
                  {estReadingMin > 0 ? `~${estReadingMin}` : "—"}
                </span>
                <span className="text-caption text-slate-500">{tr.ed_minutes_unit}</span>
              </div>
              {estReadingMin > 0 ? (
                <div
                  className="h-2 rounded-full bg-slate-100 overflow-hidden mt-2.5 relative"
                  title={tr.ed_len_target}
                >
                  <div className={`${lenBarCls} h-full transition-all`} style={{ width: `${lenPct}%` }} />
                  <div
                    className="absolute top-0 bottom-0 w-px bg-white/60"
                    style={{ left: `${(LEN_SWEET / LEN_TARGET) * 100}%` }}
                  />
                </div>
              ) : null}
              {lenTip ? <p className="text-caption text-slate-600 mt-2">{lenTip}</p> : null}
              <p className="text-caption text-slate-400 mt-1">{tr.ed_minutes_auto}</p>
            </Field>
            {/* Status is set by the Publish / Unpublish buttons above; this
                hidden field preserves the current status on a plain Save. */}
            <input type="hidden" name="status" form="course-form" defaultValue={course.status} />
          </div>

          <form action={deleteCourse} className="px-1">
            <input type="hidden" name="operator_slug" value={slug} />
            <input type="hidden" name="course_slug" value={course.slug} />
            <button type="submit" className="text-caption text-rose-600 hover:underline">
              {tr.ed_delete_course}
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}


const inputClass =
  "w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-small text-slate-900 outline-none focus:border-emerald-400/60";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-caption font-semibold text-slate-700 mb-1.5">{label}</div>
      {children}
    </label>
  );
}
