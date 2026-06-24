import { notFound } from "next/navigation";
import { mediaUrl } from "@/lib/media";
import Link from "next/link";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getCourseBySlug, getModuleBlocks, type ModuleRow } from "@/lib/db";
import { resolveTheme, themeCssVars } from "@/lib/theme";
import {
  ensureUser,
  ensureEnrollment,
  getModuleProgress,
} from "@/lib/progress";
import { ModuleReader } from "./module-reader";
import { QuizPanel } from "./quiz-panel";
import { Delisted } from "../../../_components/delisted";
import { completeModuleAction } from "./actions";
import { TopBar } from "../../../_components/top-bar";
import { AskAI } from "../../../_components/ask-ai";
import { FeedbackWidget } from "./feedback-widget";
import { t, fmt } from "@/lib/i18n";
import { requireOnboarded } from "@/lib/onboarding";

export const dynamic = "force-dynamic";

/** Audio sibling fallback: Simplified/Traditional Chinese share spoken
 *  Mandarin, so one's narration fits the other's text. */
const SIBLING_AUDIO: Record<string, string[]> = {
  "zh-TW": ["zh-CN"],
  "zh-CN": ["zh-TW"],
};

interface Props {
  params: Promise<{ operator: string; course: string }>;
  searchParams: Promise<{ m?: string; preview?: string; lang?: string }>;
}

