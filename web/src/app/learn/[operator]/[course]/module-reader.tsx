"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import { mediaUrl } from "@/lib/media";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ModuleRow, BlockRow } from "@/lib/db";
import { useTr } from "@/lib/i18n-provider";

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
  isCompleted: boolean;
  onComplete: (dwellSeconds: number) => Promise<{ verifyCode?: string }>;
  tr: ModuleReaderStrings;
  /** Module-level narration audio URL for the chosen language, or null. */
  narrationSrc: string | null;
}

export function ModuleReader({
  module,
  blocks,
  modules,
  operatorSlug,
  courseSlug,
  isCompleted,
  onComplete,
  tr,
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

  // No dwell gate: a chapter can be completed / continued immediately. We still
  // track dwell seconds and pass them to onComplete for analytics, but they no
  // longer block the button. Assessment lives in the course-level final exam.
  const canComplete = true;

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

  return (
    <main className="p-5 sm:p-8 max-w-4xl">
      <div className="flex items-center gap-2 text-small text-[#a7d4b6] mb-2 flex-wrap">
        <span>{tr.module_position.replace("{n}", String(module.position))}</span>
        <span className="text-white/20">·</span>
        <span>{module.title}</span>
        {isCompleted ? (
          <span className="ml-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-lime-400/30 bg-lime-400/10 text-lime-300 text-micro font-medium">
            {tr.completed_chip}
          </span>
        ) : null}
      </div>
      <h2 className="text-h2 sm:text-h1 font-semibold tracking-tight text-white mb-2">
        {module.title}
      </h2>

      {narrationSrc && !narrationHidden ? (
        <div className="mb-6 flex items-center gap-2 rounded-lg bg-emerald-400/[.06] border border-emerald-400/20 p-2.5">
          <span className="text-micro text-white font-mono uppercase tracking-widest shrink-0">
            🎧 {dict.lr_voiceover}
          </span>
          <audio controls preload="none" src={narrationSrc} className="flex-1 h-9" />
          <button
            type="button"
            onClick={() => setNarrationHidden(true)}
            aria-label={dict.mp_close}
            title={dict.mp_close}
            className="w-7 h-7 shrink-0 rounded-md text-[#a7d4b6] hover:bg-white/[.08] flex items-center justify-center text-small"
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
                not_uploaded: tr.video_not_uploaded ?? "No video yet",
              }}
            />
          ))
        )}
      </article>

      {awardedCode ? (
        <div className="mt-8 rounded-2xl border border-lime-400/30 bg-lime-400/10 p-5 flex items-center gap-4">
          <div className="text-display">🏅</div>
          <div className="flex-1">
            <div className="font-semibold text-white text-title">{tr.badge_earned}</div>
            <div className="text-small text-lime-300">
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
            className="px-4 py-2 rounded-md bg-[#0e3b2c] text-[#ffffff] font-semibold text-sm"
          >
            {tr.back_to_courses}
          </Link>
        </div>
      ) : null}

      <div className="mt-6 flex items-center justify-between gap-3 flex-wrap">
        <button
          disabled={!prev}
          onClick={() => prev && router.push(`/learn/${operatorSlug}/${courseSlug}?m=${prev.slug}`)}
          className="px-3.5 py-2 rounded-md border border-white/[.10] text-small text-[#d8f0e1] hover:bg-white/[.06] disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ← {prev ? prev.title : tr.start_module}
        </button>

        <div className="text-caption text-[#86b69a] text-center order-3 sm:order-2 w-full sm:w-auto">
          {isCompleted ? <span>{tr.already_completed}</span> : null}
        </div>

        <button
          onClick={complete}
          disabled={isPending || !canComplete}
          className="px-4 py-2 rounded-md text-small font-semibold bg-[#0e3b2c] text-[#ffffff] hover:bg-[#0a2c20] disabled:opacity-40 disabled:cursor-not-allowed order-2 sm:order-3"
        >
          {isPending
            ? tr.saving
            : isCompleted
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
  videoFallback?: { caption_default: string; not_uploaded: string };
}) {
  const dict = useTr();
  switch (block.kind) {
    case "text":
      return (
        <div>
          <div
            className="max-w-none text-body text-[#d8f0e1] leading-relaxed [&>p]:my-3 [&_strong]:text-white [&_strong]:font-semibold"
            dangerouslySetInnerHTML={{ __html: mdToHtml(block.text_md ?? "") }}
          />
        </div>
      );
    case "callout":
      return (
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[.06] p-4">
          <div
            className="text-small text-white leading-relaxed [&>p]:my-2 [&_strong]:text-white"
            dangerouslySetInnerHTML={{ __html: mdToHtml(block.text_md ?? "") }}
          />
        </div>
      );
    case "video":
      return <VideoBlock block={block} fallback={videoFallback} />;
    case "image": {
      // Slides = the primary image (if any) + any extra images_json entries.
      // One slide → plain figure; 2+ → a carousel.
      let extra: string[] = [];
      try {
        const v = JSON.parse(block.images_json ?? "[]");
        if (Array.isArray(v)) extra = v.filter((s): s is string => typeof s === "string");
      } catch {
        /* ignore */
      }
      const slides = [
        ...(block.image_r2_key ? [`/api/image?id=${block.id}`] : []),
        ...extra.map((_, i) => `/api/image?id=${block.id}&n=${i}`),
      ];
      if (slides.length === 0) {
        return (
          <div className="rounded-xl border border-white/[.08] bg-[#0a3a2f] p-6 text-center text-[#a7d4b6] text-sm">
            🖼️ {block.caption ?? dict.lr_block_image}
          </div>
        );
      }
      if (slides.length === 1) {
        return (
          <figure>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slides[0]}
              alt={block.caption ?? ""}
              loading="lazy"
              className="w-full rounded-xl border border-white/[.08] object-contain"
            />
            {block.caption ? (
              <figcaption className="text-caption text-[#a7d4b6] mt-2 text-center">{block.caption}</figcaption>
            ) : null}
          </figure>
        );
      }
      return <ImageCarousel slides={slides} caption={block.caption} />;
    }
    case "pdf":
      return (
        <div className="rounded-xl border border-white/[.08] bg-[#0a3a2f] p-4 text-sm text-[#a7d4b6] flex items-center gap-3">
          <span className="text-h2">📄</span>
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

/** Extract a YouTube video id from a share link (youtu.be/…, watch?v=…,
 *  /shorts/…, /embed/…), a bare 11-char id, or the legacy "yt:<id>" form. */
export function parseYouTubeId(input: string): string | null {
  const v = (input ?? "").trim();
  if (!v) return null;
  if (v.startsWith("yt:")) return v.slice(3).trim() || null;
  if (/^[A-Za-z0-9_-]{11}$/.test(v)) return v;
  try {
    const u = new URL(v.includes("://") ? v : `https://${v}`);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return u.pathname.slice(1).split("/")[0] || null;
    if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
      if (u.pathname === "/watch") return u.searchParams.get("v");
      const m = u.pathname.match(/^\/(?:embed|shorts|v)\/([A-Za-z0-9_-]+)/);
      if (m) return m[1];
    }
  } catch {
    /* not a URL */
  }
  return null;
}

/**
 * Renders a video block. Resolution order:
 *   1. video_r2_key  → uploaded file, streamed from /api/video
 *   2. video_uid     → a YouTube share link, embedded
 *   3. neither       → styled placeholder
 */
function VideoBlock({
  block,
  fallback = { caption_default: "Video", not_uploaded: "No video yet" },
}: {
  block: BlockRow;
  fallback?: { caption_default: string; not_uploaded: string };
}) {
  const caption = block.caption ?? fallback.caption_default;

  // 1. Uploaded file → native player.
  if (block.video_r2_key) {
    return (
      <figure>
        <div className="rounded-2xl overflow-hidden aspect-video bg-black border border-white/[.06] relative">
          <div className="absolute top-3.5 left-3.5 z-10 text-micro px-2.5 py-1 rounded-full bg-black/60 backdrop-blur text-white/85 border border-white/15 pointer-events-none">
            📹 {caption}
          </div>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            src={mediaUrl(block.video_r2_key)}
            controls
            preload="metadata"
            className="w-full h-full"
          />
        </div>
      </figure>
    );
  }

  // 2. YouTube share link.
  const ytId = parseYouTubeId(block.video_uid ?? "");
  if (ytId) {
    return (
      <figure>
        <div className="rounded-2xl overflow-hidden aspect-video bg-black border border-white/[.06] relative">
          <div className="absolute top-3.5 left-3.5 z-10 text-micro px-2.5 py-1 rounded-full bg-black/60 backdrop-blur text-white/85 border border-white/15">
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

  // 3. Placeholder — no setup hints.
  return (
    <div className="rounded-2xl overflow-hidden aspect-video bg-gradient-to-br from-emerald-900 via-[#0a3a2f] to-[#04241e] flex items-center justify-center relative border border-white/[.06]">
      <div className="absolute top-3.5 left-3.5 text-micro px-2.5 py-1 rounded-full bg-black/40 backdrop-blur text-white/85 border border-white/15">
        📹 {caption}
      </div>
      <div className="text-center text-white/75">
        <div className="text-display mb-2 leading-none">▶</div>
        <div className="text-caption text-white/50">{fallback.not_uploaded}</div>
      </div>
    </div>
  );
}


/** Multi-image slider used when an image block carries 2+ images. */
function ImageCarousel({ slides, caption }: { slides: string[]; caption: string | null }) {
  const [i, setI] = useState(0);
  const n = slides.length;
  const go = (d: number) => setI((p) => (p + d + n) % n);
  return (
    <figure>
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={slides[i]}
          alt={caption ?? ""}
          loading="lazy"
          className="w-full rounded-xl border border-white/[.08] object-contain"
        />
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Previous"
          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/45 text-white text-body flex items-center justify-center hover:bg-black/65"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Next"
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/45 text-white text-body flex items-center justify-center hover:bg-black/65"
        >
          ›
        </button>
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          {slides.map((_, k) => (
            <button
              key={k}
              type="button"
              onClick={() => setI(k)}
              aria-label={`Slide ${k + 1}`}
              className={`w-1.5 h-1.5 rounded-full ${k === i ? "bg-white" : "bg-white/40"}`}
            />
          ))}
        </div>
      </div>
      {caption ? (
        <figcaption className="text-caption text-[#a7d4b6] mt-2 text-center">{caption}</figcaption>
      ) : null}
    </figure>
  );
}
