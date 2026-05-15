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

  // Reset timer when module changes (using module.id as key in parent would also work).
  useEffect(() => {
    setDwell(0);
    setAwardedCode(null);
    startRef.current = Date.now();
    const i = setInterval(() => {
      // Only tick when tab is visible — avoids "leave tab open" anti-cheat bypass.
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
    <main className="p-7 max-w-4xl">
      <div className="flex items-center gap-2 text-xs text-[#9aa7b8] mb-2">
        <span>Module {module.position}</span>
        <span>·</span>
        <span>{module.title}</span>
        {isCompleted ? (
          <span className="ml-2 chip-lime">
            <Chip variant="lime">✓ Completed</Chip>
          </span>
        ) : null}
      </div>
      <h2 className="text-2xl font-semibold mb-2">{module.title}</h2>
      {module.summary ? (
        <p className="text-[14px] text-[#9aa7b8] mb-5">{module.summary}</p>
      ) : null}

      <article className="space-y-4">
        {blocks.length === 0 ? (
          <div className="rounded-xl border border-[#1f2a35] bg-[#11181f] p-6 text-[#9aa7b8] text-sm">
            No content blocks yet for this module.
          </div>
        ) : (
          blocks.map((b) => <BlockView key={b.id} block={b} />)
        )}
      </article>

      {/* Awarded toast */}
      {awardedCode ? (
        <div className="mt-8 rounded-xl border border-[#a3e635]/30 bg-[rgba(163,230,53,.08)] p-5 flex items-center gap-4">
          <div className="text-3xl">🏅</div>
          <div className="flex-1">
            <div className="font-semibold">Badge earned!</div>
            <div className="text-[13px] text-[#bef264]">
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
            className="px-4 py-2 rounded-md bg-[#a3e635] text-[#0b1117] font-semibold text-sm"
          >
            Back to courses
          </Link>
        </div>
      ) : null}

      {/* Nav bar */}
      <div className="mt-10 flex items-center justify-between">
        <button
          disabled={!prev}
          onClick={() => prev && router.push(`/learn/${operatorSlug}/${courseSlug}?m=${prev.slug}`)}
          className="px-4 py-2 rounded-md border border-[#243140] text-xs hover:bg-[#161e27] disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ← {prev ? prev.title : "Start"}
        </button>

        <div className="text-[11px] text-[#5b6b7d] text-center">
          {isCompleted ? (
            <span className="text-[#bef264]">Already completed — feel free to review</span>
          ) : remaining > 0 ? (
            <>
              Stay on this page <span className="font-mono text-[#67e8f9]">{remaining}s</span>{" "}
              to mark complete
            </>
          ) : (
            <span className="text-[#bef264]">Ready to mark complete</span>
          )}
        </div>

        <button
          onClick={complete}
          disabled={!canComplete || isPending}
          className="px-4 py-2 rounded-md text-xs font-semibold bg-[#22d3ee] text-[#04141a] hover:bg-[#67e8f9] disabled:opacity-40 disabled:cursor-not-allowed"
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
          className="prose prose-invert max-w-none text-[14.5px] text-[#cbd5e1] leading-relaxed"
          dangerouslySetInnerHTML={{ __html: mdToHtml(block.text_md ?? "") }}
        />
      );
    case "callout":
      return (
        <div className="rounded-lg border border-[#22d3ee]/20 bg-[rgba(34,211,238,.05)] p-4">
          <div
            className="text-[14px] text-[#e6edf3] leading-relaxed"
            dangerouslySetInnerHTML={{ __html: mdToHtml(block.text_md ?? "") }}
          />
        </div>
      );
    case "video":
      return (
        <div className="rounded-xl overflow-hidden aspect-video bg-gradient-to-br from-[#0b3344] via-[#114858] to-[#0c2536] flex items-center justify-center relative">
          <div className="absolute top-3 left-3 text-[11px] px-2 py-1 rounded-full bg-black/40 backdrop-blur">
            📹 {block.caption ?? "Video"}
          </div>
          <div className="text-center text-white/70 text-sm">
            <div className="text-4xl mb-2">▶</div>
            <div className="text-[12px] font-mono">
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
        <div className="rounded-lg overflow-hidden border border-[#1f2a35] bg-[#11181f] p-6 text-center text-[#9aa7b8] text-sm">
          🖼️ {block.caption ?? "Image"}
          <div className="text-[11px] text-[#5b6b7d] mt-1 font-mono">
            r2_key: {block.image_r2_key ?? "<not uploaded>"}
          </div>
        </div>
      );
    case "pdf":
      return (
        <div className="rounded-lg border border-[#1f2a35] bg-[#11181f] p-4 text-sm text-[#9aa7b8] flex items-center gap-3">
          <span className="text-2xl">📄</span>
          <span>{block.caption ?? "Attached PDF"}</span>
        </div>
      );
    default:
      return null;
  }
}

function Chip({ variant, children }: { variant: "lime"; children: React.ReactNode }) {
  const cls =
    variant === "lime"
      ? "bg-[rgba(163,230,53,.12)] text-[#bef264] border-[rgba(163,230,53,.3)]"
      : "";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium ${cls}`}
    >
      {children}
    </span>
  );
}

/**
 * Minimal markdown -> HTML for the demo. Supports bold (**), italic (*), and
 * paragraph breaks (\n\n). Anything else passes through escaped.
 *
 * We deliberately stay tiny to avoid pulling a markdown lib into the client
 * bundle. A proper renderer (marked / remark) lands in D11 alongside i18n.
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
