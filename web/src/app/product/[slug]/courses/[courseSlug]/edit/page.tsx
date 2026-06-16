import { notFound } from "next/navigation";
import Link from "next/link";
import { TopBar } from "../../../../../_components/top-bar";
import { requireOperatorMembership } from "@/lib/roles";
import { withReturnTo } from "@/lib/nav";
import { db } from "@/lib/db";
import { updateCourse, deleteCourse } from "../../actions";
import {
  EditorModules,
  ModuleNarration,
  type BlockData,
  type ModuleData,
  type QuizQuestionData,
} from "./editor-modules";
import { AttachmentsPanel, type AttachmentRow } from "./attachments";
import { TranslationsPanel } from "./translations-panel";
import { CoverImageField } from "./cover-image-field";
import { CourseSwitcher } from "./course-switcher";
import { ModuleNav } from "./module-nav";
import { t } from "@/lib/i18n";
import type { Dict } from "@/lib/i18n";

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
      `SELECT id, slug, title, summary, emoji, cover_r2_key, status, est_minutes, primary_lang, available_langs, title_i18n
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
  // Translated languages = ever translated (content present).
  const translatedLangs: string[] = (() => {
    const set = new Set<string>([course.primary_lang]);
    try {
      const m = JSON.parse(course.title_i18n ?? "{}");
      if (m && typeof m === "object") {
        for (const k of Object.keys(m)) if (typeof m[k] === "string" && m[k]) set.add(k);
      }
    } catch {
      /* ignore */
    }
    for (const l of availableLangs) set.add(l);
    return Array.from(set);
  })();

  const { results: modules } = await db()
    .prepare(
      `SELECT id, title, summary, est_minutes, position,
              narration_md_i18n, narration_audio_i18n
       FROM modules WHERE course_id = ? ORDER BY position, id`,
    )
    .bind(course.id)
    .all<ModuleRow>();

  const moduleList = modules ?? [];
  const activeModule = moduleList.find((m) => m.id === activeModuleId) ?? moduleList[0] ?? null;

  // Pull every block at once and group client-side.
  const moduleIds = moduleList.map((m) => m.id);
  const blocksByModule: Record<string, BlockRow[]> = {};
  let totalDurationS = 0;
  if (moduleIds.length > 0) {
    const ph = moduleIds.map(() => "?").join(",");
    const { results: blocks } = await db()
      .prepare(
        `SELECT id, module_id, position, kind, text_md, video_uid, image_r2_key, caption,
                visibility, duration_s, audio_i18n,
                audio_r2_key, audio_voice, audio_duration_s, audio_generated_at
         FROM content_blocks WHERE module_id IN (${ph}) ORDER BY module_id, position`,
      )
      .bind(...moduleIds)
      .all<BlockRow>();
    for (const b of blocks ?? []) {
      (blocksByModule[b.module_id] ??= []).push(b);
      if (b.duration_s) totalDurationS += b.duration_s;
    }
  }
  const totalMin = Math.floor(totalDurationS / 60);
  const totalSec = totalDurationS % 60;

  const { results: attachments = [] } = await db()
    .prepare(
      `SELECT id, filename, mime_type, size_bytes, rag_status, created_at
       FROM course_attachments WHERE course_id = ? ORDER BY created_at DESC`,
    )
    .bind(course.id)
    .all<AttachmentRow>();

  // Quiz pool per module.
  const quizByModule: Record<string, QuizQuestionData[]> = {};
  if (moduleIds.length > 0) {
    const ph2 = moduleIds.map(() => "?").join(",");
    const { results: qs = [] } = await db()
      .prepare(
        `SELECT id, module_id, prompt, choices_json, correct_idx, explanation, position
         FROM quiz_questions WHERE module_id IN (${ph2}) ORDER BY module_id, position`,
      )
      .bind(...moduleIds)
      .all<QuizQuestionData & { module_id: string }>();
    for (const q of qs) {
      (quizByModule[q.module_id] ??= []).push({
        id: q.id,
        prompt: q.prompt,
        choices_json: q.choices_json,
        correct_idx: q.correct_idx,
        explanation: q.explanation,
        position: q.position,
      });
    }
  }

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
    <div className="min-h-screen bg-[#04241e] text-[#f0fdf4] font-sans antialiased">
      <TopBar
        breadcrumb={
          <span className="flex items-center gap-2 min-w-0 text-[14px]">
            <Link href="/" className="hover:text-white shrink-0">
              {tr.nav_home}
            </Link>
            <span className="text-white/20 shrink-0">/</span>
            {op.supplier_slug ? (
              <>
                <Link href={`/supplier/${op.supplier_slug}`} className="hover:text-white shrink-0">
                  {tr.bc_supplier}
                </Link>
                <span className="text-white/20 shrink-0">/</span>
              </>
            ) : null}
            <Link href={`/product/${slug}`} className="hover:text-white shrink-0">
              {op.name}
            </Link>
            <span className="text-white/20 shrink-0">/</span>
            <span className="text-white truncate">{course.title}</span>
            <span
              className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                course.status === "published"
                  ? "bg-lime-300/10 border-lime-300/30 text-lime-300"
                  : "bg-amber-300/10 border-amber-300/30 text-amber-300"
              }`}
            >
              {course.status}
            </span>
          </span>
        }
      />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-[230px_1fr_300px] gap-6 items-start">
        {/* ============ Left rail (sticky): course switch · languages · modules ============ */}
        <aside className="lg:sticky lg:top-[76px] space-y-5 order-1">
          <CourseSwitcher
            operatorSlug={slug}
            current={course.slug}
            courses={allCourses}
            label={tr.ed_course_label}
          />
          <TranslationsPanel
            operatorSlug={slug}
            courseSlug={course.slug}
            primaryLang={course.primary_lang}
            enabledLangs={availableLangs}
            translatedLangs={translatedLangs}
          />
          <ModuleNav
            operatorSlug={slug}
            courseSlug={course.slug}
            modules={moduleList}
            activeId={activeModule?.id ?? null}
          />
        </aside>

        {/* ============ Centre: course title/summary + the active module ============ */}
        <main className="order-3 lg:order-2 min-w-0 space-y-6">
          <form
            id="course-form"
            action={updateCourse}
            className="rounded-2xl border border-white/[.08] bg-[#0a3a2f] p-5 space-y-4"
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

          <section className="rounded-2xl border border-white/[.08] bg-[#0a3a2f] overflow-hidden">
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
              quizByModuleId={quizByModule}
            />
          </section>

          <AttachmentsPanel operatorSlug={slug} courseSlug={course.slug} attachments={attachments ?? []} />
        </main>

        {/* ============ Right rail (sticky): one save button + course settings ============ */}
        <aside className="lg:sticky lg:top-[76px] space-y-5 order-2 lg:order-3">
          <div className="rounded-2xl border border-white/[.08] bg-[#0a3a2f] p-4 space-y-3">
            {/* Single save button for the whole course (associated to #course-form). */}
            <button
              type="submit"
              form="course-form"
              className="w-full px-4 py-2.5 rounded-md bg-emerald-400 text-[#04241e] font-semibold text-[14px] hover:bg-emerald-300"
            >
              {tr.ed_save_changes}
            </button>
            <div className="flex items-center gap-3 text-[12px]">
              <Link
                href={`/learn/${slug}/${course.slug}?preview=1`}
                target="_blank"
                className="text-amber-300 hover:underline"
                title={tr.ed_preview_title}
              >
                {tr.ed_preview}
              </Link>
              {course.status === "published" ? (
                <Link
                  href={`/learn/${slug}/${course.slug}`}
                  target="_blank"
                  className="text-emerald-300 hover:underline"
                >
                  {tr.ed_view_live}
                </Link>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-white/[.08] bg-[#0a3a2f] p-4 space-y-4">
            <div className="font-semibold text-[13px] text-white">{tr.ed_course_details}</div>
            <CoverImageField
              courseId={course.id}
              operatorSlug={slug}
              supplierSlug={op.supplier_slug}
              courseSlug={course.slug}
              emoji={course.emoji}
              hasCover={!!course.cover_r2_key}
            />
            <div className="grid grid-cols-2 gap-3">
              <Field label={tr.ed_minutes}>
                <input
                  name="est_minutes"
                  form="course-form"
                  type="number"
                  min={1}
                  max={600}
                  defaultValue={course.est_minutes ?? ""}
                  className={inputClass}
                />
              </Field>
              <Field label={tr.ed_status}>
                <select name="status" form="course-form" defaultValue={course.status} className={inputClass}>
                  <option value="draft">{tr.ed_draft}</option>
                  <option value="published">{tr.ed_published}</option>
                </select>
              </Field>
            </div>
            {activeModule ? (
              <div className="border-t border-white/[.06] pt-3">
                <ModuleNarration
                  moduleId={activeModule.id}
                  operatorSlug={slug}
                  courseSlug={course.slug}
                  primaryLang={course.primary_lang}
                  availableLangs={availableLangs}
                  voices={voices ?? []}
                  narrationMdI18n={activeModule.narration_md_i18n ?? null}
                  narrationAudioI18n={activeModule.narration_audio_i18n ?? null}
                  blocks={blocksByModule[activeModule.id] ?? []}
                />
              </div>
            ) : null}

            {op.supplier_slug ? (
              <Link
                href={withReturnTo(
                  `/supplier/${op.supplier_slug}/voices`,
                  `/product/${slug}/courses/${course.slug}/edit${activeModule ? `?m=${activeModule.id}` : ""}`,
                )}
                className="block text-[12px] text-emerald-300 hover:underline"
                title={tr.ed_voices_title}
              >
                {tr.ed_manage_voices}
              </Link>
            ) : null}
          </div>

          <DurationBanner totalS={totalDurationS} totalMin={totalMin} totalSec={totalSec} tr={tr} />

          <form action={deleteCourse} className="px-1">
            <input type="hidden" name="operator_slug" value={slug} />
            <input type="hidden" name="course_slug" value={course.slug} />
            <button type="submit" className="text-[12px] text-rose-300 hover:underline">
              {tr.ed_delete_course}
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}

function DurationBanner({
  totalS,
  totalMin,
  totalSec,
  tr,
}: {
  totalS: number;
  totalMin: number;
  totalSec: number;
  tr: Dict;
}) {
  const TARGET = 20 * 60;
  const SWEET = 15 * 60;
  const pct = Math.min(100, (totalS / TARGET) * 100);
  let band: "low" | "good" | "warn" | "over";
  if (totalS < 5 * 60) band = "low";
  else if (totalS <= SWEET) band = "good";
  else if (totalS <= TARGET) band = "warn";
  else band = "over";
  const cls = {
    low: "bg-slate-400",
    good: "bg-emerald-400",
    warn: "bg-amber-400",
    over: "bg-rose-400",
  }[band];
  const tip = {
    low: tr.ed_len_low,
    good: tr.ed_len_good,
    warn: tr.ed_len_warn,
    over: tr.ed_len_over,
  }[band];
  const fmt = `${totalMin}:${totalSec.toString().padStart(2, "0")}`;
  return (
    <section className="rounded-xl border border-white/[.08] bg-[#0a3a2f] p-4">
      <div className="flex items-baseline justify-between mb-2">
        <div className="text-[11px] tracking-widest font-mono text-emerald-300/70">{tr.ed_len_label}</div>
        <div className="text-[12px] text-[#a7d4b6]">{tr.ed_len_target}</div>
      </div>
      <div className="flex items-end justify-between gap-3">
        <div className="font-mono text-[28px] text-white tabular-nums leading-none">{fmt}</div>
        <div className="text-[12px] text-[#a7d4b6] flex-1 ml-4 mb-1">{tip}</div>
      </div>
      <div className="h-2 rounded-full bg-white/[.06] overflow-hidden mt-3 relative">
        <div className={`${cls} h-full transition-all`} style={{ width: `${pct}%` }} />
        <div
          className="absolute top-0 bottom-0 w-px bg-white/40"
          style={{ left: `${(SWEET / TARGET) * 100}%` }}
          title={tr.ed_len_sweet}
        />
      </div>
    </section>
  );
}

const inputClass =
  "w-full bg-[#04241e] border border-white/[.10] rounded-md px-3 py-2 text-[14px] text-white outline-none focus:border-emerald-400/60";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[12px] font-semibold text-[#e6f5ec] mb-1.5">{label}</div>
      {children}
    </label>
  );
}
