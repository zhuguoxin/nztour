"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ModuleRow, BlockRow } from "@/lib/db";
import { QuizPanel, type QuizQuestion } from "./quiz-panel";
import { useTr } from "@/lib/i18n-provider";

const DWELL_REQUIRED_SECONDS = 30;

export interface ModuleReaderStrings {
  module_position: string;
  completed_chip: string;
  no_blocks: string;
  badge_earned: string;
  verify_code_prefix: string;
  back_to_courses: string;
  start_module: string;
  stay_to_complete_a: string;
  stay_to_complete_b: string;
  already_completed: string;
  ready_to_complete: string;
  saving: string;
  done: string;
  mark_complete: string;
  mark_complete_and_continue: string;
  continue_to: string; // contains {title}
  video_caption_default?: string;
  video_not_uploaded?: string;
  video_setup_hint?: string;
}

interface Props {
  module: ModuleRow;
  blocks: BlockRow[];
  modules: ModuleRow[];
  operatorSlug: string;
  courseSlug: string;
  courseId: string;
  isCompleted: boolean;
  onComplete: (dwellSeconds: number) => Promise<{ verifyCode?: string }>;
  tr: ModuleReaderStrings;
  /** Pre-shuffled questions for this attempt. Empty = no quiz configured;
   *  the legacy 30-second-dwell + button flow is used in that case. */
  quizQuestions: QuizQuestion[];
  /** Module-level narration audio URL for the chosen language, or null. */
  narrationSrc: string | null;
}