export default async function CoursePage({ params, searchParams }: Props) {
  const { operator: operatorSlug, course: courseSlug } = await params;
  const { m: moduleSlug, preview, lang: langParam } = await searchParams;
  const isPreview = preview === "1";

  const data = await getCourseBySlug(operatorSlug, courseSlug);
  if (!data) notFound();
  const { operator, course, modules } = data;

  // Disabled supplier: the course is delisted. A learner who has history here
  // (enrollment or badge) gets a friendly "delisted" notice so their /learn and
  // badge links don't dead-end; everyone else gets a plain 404.
  if (data.supplierStatus === "suspended") {
    const { userId: uid } = await auth();
    let hasHistory = false;
    if (uid) {
      const h = await (await import("@/lib/db")).db()
        .prepare(
          `SELECT 1 AS x FROM enrollments WHERE user_id = ? AND course_id = ?
           UNION SELECT 1 FROM badges WHERE user_id = ? AND course_id = ? LIMIT 1`,
        )
        .bind(uid, course.id, uid, course.id)
        .first<{ x: number }>();
      hasHistory = !!h;
    }
    if (!hasHistory) notFound();
    const tr0 = await t();
    return <Delisted message={tr0.delisted_course} backLabel={tr0.delisted_back} />;
  }

  // Draft-gate: only operator/supplier/admin members can preview a draft.
  // We let the call to requireOperatorMembership throw for unauthorised users
  // and treat anything other than success as notFound (no draft leak).
  if (course.status !== "published") {
    if (!isPreview) notFound();
    const { requireOperatorMembership } = await import("@/lib/roles");
    try {
      await requireOperatorMembership(operatorSlug);
    } catch {
      notFound();
    }
  }

  if (modules.length === 0) {
    return <EmptyCourse operator={operator.name} title={course.title} />;
  }

  const { userId } = await auth();
  if (!userId) notFound();
  await requireOnboarded();

  const user = await currentUser();
  await ensureUser({
    id: userId,
    email: user?.emailAddresses?.[0]?.emailAddress ?? "",
    name: user?.fullName,
    preferredLang: "en",
  });
  await ensureEnrollment(userId, course.id);

  // Best-effort: snapshot the learner's last_seen_version to suppress the
  // "Updated" chip next time they land here. Per-call, not per-render.
  const { markCourseSeenAction } = await import("../../actions");
  await markCourseSeenAction({ courseId: course.id }).catch(() => {});

  const progressMap = await getModuleProgress(userId, course.id);

  // No chapter gating: every module is navigable in any order (learners often
  // need to jump straight to a newly-added chapter on a product update). The
  // badge — not an unlock — is what requires passing every quiz. `current` is
  // still the first uncompleted module, used only as the default landing one.
  const currentIdx = (() => {
    const i = modules.findIndex((m) => !progressMap.get(m.id)?.completed_at);
    return i === -1 ? modules.length - 1 : i;
  })();
  const currentModule = modules[currentIdx] ?? modules[0];
  const requestedIdx = modules.findIndex((m) => m.slug === moduleSlug);
  const active = requestedIdx >= 0 ? modules[requestedIdx] : currentModule;
  const lockedFromIdx = modules.length; // nothing is locked
  const blocks = await getModuleBlocks(active.id);

  const completedCount = modules.filter((m) => progressMap.get(m.id)?.completed_at).length;
  const progressPct = Math.round((completedCount / modules.length) * 100);
  const tr = await t();

  // Course-level final exam: a single question pool for the whole course,
  // sat once after all chapters via a synthetic "Final exam" nav entry.
  // Pull up to QUIZ_N random questions from the course pool.
  const EXAM_SLUG = "__exam__";
  const QUIZ_N = 3;
  const { results: examPool = [] } = await (await import("@/lib/db")).db()
    .prepare(
      `SELECT id, prompt, choices_json FROM quiz_questions WHERE course_id = ?`,
    )
    .bind(course.id)
    .all<{ id: string; prompt: string; choices_json: string }>();
  const hasExam = examPool.length > 0;
  const examActive = moduleSlug === EXAM_SLUG && hasExam;
  // Already passed? Drives the "passed" chip on the exam entry + reader.
  const examPassed = hasExam
    ? !!(await (await import("@/lib/db")).db()
        .prepare(
          `SELECT 1 AS p FROM quiz_attempts WHERE course_id = ? AND user_id = ? AND passed = 1 LIMIT 1`,
        )
        .bind(course.id, userId)
        .first<{ p: number }>())
    : false;
  // Fisher-Yates shuffle deterministic per request (no Math.random concerns
  // here — server-side, fine).
  const shuffled = examPool.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const quizQuestions = shuffled.slice(0, QUIZ_N).map((q) => {
    let choices: string[] = [];
    try {
      const parsed = JSON.parse(q.choices_json);
      if (Array.isArray(parsed)) choices = parsed.map((c) => String(c));
    } catch {
      // skip malformed
    }
    return { id: q.id, prompt: q.prompt, choices };
  });

  // Multi-language: pick the chosen lang via this priority:
  //   1. explicit ?lang= URL param (lets a learner override per-tab)
  //   2. the user's UI locale cookie (set by the TopBar LANG switcher) —
  //      this is the "if you read the rest of the site in 中文, default
  //      the course to 中文 too" behavior
  //   3. course.primary_lang as the final fallback
  // In every case the chosen lang must be in available_langs; otherwise
  // we fall through to the next option.
  const { pickLocalized } = await import("@/lib/translate");
  const { getLocale } = await import("@/lib/i18n");
  const availableLangs: string[] = (() => {
    try {
      const a = JSON.parse(course.available_langs ?? "[]");
      const arr = Array.isArray(a) ? a.filter((s): s is string => typeof s === "string") : [];
      // Ensure primary_lang is always in the set so the source-lang chip
      // shows even if available_langs was never updated by a translate run.
      return arr.includes(course.primary_lang) ? arr : [course.primary_lang, ...arr];
    } catch {
      return [course.primary_lang];
    }
  })();
  const uiLocale = await getLocale();
  const chosenLang = ((): string => {
    if (langParam && availableLangs.includes(langParam)) return langParam;
    if (uiLocale && availableLangs.includes(uiLocale)) return uiLocale;
    return course.primary_lang;
  })();

  // Localize titles/summaries for header + module list. Per-block text/audio
  // localization happens inside ModuleReader.
  const courseTitleLocal = pickLocalized(course.title, course.title_i18n ?? null, course.primary_lang, chosenLang);
  const localizedModules = modules.map((m) => ({
    ...m,
    title: pickLocalized(m.title, m.title_i18n ?? null, course.primary_lang, chosenLang),
    summary: pickLocalized(m.summary, m.summary_i18n ?? null, course.primary_lang, chosenLang),
  }));
  const activeLocal = localizedModules.find((m) => m.id === active.id) ?? localizedModules[0];
  const localizedBlocks = blocks.map((b) => ({
    ...b,
    text_md: pickLocalized(b.text_md, b.text_md_i18n ?? null, course.primary_lang, chosenLang),
    caption: pickLocalized(b.caption, b.caption_i18n ?? null, course.primary_lang, chosenLang),
    // Audio: when chosen != primary, swap audio_r2_key + audio_generated_at
    // to the localized version from audio_i18n so ModuleReader's existing
    // audio src logic just works (it queries /api/audio?id=...).
    ...(chosenLang === course.primary_lang
      ? {}
      : (() => {
          try {
            const map = JSON.parse(b.audio_i18n ?? "{}");
            // Try the chosen language, then a sibling (zh-CN ↔ zh-TW share
            // spoken Mandarin, so the other's audio fits the displayed text).
            const candidates = [chosenLang, ...(SIBLING_AUDIO[chosenLang] ?? [])];
            for (const cand of candidates) {
              const e = map?.[cand];
              if (e?.r2_key) {
                return {
                  audio_r2_key: e.r2_key,
                  audio_voice: e.voice_id,
                  audio_lang: cand,
                  audio_duration_s: e.duration_s,
                  audio_generated_at: e.generated_at,
                  _audio_lang_query: cand,
                } as Partial<typeof b> & { _audio_lang_query?: string };
              }
            }
            return { audio_r2_key: null } as Partial<typeof b>;
          } catch {
            return { audio_r2_key: null } as Partial<typeof b>;
          }
        })()),
  }));

  // Module narration audio for the chosen language (sibling Mandarin fallback,
  // mirroring block audio). No cross-language fallback: if the learner's
  // language has no narration we show no player rather than the wrong language.
  const narrationSrc = ((): string | null => {
    try {
      const map = JSON.parse(active.narration_audio_i18n ?? "{}");
      const candidates = [chosenLang, ...(SIBLING_AUDIO[chosenLang] ?? [])];
      for (const cand of candidates) {
        const e = map?.[cand];
        if (e?.r2_key) {
          return `/api/module-audio?id=${active.id}&lang=${encodeURIComponent(cand)}&t=${e.generated_at ?? 0}`;
        }
      }
    } catch {
      // no narration
    }
    return null;
  })();

  async function onComplete(dwellSeconds: number): Promise<{ verifyCode?: string }> {
    "use server";
    return completeModuleAction({
      moduleId: active.id,
      courseId: course.id,
      dwellSeconds,
    });
  }

  const theme = resolveTheme(operator);

  return (
    <div
      className="min-h-screen font-sans antialiased text-body"
      style={themeCssVars(theme)}
    >
      <TopBar
        breadcrumb={
          <span className="flex items-center gap-2 min-w-0">
            <Link href="/learn" className="hover:text-white shrink-0">{tr.nav_my_learning}</Link>
            <span className="text-white/20 shrink-0">/</span>
            <Link
              href={`/learn?q=${encodeURIComponent(operator.name)}`}
              className="shrink-0 hover:text-white"
              title={fmt(tr.lr_browse_courses, { name: operator.name })}
            >
              {operator.name}
            </Link>
            <span className="text-white/20 shrink-0">/</span>
            <Link
              href={`/learn/${operatorSlug}/${courseSlug}${
                chosenLang !== course.primary_lang ? `?lang=${chosenLang}` : ""
              }`}
              className="text-white truncate hover:underline"
              title={tr.lr_back_to_course_start}
            >
              {courseTitleLocal}
            </Link>
          </span>
        }
      />

      {/* Everything below the TopBar is wrapped in op-theme-scope so the
          operator's chosen colours apply (the TopBar stays Libretour green). */}
      <div className="op-theme-scope">

      {isPreview ? (
        <div className="bg-amber-400/20 border-b border-amber-400/40 text-[#e6f5ec] text-caption font-mono px-4 py-1.5 flex items-center justify-center gap-2">
          {fmt(tr.lr_preview_banner, { status: course.status })}
        </div>
      ) : null}

      {availableLangs.length > 1 ? (
        <LangPicker
          langs={availableLangs}
          chosen={chosenLang}
          basePath={`/learn/${operatorSlug}/${courseSlug}`}
          activeSlug={examActive ? EXAM_SLUG : activeLocal.slug}
          preserveQuery={{ preview: isPreview ? "1" : undefined }}
          label={tr.lr_language}
        />
      ) : null}

      {/* Mobile-only: floating "Ask AI" pill that scrolls the sidebar into view. */}
      <a
        href="#course-ai"
        className="lg:hidden fixed right-4 bottom-4 z-20 px-3.5 py-2.5 rounded-full bg-[#0e3b2c] text-[#ffffff] font-semibold text-small shadow-[0_8px_24px_rgba(0,0,0,.4)] flex items-center gap-1.5"
      >
        <span>💬</span>
        <span>{tr.mobile_ask_ai}</span>
      </a>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_360px]">
        {/* Module list */}
        <aside
          className="border-b lg:border-b-0 lg:border-r border-white/[.06] p-5 lg:min-h-[calc(100vh-65px)]"
          style={{ background: "color-mix(in srgb, var(--op-panel) 60%, transparent)" }}
        >
          {theme.logoR2Key ? (
            <div className="mb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mediaUrl(theme.logoR2Key)}
                alt={operator.name}
                className="max-h-9 max-w-[180px] object-contain"
              />
            </div>
          ) : null}
          <div className="text-micro font-mono text-white mb-2">{tr.course_label}</div>
          <div className="text-body font-semibold mb-1 text-white">{courseTitleLocal}</div>
          <div className="text-small text-[#a7d4b6] mb-4">{operator.name}</div>

          <div className="h-1.5 bg-black/30 rounded-full overflow-hidden mb-2">
            <div
              className="h-full transition-all"
              style={{
                width: `${progressPct}%`,
                background: "var(--op-accent)",
              }}
            />
          </div>
          <div className="flex items-center justify-between text-small text-[#a7d4b6] mb-5">
            <span>
              {completedCount} / {modules.length}
            </span>
            <span className="font-medium" style={{ color: "var(--op-accent)" }}>
              {progressPct}%
            </span>
          </div>

          <div className="text-micro font-mono text-white mb-2">{tr.modules_label}</div>
          <ModuleList
            modules={localizedModules}
            active={activeLocal}
            progressMap={progressMap}
            basePath={`/learn/${operatorSlug}/${courseSlug}`}
            completedLabel={tr.completed_chip}
            langQuery={chosenLang !== course.primary_lang ? chosenLang : null}
            isPreview={isPreview}
            lockedFromIdx={lockedFromIdx}
            lockedLabel={tr.lr_module_locked}
            minLabel={tr.lr_module_min}
            lockedTooltip={tr.lr_module_locked_tooltip}
            examEntry={
              hasExam
                ? {
                    slug: EXAM_SLUG,
                    label: tr.lr_exam_title,
                    sublabel: examPassed ? tr.lr_quiz_passed_chip : tr.lr_exam_sub,
                    active: examActive,
                    passed: examPassed,
                  }
                : null
            }
          />
        </aside>

        {/* Reader — module content, or the course final exam */}
        {examActive ? (
          <ExamReader
            courseId={course.id}
            questions={quizQuestions}
            passed={examPassed}
            title={tr.lr_exam_title}
            intro={tr.lr_exam_intro}
          />
        ) : (
          <ModuleReader
            module={activeLocal}
            blocks={localizedBlocks}
            courseSlug={courseSlug}
            operatorSlug={operatorSlug}
            modules={localizedModules}
            narrationSrc={narrationSrc}
            isCompleted={!!progressMap.get(active.id)?.completed_at}
            onComplete={onComplete}
            tr={{
              module_position: tr.module_position,
              completed_chip: tr.completed_chip,
              no_blocks: tr.no_blocks,
              badge_earned: tr.badge_earned,
              verify_code_prefix: tr.verify_code_prefix,
              back_to_courses: tr.back_to_courses,
              start_module: tr.start_module,
              stay_to_complete_a: tr.stay_to_complete_a,
              stay_to_complete_b: tr.stay_to_complete_b,
              already_completed: tr.already_completed,
              ready_to_complete: tr.ready_to_complete,
              saving: tr.saving,
              done: tr.done,
              mark_complete: tr.mark_complete,
              mark_complete_and_continue: tr.mark_complete_and_continue,
              continue_to: tr.continue_to,
              video_caption_default: tr.video_caption_default,
              video_not_uploaded: tr.video_not_uploaded,
              video_setup_hint: tr.video_setup_hint,
            }}
          />
        )}

        {/* AI sidebar — scoped to this course */}
        <aside
          id="course-ai"
          className="border-t lg:border-t-0 lg:border-l border-white/[.06] lg:min-h-[calc(100vh-65px)] lg:max-h-[calc(100vh-65px)] scroll-mt-16 flex flex-col"
        >
          <div className="flex-1 min-h-0">
            <AskAI
              variant="sidebar"
              scope={{ operator_id: operator.id, course_id: course.id }}
              sidebarTitle={tr.ai_sidebar_title}
              sidebarSubtitle={tr.ai_sidebar_subtitle}
              emptyState={tr.ai_empty_state}
              thinkingText={tr.ai_thinking}
              noAnswerWarning={tr.ai_no_answer}
              askLabel={tr.ai_ask_button_inline}
              placeholder={fmt(tr.ai_sidebar_placeholder, { title: course.title })}
              examples={[]}
            />
          </div>
          <FeedbackWidget courseId={course.id} moduleId={active.id} />
        </aside>
      </div>
      </div>
    </div>
  );
}

