import { notFound } from "next/navigation";
import Link from "next/link";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getCourseBySlug, getModuleBlocks, parseAiExamples, type ModuleRow } from "@/lib/db";
import { resolveTheme, themeCssVars } from "@/lib/theme";
import {
  ensureUser,
  ensureEnrollment,
  getModuleProgress,
} from "@/lib/progress";
import { ModuleReader } from "./module-reader";
import { completeModuleAction } from "./actions";
import { TopBar } from "../../../_components/top-bar";
import { AskAI } from "../../../_components/ask-ai";
import { FeedbackWidget } from "./feedback-widget";
import { t, fmt } from "@/lib/i18n";

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

  // Chapter gating: the "current" module is the FIRST uncompleted one in
  // order. Modules after `current` are locked; modules at or before it
  // are navigable. This also means jumping to ?m=<future-slug> is silently
  // redirected to the current module — no skip-ahead.
  const currentIdx = (() => {
    const i = modules.findIndex((m) => !progressMap.get(m.id)?.completed_at);
    return i === -1 ? modules.length - 1 : i;
  })();
  const currentModule = modules[currentIdx] ?? modules[0];
  const requestedIdx = modules.findIndex((m) => m.slug === moduleSlug);
  const active =
    requestedIdx >= 0 && requestedIdx <= currentIdx ? modules[requestedIdx] : currentModule;
  const lockedFromIdx = currentIdx + 1; // every module at index ≥ this is locked
  const blocks = await getModuleBlocks(active.id);

  const completedCount = modules.filter((m) => progressMap.get(m.id)?.completed_at).length;
  const progressPct = Math.round((completedCount / modules.length) * 100);
  const tr = await t();

  // End-of-chapter quiz: pull up to QUIZ_N random questions from the active
  // module's pool. Empty pool → ModuleReader falls back to dwell+click flow.
  const QUIZ_N = 3;
  const { results: quizPool = [] } = await (await import("@/lib/db")).db()
    .prepare(
      `SELECT id, prompt, choices_json FROM quiz_questions WHERE module_id = ?`,
    )
    .bind(active.id)
    .all<{ id: string; prompt: string; choices_json: string }>();
  // Fisher-Yates shuffle deterministic per request (no Math.random concerns
  // here — server-side, fine).
  const shuffled = quizPool.slice();
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
      className="min-h-screen font-sans antialiased text-[16px]"
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
        <div className="bg-amber-400/20 border-b border-amber-400/40 text-amber-100 text-[12.5px] font-mono px-4 py-1.5 flex items-center justify-center gap-2">
          {fmt(tr.lr_preview_banner, { status: course.status })}
        </div>
      ) : null}

      {availableLangs.length > 1 ? (
        <LangPicker
          langs={availableLangs}
          chosen={chosenLang}
          basePath={`/learn/${operatorSlug}/${courseSlug}`}
          activeSlug={activeLocal.slug}
          preserveQuery={{ preview: isPreview ? "1" : undefined }}
          label={tr.lr_language}
        />
      ) : null}

      {/* Mobile-only: floating "Ask AI" pill that scrolls the sidebar into view. */}
      <a
        href="#course-ai"
        className="lg:hidden fixed right-4 bottom-4 z-20 px-3.5 py-2.5 rounded-full bg-emerald-400 text-[#04241e] font-semibold text-[13px] shadow-[0_8px_24px_rgba(0,0,0,.4)] flex items-center gap-1.5"
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
                src={`/api/operator-logo?slug=${encodeURIComponent(operatorSlug)}`}
                alt={operator.name}
                className="max-h-9 max-w-[180px] object-contain"
              />
            </div>
          ) : null}
          <div className="text-[11px] font-mono text-emerald-300/70 mb-2">{tr.course_label}</div>
          <div className="text-[15px] font-semibold mb-1 text-white">{courseTitleLocal}</div>
          <div className="text-[13px] text-[#a7d4b6] mb-4">{operator.name}</div>

          <div className="h-1.5 bg-black/30 rounded-full overflow-hidden mb-2">
            <div
              className="h-full transition-all"
              style={{
                width: `${progressPct}%`,
                background: "var(--op-accent)",
              }}
            />
          </div>
          <div className="flex items-center justify-between text-[13px] text-[#a7d4b6] mb-5">
            <span>
              {completedCount} / {modules.length}
            </span>
            <span className="font-medium" style={{ color: "var(--op-accent)" }}>
              {progressPct}%
            </span>
          </div>

          <div className="text-[11px] font-mono text-emerald-300/70 mb-2">{tr.modules_label}</div>
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
          />
        </aside>

        {/* Reader */}
        <ModuleReader
          module={activeLocal}
          blocks={localizedBlocks}
          courseSlug={courseSlug}
          operatorSlug={operatorSlug}
          modules={localizedModules}
          courseId={course.id}
          quizQuestions={quizQuestions}
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
              examples={
                parseAiExamples(course.ai_examples_json).slice(0, 4).length > 0
                  ? parseAiExamples(course.ai_examples_json).slice(0, 4)
                  : [tr.hero_example_1, tr.hero_example_3, tr.hero_example_2]
              }
            />
          </div>
          <FeedbackWidget courseId={course.id} moduleId={active.id} />
        </aside>
      </div>
      </div>
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
              <div className={`text-[14px] ${isActive ? "font-medium text-white" : "text-[#d8f0e1]"}`}>
                {m.title}
              </div>
              <div className="text-[11px] text-[#86b69a]">
                {m.est_minutes ? fmt(minLabel, { n: m.est_minutes }) : ""}
                {labelExtras}
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
      <span className="text-[11px] font-mono text-emerald-300/70 uppercase shrink-0">{label}</span>
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
            className={`px-2.5 py-1 rounded-md text-[12px] font-medium border transition shrink-0 ${
              isOn
                ? "bg-emerald-400 text-[#04241e] border-emerald-400"
                : "border-white/[.10] text-[#d8f0e1] hover:bg-white/[.06]"
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
  const map: Record<string, string> = {
    en: "English",
    "zh-CN": "简体中文",
    "zh-TW": "繁體中文",
    ja: "日本語",
    ko: "한국어",
    es: "Español",
    fr: "Français",
    de: "Deutsch",
    pt: "Português",
  };
  return map[code] ?? code;
}

async function EmptyCourse({ operator, title }: { operator: string; title: string }) {
  const tr = await t();
  return (
    <div className="min-h-screen bg-[#04241e] text-[#f0fdf4] font-sans antialiased flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <div className="text-[11px] font-mono text-emerald-300/70 mb-3 tracking-widest">{tr.lr_draft_label}</div>
        <h1 className="text-[26px] font-semibold text-white">{title}</h1>
        <p className="text-[#a7d4b6] mt-1.5">{operator}</p>
        <p className="mt-6 text-[14px] text-[#a7d4b6] leading-relaxed">
          {tr.lr_draft_blurb}
        </p>
        <Link
          href="/learn"
          className="mt-7 inline-block px-4 py-2 rounded-md border border-white/[.10] text-[14px] text-[#d8f0e1] hover:bg-white/[.06]"
        >
          {tr.lr_back_to_courses_arrow}
        </Link>
      </div>
    </div>
  );
}
