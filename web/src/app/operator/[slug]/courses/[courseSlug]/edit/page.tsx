import { notFound } from "next/navigation";
import Link from "next/link";
import { TopBar } from "../../../../../_components/top-bar";
import { requireOperatorMembership } from "@/lib/roles";
import { db } from "@/lib/db";
import { updateCourse, deleteCourse, createModule } from "../../actions";
import {
  EditorModules,
  type BlockData,
  type ModuleData,
  type QuizQuestionData,
} from "./editor-modules";
import { AttachmentsPanel, type AttachmentRow } from "./attachments";
import { TranslationsPanel } from "./translations-panel";
import { CoverImageField } from "./cover-image-field";

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
}

type ModuleRow = ModuleData;

type BlockRow = BlockData;

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ slug: string; courseSlug: string }>;
}) {
  const { slug, courseSlug } = await params;
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

  const course = await db()
    .prepare(
      `SELECT id, slug, title, summary, emoji, cover_r2_key, status, est_minutes, primary_lang, available_langs
       FROM courses WHERE operator_id = ? AND slug = ?`,
    )
    .bind(op.id, courseSlug)
    .first<CourseEditRow>();
  if (!course) notFound();
  const availableLangs: string[] = (() => {
    try {
      const a = JSON.parse(course.available_langs);
      return Array.isArray(a) ? a.filter((s): s is string => typeof s === "string") : [course.primary_lang];
    } catch {
      return [course.primary_lang];
    }
  })();

  const { results: modules } = await db()
    .prepare(
      `SELECT id, title, summary, est_minutes, position
       FROM modules WHERE course_id = ? ORDER BY position, id`,
    )
    .bind(course.id)
    .all<ModuleRow>();

  // Pull every block at once (one query) and group client-side.
  const moduleIds = (modules ?? []).map((m) => m.id);
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

  // Quiz pool per module — one query joining on course.
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

  // Voices available to this product: every platform stock voice + every
  // cloned voice owned by the parent supplier.
  const { results: voices = [] } = await db()
    .prepare(
      `SELECT v.id, v.name, v.provider, v.kind, v.gender, v.langs, v.status
       FROM voice_profiles v
       LEFT JOIN operators o ON o.supplier_id = v.supplier_id
       WHERE v.status = 'active'
         AND (v.supplier_id IS NULL OR o.slug = ?)
       GROUP BY v.id
       -- Cloned (supplier-owned) voices first, then the rest. Per-language
       -- filtering + default selection happens client-side in AudioLangRow.
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
            <Link href={`/operator/${slug}`} className="hover:text-white">
              {op.name}
            </Link>
            <span className="text-white/20">/</span>
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

      <main className="px-5 sm:px-8 py-8 max-w-4xl mx-auto space-y-8">
        {/* ============== Languages (AI translation) — top of the editor ============== */}
        <TranslationsPanel
          operatorSlug={slug}
          courseSlug={course.slug}
          primaryLang={course.primary_lang}
          availableLangs={availableLangs}
        />

        {/* ============== Duration banner ============== */}
        <DurationBanner totalS={totalDurationS} totalMin={totalMin} totalSec={totalSec} />

        {/* ============== Course meta ============== */}
        <section className="rounded-2xl border border-white/[.08] bg-[#0a3a2f]">
          <header className="px-5 py-4 border-b border-white/[.06] flex items-center justify-between">
            <div className="font-semibold text-[14px] text-white">Course details</div>
            <div className="flex items-center gap-3">
              <Link
                href={`/learn/${slug}/${course.slug}?preview=1`}
                target="_blank"
                className="text-[12px] text-amber-300 hover:underline"
                title="Preview the course as a learner would see it, even while draft"
              >
                Preview →
              </Link>
              {course.status === "published" ? (
                <Link
                  href={`/learn/${slug}/${course.slug}`}
                  target="_blank"
                  className="text-[12px] text-emerald-300 hover:underline"
                >
                  View live →
                </Link>
              ) : null}
            </div>
          </header>
          <form action={updateCourse} className="p-5 space-y-4">
            <input type="hidden" name="operator_slug" value={slug} />
            <input type="hidden" name="course_slug" value={course.slug} />

            <Field label="Title">
              <input
                name="title"
                defaultValue={course.title}
                required
                maxLength={200}
                className={inputClass}
              />
            </Field>

            <Field label="Summary">
              <textarea
                name="summary"
                rows={3}
                maxLength={1000}
                defaultValue={course.summary ?? ""}
                className={inputClass + " resize-y"}
              />
            </Field>

            <CoverImageField
              courseId={course.id}
              operatorSlug={slug}
              courseSlug={course.slug}
              emoji={course.emoji}
              hasCover={!!course.cover_r2_key}
            />

            <div className="grid grid-cols-2 gap-4">
              <Field label="Minutes">
                <input
                  name="est_minutes"
                  type="number"
                  min={1}
                  max={600}
                  defaultValue={course.est_minutes ?? ""}
                  className={inputClass}
                />
              </Field>
              <Field label="Status">
                <select name="status" defaultValue={course.status} className={inputClass}>
                  <option value="draft">draft</option>
                  <option value="published">published</option>
                </select>
              </Field>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="submit"
                className="px-4 py-2 rounded-md bg-emerald-400 text-[#04241e] font-semibold text-[13px] hover:bg-emerald-300"
              >
                Save changes
              </button>
              {/* Delete is a separate form to avoid form-nesting */}
            </div>
          </form>

          <form
            action={deleteCourse}
            className="px-5 pb-5 -mt-1 flex items-center justify-end"
          >
            <input type="hidden" name="operator_slug" value={slug} />
            <input type="hidden" name="course_slug" value={course.slug} />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-md border border-rose-400/30 text-rose-300 text-[12px] hover:bg-rose-400/10"
            >
              Delete course
            </button>
          </form>
        </section>

        {/* ============== Modules + blocks ============== */}
        <section className="rounded-2xl border border-white/[.08] bg-[#0a3a2f]">
          <header className="px-5 py-4 border-b border-white/[.06] flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="font-semibold text-[14px] text-white">Modules</div>
              <div className="text-[12px] text-[#86b69a] mt-0.5">
                {modules?.length ?? 0} module{modules?.length === 1 ? "" : "s"} · drag ⠿ to reorder
              </div>
            </div>
            {op.supplier_slug ? (
              <Link
                href={`/supplier/${op.supplier_slug}`}
                className="text-[12px] text-emerald-300 hover:underline shrink-0"
                title="Stock voices work for every language. Clone a sales rep's own voice on the Supplier dashboard."
              >
                🎙️ Manage &amp; clone voices →
              </Link>
            ) : null}
          </header>

          <EditorModules
            operatorSlug={slug}
            courseSlug={course.slug}
            primaryLang={course.primary_lang}
            availableLangs={availableLangs}
            voices={voices ?? []}
            modules={modules ?? []}
            blocksByModuleId={blocksByModule}
            quizByModuleId={quizByModule}
          />

          {/* New-module form */}
          <form action={createModule} className="p-5 border-t border-white/[.04] flex gap-2">
            <input type="hidden" name="operator_slug" value={slug} />
            <input type="hidden" name="course_slug" value={course.slug} />
            <input
              name="title"
              required
              placeholder="New module title — e.g. Lifts & terrain map"
              className={`flex-1 ${inputClass}`}
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-emerald-400 text-[#04241e] font-semibold text-[13px] hover:bg-emerald-300 shrink-0"
            >
              + Add module
            </button>
          </form>
        </section>

        {/* ============== Supplementary materials (RAG-only) ============== */}
        <AttachmentsPanel
          operatorSlug={slug}
          courseSlug={course.slug}
          attachments={attachments ?? []}
        />
      </main>
    </div>
  );
}

function DurationBanner({
  totalS,
  totalMin,
  totalSec,
}: {
  totalS: number;
  totalMin: number;
  totalSec: number;
}) {
  // Recommended: ≤ 20 min (1200 s). Sweet spot: ~15 min (900 s).
  // < 5 min = under-cooked; > 20 = over-long.
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
    low: "Under 5 min — consider adding more content.",
    good: "Length is in the sweet spot.",
    warn: "Past 15 min — getting long. Trim or split if you can.",
    over: "Over 20 min — strongly consider splitting this course.",
  }[band];
  const fmt = `${totalMin}:${totalSec.toString().padStart(2, "0")}`;
  return (
    <section className="rounded-xl border border-white/[.08] bg-[#0a3a2f] p-4">
      <div className="flex items-baseline justify-between mb-2">
        <div className="text-[11px] tracking-widest font-mono text-emerald-300/70">COURSE LENGTH</div>
        <div className="text-[12px] text-[#a7d4b6]">Target ≤ 20:00 · sweet spot ~15:00</div>
      </div>
      <div className="flex items-end justify-between gap-3">
        <div className="font-mono text-[28px] text-white tabular-nums leading-none">{fmt}</div>
        <div className="text-[12px] text-[#a7d4b6] flex-1 ml-4 mb-1">{tip}</div>
      </div>
      <div className="h-2 rounded-full bg-white/[.06] overflow-hidden mt-3 relative">
        <div className={`${cls} h-full transition-all`} style={{ width: `${pct}%` }} />
        {/* Sweet-spot marker */}
        <div
          className="absolute top-0 bottom-0 w-px bg-white/40"
          style={{ left: `${(SWEET / TARGET) * 100}%` }}
          title="15:00 sweet spot"
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

