"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ModuleRow, BlockRow } from "@/lib/db";

const DWELL_REQUIRED_SECONDS = 30;

interface Props {
  module: ModuleRow;
  blocks: BlockRow[];
  modules: ModuleRow[];
  operatorSlug: string;
  courseSlug: string;
  isCompleted: boolean;
  onComplete: (dwellSeconds: number) => Promise<{ verifyCode?: string }>;
}

export function ModuleReader({
  module,
  blocks,
  modules,
  operatorSlug,
  courseSlug,
  isCompleted,
  onComplete,
}: Props) {
  const router = useRouter();
  const [dwell, setDwell] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [awardedCode, setAwardedCode] = useState<string | null>(null);
  const startRef = useRef<number>(Date.now());

  useEffect(() => {
    setDwell(0);
    setAwardedCode(null);
    startRef.current = Date.now();
    const i = setInterval(() => {
      if (document.visibilityState === "visible") {
        setDwell((d) => Math.min(d + 1, 3600));
      }
    }, 1000);
    return () => clearInterval(i);
  }, [module.id]);

  const remaining = Math.max(0, DWELL_REQUIRED_SECONDS - dwell);
  const canComplete = isCompleted || remaining === 0;

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
      <div className="flex items-center gap-2 text-[13px] text-[#a7d4b6] mb-2 flex-wrap">
        <span>Module {module.position}</span>
        <span className="text-white/20">·</span>
        <span>{module.title}</span>
        {isCompleted ? (
          <span className="ml-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-lime-400/30 bg-lime-400/10 text-lime-300 text-[11px] font-medium">
            ✓ Completed
          </span>
        ) : null}
      </div>
      <h2 className="text-[26px] sm:text-[30px] font-semibold tracking-tight text-white mb-2">
        {module.title}
      </h2>
      {module.summary ? (
        <p className="text-[15px] text-[#a7d4b6] mb-6 leading-relaxed">{module.summary}</p>
      ) : null}

      <article className="space-y-4">
        {blocks.length === 0 ? (
          <div className="rounded-xl border border-white/[.08] bg-[#0a3a2f] p-6 text-[#a7d4b6] text-sm">
            No content blocks yet for this module.
          </div>
        ) : (
          blocks.map((b) => <BlockView key={b.id} block={b} />)
        )}
      </article>

      {awardedCode ? (
        <div className="mt-8 rounded-2xl border border-lime-400/30 bg-lime-400/10 p-5 flex items-center gap-4">
          <div className="text-[42px]">🏅</div>
          <div className="flex-1">
            <div className="font-semibold text-white text-[17px]">Badge earned!</div>
            <div className="text-[14px] text-lime-300">
              Verify code{" "}
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
            Back to courses
          </Link>
        </div>
      ) : null}

      <div className="mt-10 flex items-center justify-between gap-3 flex-wrap">
        <button
          disabled={!prev}
          onClick={() => prev && router.push(`/learn/${operatorSlug}/${courseSlug}?m=${prev.slug}`)}
          className="px-3.5 py-2 rounded-md border border-white/[.10] text-[13px] text-[#d8f0e1] hover:bg-white/[.06] disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ← {prev ? prev.title : "Start"}
        </button>

        <div className="text-[12px] text-[#86b69a] text-center order-3 sm:order-2 w-full sm:w-auto">
          {isCompleted ? (
            <span className="text-lime-300">Already completed — feel free to review</span>
          ) : remaining > 0 ? (
            <>
              Stay on this page <span className="font-mono text-emerald-300">{remaining}s</span> to
              mark complete
            </>
          ) : (
            <span className="text-lime-300">Ready to mark complete</span>
          )}
        </div>

        <button
          onClick={complete}
          disabled={!canComplete || isPending}
          className="px-4 py-2 rounded-md text-[13px] font-semibold bg-emerald-400 text-[#04241e] hover:bg-emerald-300 disabled:opacity-40 disabled:cursor-not-allowed order-2 sm:order-3"
        >
          {isPending
            ? "Saving…"
            : isCompleted
              ? next
                ? `Continue to ${next.title} →`
                : "Done"
              : `Mark complete${next ? " & continue" : ""} →`}
        </button>
      </div>
    </main>
  );
}

function BlockView({ block }: { block: BlockRow }) {
  switch (block.kind) {
    case "text":
      return (
        <div
          className="max-w-none text-[15px] text-[#d8f0e1] leading-relaxed [&>p]:my-3 [&_strong]:text-white [&_strong]:font-semibold"
          dangerouslySetInnerHTML={{ __html: mdToHtml(block.text_md ?? "") }}
        />
      );
    case "callout":
      return (
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[.06] p-4">
          <div
            className="text-[14.5px] text-white leading-relaxed [&>p]:my-2 [&_strong]:text-white"
            dangerouslySetInnerHTML={{ __html: mdToHtml(block.text_md ?? "") }}
          />
        </div>
      );
    case "video":
      return (
        <div className="rounded-2xl overflow-hidden aspect-video bg-gradient-to-br from-emerald-900 via-[#0a3a2f] to-[#04241e] flex items-center justify-center relative border border-white/[.06]">
          <div className="absolute top-3.5 left-3.5 text-[11px] px-2.5 py-1 rounded-full bg-black/40 backdrop-blur text-white/85 border border-white/15">
            📹 {block.caption ?? "Video"}
          </div>
          <div className="text-center text-white/75">
            <div className="text-[48px] mb-2 leading-none">▶</div>
            <div className="text-[12px] font-mono text-emerald-300/80">
              video_uid: {block.video_uid ?? "<not yet uploaded>"}
            </div>
            <div className="text-[11px] text-white/40 mt-1">
              Cloudflare Stream embed wires up in D5
            </div>
          </div>
        </div>
      );
    case "image":
      return (
        <div className="rounded-xl border border-white/[.08] bg-[#0a3a2f] p-6 text-center text-[#a7d4b6] text-sm">
          🖼️ {block.caption ?? "Image"}
          <div className="text-[11px] text-[#5d9279] mt-1 font-mono">
            r2_key: {block.image_r2_key ?? "<not uploaded>"}
          </div>
        </div>
      );
    case "pdf":
      return (
        <div className="rounded-xl border border-white/[.08] bg-[#0a3a2f] p-4 text-sm text-[#a7d4b6] flex items-center gap-3">
          <span className="text-[24px]">📄</span>
          <span>{block.caption ?? "Attached PDF"}</span>
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
