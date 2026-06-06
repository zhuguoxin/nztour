"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { categorizeQuestionsAction } from "./actions";

/**
 * One-click theme refresh. Runs Claude over uncategorized questions in
 * the current window; on completion, summarizes how many were processed
 * + how many new themes were created.
 */
export function CategorizeButton({
  operatorSlug,
  from,
  to,
  disabled,
}: {
  operatorSlug: string;
  from: number;
  to: number;
  disabled: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function run() {
    setMsg(null);
    startTransition(async () => {
      try {
        const r = await categorizeQuestionsAction({ operatorSlug, from, to });
        const parts = [
          `Categorized ${r.processed}`,
          r.new_themes > 0 ? `${r.new_themes} new theme${r.new_themes === 1 ? "" : "s"}` : null,
          r.remaining > 0 ? `${r.remaining} remaining` : null,
        ].filter(Boolean);
        setMsg(parts.join(" · "));
        router.refresh();
      } catch (err) {
        setMsg(err instanceof Error ? err.message.slice(0, 200) : "Failed");
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      {msg ? (
        <span className="text-[11px] text-emerald-300 font-mono max-w-[300px] truncate" title={msg}>
          {msg}
        </span>
      ) : null}
      <button
        type="button"
        onClick={run}
        disabled={pending || disabled}
        className="px-2.5 py-1 rounded bg-amber-400 text-[#04241e] font-semibold text-[12px] hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed"
        title={disabled ? "Nothing left to categorize" : "Run Claude on uncategorized questions"}
      >
        {pending ? "Categorizing…" : "✨ Refresh themes"}
      </button>
    </div>
  );
}