export function ModuleReader({
  module,
  blocks,
  modules,
  operatorSlug,
  courseSlug,
  courseId,
  isCompleted,
  onComplete,
  tr,
  quizQuestions,
  narrationSrc,
}: Props) {
  const router = useRouter();
  const dict = useTr();
  const [dwell, setDwell] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [awardedCode, setAwardedCode] = useState<string | null>(null);
  const [narrationHidden, setNarrationHidden] = useState(false);
  const startRef = useRef<number>(Date.now());

  useEffect(() => {
    setDwell(0);
    setAwardedCode(null);
    setNarrationHidden(false);
    startRef.current = Date.now();
    const i = setInterval(() => {
      if (document.visibilityState === "visible") {
        setDwell((d) => Math.min(d + 1, 3600));
      }
    }, 1000);
    return () => clearInterval(i);
  }, [module.id]);

  const hasQuiz = quizQuestions.length > 0;
  const remaining = Math.max(0, DWELL_REQUIRED_SECONDS - dwell);
  // When a quiz is configured, the quiz IS the completion gate — the
  // legacy 30s-dwell + click flow is suppressed.
  const canComplete = isCompleted || (!hasQuiz && remaining === 0);

  const idx = modules.findIndex((m) => m.id === module.id);
  const prev = idx > 0 ? modules[idx - 1] : null;
  const next = idx < modules.length - 1 ? modules[idx + 1] : null;

  function complete() {
    startTransition(async () => {
      const result = await onComplete(dwell);
      if (result.verifyCode) {
        setAwardedCode(result.verifyCode);
      } else if (next) {
        router.push(`/learn/${operatorSlug}/${courseSlug}?m=${next.slug}`);
      } else {
        router.refresh();
      }
    });
  }

  // Chapters aren't gated. When a quiz is present it's the badge gate, not a
  // navigation gate — so the footer button just moves on; passing the quiz is
  // encouraged (and required for the badge) but never blocks progress.
  function advance() {
    if (hasQuiz && !isCompleted) {
      if (next) router.push(`/learn/${operatorSlug}/${courseSlug}?m=${next.slug}`);
      else router.refresh();
      return;
    }
    complete();
  }

  return (
    <main className="p-5 sm:p-8 max-w-4xl">
      <div className="flex items-center gap-2 text-[13px] text-[#a7d4b6] mb-2 flex-wrap">
        <span>{tr.module_position.replace("{n}", String(module.position))}</span>
        <span className="text-white/20">·</span>
        <span>{module.title}</span>
        {isCompleted ? (
          <span className="ml-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-lime-400/30 bg-lime-400/10 text-lime-300 text-[11px] font-medium">
            {tr.completed_chip}
          </span>
        ) : null}
      </div>
      <h2 className="text-[26px] sm:text-[30px] font-semibold tracking-tight text-white mb-2">
        {module.title}
      </h2>
      {module.summary ? (
        <p className="text-[15px] text-[#a7d4b6] mb-6 leading-relaxed">{module.summary}</p>
      ) : null}

      {narrationSrc && !narrationHidden ? (
        <div className="mb-6 flex items-center gap-2 rounded-lg bg-emerald-400/[.06] border border-emerald-400/20 p-2.5">
          <span className="text-[11px] text-emerald-300/80 font-mono uppercase tracking-widest shrink-0">
            🎧 {dict.lr_voiceover}
          </span>
          <audio controls preload="none" src={narrationSrc} className="flex-1 h-9" />
          <button
            type="button"
            onClick={() => setNarrationHidden(true)}
            aria-label={dict.mp_close}
            title={dict.mp_close}
            className="w-7 h-7 shrink-0 rounded-md text-[#a7d4b6] hover:bg-white/[.08] flex items-center justify-center text-[13px]"
          >
            ✕
          </button>
        </div>
      ) : null}

      <article className="space-y-4">
        {blocks.length === 0 ? (
          <div className="rounded-xl border border-white/[.08] bg-[#0a3a2f] p-6 text-[#a7d4b6] text-sm">
            {tr.no_blocks}
          </div>
        ) : (
          blocks.map((b) => (
            <BlockView
              key={b.id}
              block={b}
              videoFallback={{
                caption_default: tr.video_caption_default ?? "Video",
                not_uploaded: tr.video_not_uploaded ?? "video not yet uploaded",
                setup_hint: tr.video_setup_hint ?? "Set NEXT_PUBLIC_STREAM_CUSTOMER_SUBDOMAIN and a real Stream UID to embed",
              }}
            />
          ))
        )}
      </article>

      {awardedCode ? (
        <div className="mt-8 rounded-2xl border border-lime-400/30 bg-lime-400/10 p-5 flex items-center gap-4">
          <div className="text-[42px]">🏅</div>
          <div className="flex-1">
            <div className="font-semibold text-white text-[17px]">{tr.badge_earned}</div>
            <div className="text-[14px] text-lime-300">
              {tr.verify_code_prefix}{" "}
              <Link
                href={`/verify/${awardedCode}`}
                className="font-mono underline hover:text-white"
              >
                {awardedCode}
              </Link>
            </div>
          </div>
          <Link
            href="/learn"
            className="px-4 py-2 rounded-md bg-lime-300 text-[#04241e] font-semibold text-sm"
          >
            {tr.back_to_courses}
          </Link>
        </div>
      ) : null}

      {/* End-of-chapter quiz (if authored). Passing marks the module
          complete server-side and refreshes; the nav button below stays
          disabled with a "Pass the quiz to continue" hint while the quiz
          is outstanding. */}
      <div className="mt-8">
        <QuizPanel
          moduleId={module.id}
          courseId={courseId}
          questions={quizQuestions}
          isCompleted={isCompleted}
        />
      </div>

      <div className="mt-6 flex items-center justify-between gap-3 flex-wrap">
        <button
          disabled={!prev}
          onClick={() => prev && router.push(`/learn/${operatorSlug}/${courseSlug}?m=${prev.slug}`)}
          className="px-3.5 py-2 rounded-md border border-white/[.10] text-[13px] text-[#d8f0e1] hover:bg-white/[.06] disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ← {prev ? prev.title : tr.start_module}
        </button>

        <div className="text-[12px] text-[#86b69a] text-center order-3 sm:order-2 w-full sm:w-auto">
          {isCompleted ? (
            <span className="text-lime-300">{tr.already_completed}</span>
          ) : hasQuiz ? (
            <span className="text-amber-300">{dict.lr_pass_quiz_to_continue}</span>
          ) : remaining > 0 ? (
            <>
              {tr.stay_to_complete_a}{" "}
              <span className="font-mono text-emerald-300">{remaining}s</span>{" "}
              {tr.stay_to_complete_b}
            </>
          ) : (
            <span className="text-lime-300">{tr.ready_to_complete}</span>
          )}
        </div>

        <button
          onClick={advance}
          disabled={isPending || (!hasQuiz && !canComplete)}
          className="px-4 py-2 rounded-md text-[13px] font-semibold bg-emerald-400 text-[#04241e] hover:bg-emerald-300 disabled:opacity-40 disabled:cursor-not-allowed order-2 sm:order-3"
        >
          {isPending
            ? tr.saving
            : isCompleted || hasQuiz
              ? next
                ? tr.continue_to.replace("{title}", next.title)
                : tr.done
              : next
                ? tr.mark_complete_and_continue
                : tr.mark_complete}
        </button>
      </div>
    </main>
  );
}