/**
 * Course final exam, rendered in the reader column when the synthetic
 * "Final exam" nav entry is active. Wraps the client QuizPanel in the
 * reader's dark surface.
 */
function ExamReader({
  courseId,
  questions,
  passed,
  title,
  intro,
}: {
  courseId: string;
  questions: { id: string; prompt: string; choices: string[] }[];
  passed: boolean;
  title: string;
  intro: string;
}) {
  return (
    <div className="px-5 sm:px-8 py-6 lg:min-h-[calc(100vh-65px)]">
      <h1 className="text-h2 sm:text-h2 font-semibold text-white mb-1">{title}</h1>
      <p className="text-small text-[#a7d4b6] mb-5 max-w-2xl">{intro}</p>
      <QuizPanel courseId={courseId} questions={questions} isCompleted={passed} />
    </div>
  );
}

function ModuleList({
  modules,
  active,
  progressMap,
  basePath,
  completedLabel,
  langQuery,
  isPreview,
  lockedFromIdx,
  lockedLabel,
  minLabel,
  lockedTooltip,
  examEntry,
}: {
  modules: ModuleRow[];
  active: ModuleRow;
  progressMap: Map<string, { completed_at: number | null }>;
  basePath: string;
  completedLabel: string;
  langQuery: string | null;
  isPreview: boolean;
  lockedFromIdx: number;
  lockedLabel: string;
  minLabel: string;
  lockedTooltip: string;
  examEntry: { slug: string; label: string; sublabel: string; active: boolean; passed: boolean } | null;
}) {
  return (
    <div className="space-y-1">
      {modules.map((m, idx) => {
        const done = !!progressMap.get(m.id)?.completed_at;
        const isActive = m.id === active.id;
        const locked = idx >= lockedFromIdx;
        const dot = done
          ? "bg-emerald-300"
          : isActive
            ? "bg-emerald-400"
            : locked
              ? "bg-white/10"
              : "bg-white/15";
        const labelExtras = locked
          ? ` · 🔒 ${lockedLabel}`
          : done
            ? ` · ${completedLabel}`
            : "";
        const rowClass = `flex items-start gap-3 px-3 py-2.5 rounded-lg ${
          isActive
            ? "bg-emerald-400/10 border border-emerald-400/30"
            : "border border-transparent hover:bg-white/[.04]"
        } ${locked ? "opacity-50 cursor-not-allowed" : ""}`;
        const inner = (
          <>
            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${dot}`} />
            <div className="flex-1 min-w-0">
              <div className={`text-small ${isActive ? "font-medium text-white" : "text-[#d8f0e1]"}`}>
                {m.title}
              </div>
              <div className="text-micro text-[#86b69a]">
                {labelExtras.replace(/^ · /, "")}
              </div>
            </div>
          </>
        );
        if (locked) {
          return (
            <div key={m.id} className={rowClass} title={lockedTooltip}>
              {inner}
            </div>
          );
        }
        return (
          <Link
            key={m.id}
            href={`${basePath}?${new URLSearchParams({
              m: m.slug,
              ...(langQuery ? { lang: langQuery } : {}),
              ...(isPreview ? { preview: "1" } : {}),
            }).toString()}`}
            className={rowClass}
          >
            {inner}
          </Link>
        );
      })}

      {examEntry ? (
        <Link
          href={`${basePath}?${new URLSearchParams({
            m: examEntry.slug,
            ...(langQuery ? { lang: langQuery } : {}),
            ...(isPreview ? { preview: "1" } : {}),
          }).toString()}`}
          className={`flex items-start gap-3 px-3 py-2.5 rounded-lg mt-1 ${
            examEntry.active
              ? "bg-emerald-400/10 border border-emerald-400/30"
              : "border border-emerald-400/20 hover:bg-emerald-400/[.06]"
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
              examEntry.passed ? "bg-emerald-300" : "bg-emerald-400"
            }`}
          />
          <div className="flex-1 min-w-0">
            <div className={`text-small ${examEntry.active ? "font-medium text-white" : "text-white"}`}>
              📝 {examEntry.label}
            </div>
            <div className="text-micro text-[#86b69a]">{examEntry.sublabel}</div>
          </div>
        </Link>
      ) : null}
    </div>
  );
}

/**
 * Compact language picker shown above the reader when a course has > 1
 * available language. Each chip is a regular Link that preserves the
 * active module slug (?m=) and preview flag (?preview=1).
 */
function LangPicker({
  langs,
  chosen,
  basePath,
  activeSlug,
  preserveQuery,
  label,
}: {
  langs: string[];
  chosen: string;
  basePath: string;
  activeSlug: string;
  preserveQuery: Record<string, string | undefined>;
  label: string;
}) {
  return (
    <div className="border-b border-white/[.06] px-4 py-2 flex items-center gap-2 overflow-x-auto">
      <span className="text-micro font-mono text-white uppercase shrink-0">{label}</span>
      {langs.map((code) => {
        const params = new URLSearchParams({ m: activeSlug, lang: code });
        for (const [k, v] of Object.entries(preserveQuery)) {
          if (v) params.set(k, v);
        }
        const isOn = code === chosen;
        return (
          <Link
            key={code}
            href={`${basePath}?${params.toString()}`}
            className={`px-2.5 py-1 rounded-md text-caption font-medium border transition shrink-0 ${
              isOn
                ? "bg-[#0e3b2c] text-[#ffffff] border-[#0e3b2c]"
                : "border-white/[.10] text-white hover:bg-white/[.06]"
            }`}
          >
            {nativeLabel(code)}
          </Link>
        );
      })}
    </div>
  );
}

function nativeLabel(code: string): string {
  // English names only — some users can't tell Korean from Japanese by script,
  // so we avoid native labels and use unambiguous English language names.
  const map: Record<string, string> = {
    en: "English",
    "zh-CN": "Chinese (Simplified)",
    "zh-TW": "Chinese (Traditional)",
    ja: "Japanese",
    ko: "Korean",
    es: "Spanish",
    fr: "French",
    de: "German",
    pt: "Portuguese",
  };
  return map[code] ?? code;
}

async function EmptyCourse({ operator, title }: { operator: string; title: string }) {
  const tr = await t();
  return (
    <div className="min-h-screen bg-[#04241e] text-[#f0fdf4] font-sans antialiased flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <div className="text-micro font-mono text-white mb-3 tracking-widest">{tr.lr_draft_label}</div>
        <h1 className="text-h2 font-semibold text-white">{title}</h1>
        <p className="text-[#a7d4b6] mt-1.5">{operator}</p>
        <p className="mt-6 text-small text-[#a7d4b6] leading-relaxed">
          {tr.lr_draft_blurb}
        </p>
        <Link
          href="/learn"
          className="mt-7 inline-block px-4 py-2 rounded-md border border-white/[.10] text-small text-[#d8f0e1] hover:bg-white/[.06]"
        >
          {tr.lr_back_to_courses_arrow}
        </Link>
      </div>
    </div>
  );
}