function BlockView({
  block,
  videoFallback,
}: {
  block: BlockRow;
  videoFallback?: { caption_default: string; not_uploaded: string; setup_hint: string };
}) {
  const dict = useTr();
  switch (block.kind) {
    case "text":
      return (
        <div>
          <div
            className="max-w-none text-[15px] text-[#d8f0e1] leading-relaxed [&>p]:my-3 [&_strong]:text-white [&_strong]:font-semibold"
            dangerouslySetInnerHTML={{ __html: mdToHtml(block.text_md ?? "") }}
          />
          <AudioPlayer block={block} />
        </div>
      );
    case "callout":
      return (
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[.06] p-4">
          <div
            className="text-[14.5px] text-white leading-relaxed [&>p]:my-2 [&_strong]:text-white"
            dangerouslySetInnerHTML={{ __html: mdToHtml(block.text_md ?? "") }}
          />
          <AudioPlayer block={block} compact />
        </div>
      );
    case "video":
      return <VideoBlock block={block} fallback={videoFallback} />;
    case "image":
      return block.image_r2_key ? (
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/image?id=${block.id}`}
            alt={block.caption ?? ""}
            loading="lazy"
            className="w-full rounded-xl border border-white/[.08] object-contain"
          />
          {block.caption ? (
            <figcaption className="text-[12.5px] text-[#a7d4b6] mt-2 text-center">{block.caption}</figcaption>
          ) : null}
        </figure>
      ) : (
        <div className="rounded-xl border border-white/[.08] bg-[#0a3a2f] p-6 text-center text-[#a7d4b6] text-sm">
          🖼️ {block.caption ?? dict.lr_block_image}
        </div>
      );
    case "pdf":
      return (
        <div className="rounded-xl border border-white/[.08] bg-[#0a3a2f] p-4 text-sm text-[#a7d4b6] flex items-center gap-3">
          <span className="text-[24px]">📄</span>
          <span>{block.caption ?? dict.lr_block_pdf}</span>
        </div>
      );
    default:
      return null;
  }
}

/**
 * Minimal markdown -> HTML (bold/italic/paragraphs). Inlined to avoid pulling
 * a markdown lib into the client bundle for now. Full renderer lands in D11.
 */
function mdToHtml(md: string): string {
  const escaped = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const withInline = escaped
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<em>$1</em>");
  return withInline
    .split(/\n{2,}/)
    .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

/**
 * Renders the video for a content block.
 *
 * Resolution order for `video_uid`:
 *   1. starts with "yt:<id>"  → YouTube embed (no Stream required; demo-friendly)
 *   2. 32-char hex            → Cloudflare Stream iframe at
 *      https://customer-<SUBDOMAIN>.cloudflarestream.com/<uid>/iframe
 *      (requires NEXT_PUBLIC_STREAM_CUSTOMER_SUBDOMAIN to be set)
 *   3. anything else / null   → styled placeholder
 *
 * The Stream subdomain is exposed as NEXT_PUBLIC_* so this component (which
 * stays "use client" alongside the rest of the reader) can read it from
 * build-time inlined env without an extra server prop.
 */
function VideoBlock({
  block,
  fallback = {
    caption_default: "Video",
    not_uploaded: "video not yet uploaded",
    setup_hint:
      "Set NEXT_PUBLIC_STREAM_CUSTOMER_SUBDOMAIN and a real Stream UID to embed",
  },
}: {
  block: BlockRow;
  fallback?: { caption_default: string; not_uploaded: string; setup_hint: string };
}) {
  const uid = block.video_uid?.trim() ?? "";
  const caption = block.caption ?? fallback.caption_default;

  // YouTube fallback — accept "yt:<id>" so we can demo without Stream account.
  if (uid.startsWith("yt:")) {
    const ytId = uid.slice(3);
    return (
      <figure>
        <div className="rounded-2xl overflow-hidden aspect-video bg-black border border-white/[.06] relative">
          <div className="absolute top-3.5 left-3.5 z-10 text-[11px] px-2.5 py-1 rounded-full bg-black/60 backdrop-blur text-white/85 border border-white/15">
            📹 {caption}
          </div>
          <iframe
            src={`https://www.youtube.com/embed/${encodeURIComponent(ytId)}?rel=0&modestbranding=1`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
            title={caption}
          />
        </div>
      </figure>
    );
  }

  // Real Cloudflare Stream UID (32 hex chars).
  const subdomain = process.env.NEXT_PUBLIC_STREAM_CUSTOMER_SUBDOMAIN;
  const isStreamUid = /^[a-f0-9]{32}$/i.test(uid);
  if (isStreamUid && subdomain && subdomain !== "REPLACE_WITH_CF_STREAM_SUBDOMAIN") {
    const src = `https://customer-${subdomain}.cloudflarestream.com/${uid}/iframe`;
    return (
      <figure>
        <div className="rounded-2xl overflow-hidden aspect-video bg-black border border-white/[.06] relative">
          <div className="absolute top-3.5 left-3.5 z-10 text-[11px] px-2.5 py-1 rounded-full bg-black/60 backdrop-blur text-white/85 border border-white/15">
            📹 {caption}
          </div>
          <iframe
            src={src}
            className="w-full h-full"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
            allowFullScreen
            loading="lazy"
            title={caption}
          />
        </div>
      </figure>
    );
  }

  // Placeholder
  return (
    <div className="rounded-2xl overflow-hidden aspect-video bg-gradient-to-br from-emerald-900 via-[#0a3a2f] to-[#04241e] flex items-center justify-center relative border border-white/[.06]">
      <div className="absolute top-3.5 left-3.5 text-[11px] px-2.5 py-1 rounded-full bg-black/40 backdrop-blur text-white/85 border border-white/15">
        📹 {caption}
      </div>
      <div className="text-center text-white/75">
        <div className="text-[48px] mb-2 leading-none">▶</div>
        <div className="text-[12px] font-mono text-emerald-300/80">
          {uid ? `video_uid: ${uid}` : fallback.not_uploaded}
        </div>
        <div className="text-[11px] text-white/40 mt-1">{fallback.setup_hint}</div>
      </div>
    </div>
  );
}

/**
 * Voice-over player attached to text/callout blocks. Hidden when the block has
 * no audio_r2_key. `compact` shrinks padding so it fits nicely inside callouts.
 */
function AudioPlayer({ block, compact = false }: { block: BlockRow; compact?: boolean }) {
  const dict = useTr();
  const [hidden, setHidden] = useState(false);
  if (!block.audio_r2_key || hidden) return null;
  // When viewing a non-primary language, the page sets _audio_lang_query so we
  // request the localised audio (/api/audio?lang=…) instead of the primary
  // column. Without it the player would serve the wrong language (or 404 when
  // the primary audio doesn't exist but a translated one does).
  const langQ = (block as BlockRow & { _audio_lang_query?: string })._audio_lang_query;
  const src = `/api/audio?id=${block.id}${
    langQ ? `&lang=${encodeURIComponent(langQ)}` : ""
  }&t=${block.audio_generated_at ?? 0}`;
  return (
    <div
      className={`mt-3 flex items-center gap-2 ${
        compact ? "" : "rounded-lg bg-white/[.03] border border-white/[.06] p-2"
      }`}
    >
      <span className="text-[11px] text-emerald-300/80 font-mono uppercase tracking-widest shrink-0">
        🎙 {dict.lr_voiceover}
      </span>
      <audio controls preload="none" src={src} className="flex-1 h-8" />
      <button
        type="button"
        onClick={() => setHidden(true)}
        aria-label={dict.mp_close}
        title={dict.mp_close}
        className="w-6 h-6 shrink-0 rounded text-[#a7d4b6] hover:bg-white/[.08] flex items-center justify-center text-[12px]"
      >
        ✕
      </button>
    </div>
  );
}
