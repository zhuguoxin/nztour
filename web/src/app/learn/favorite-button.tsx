"use client";

import { useState, useTransition } from "react";
import { toggleFavoriteAction } from "./actions";
import { useTr } from "@/lib/i18n-provider";

/**
 * Heart toggle. Optimistic — flips immediately, reverts if the server call
 * fails. Sits inside <Link> wrappers via `onClick → e.preventDefault();`.
 * Compact mode is for the card overlay (semi-transparent backdrop chip);
 * normal mode for inline use in headers.
 */
export function FavoriteButton({
  courseId,
  initial,
  compact = false,
  label,
}: {
  courseId: string;
  initial: boolean;
  compact?: boolean;
  label?: string;
}) {
  const tr = useTr();
  const [on, setOn] = useState(initial);
  const [pending, startTransition] = useTransition();

  function toggle(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    const next = !on;
    setOn(next);
    startTransition(async () => {
      try {
        await toggleFavoriteAction({ courseId, favorite: next });
      } catch {
        setOn(!next);
      }
    });
  }

  const cls = compact
    ? `inline-flex items-center justify-center w-7 h-7 rounded-full backdrop-blur-sm border border-white/15 ${
        on ? "bg-rose-500/90 text-white" : "bg-black/35 text-white/85 hover:bg-black/50"
      } ${pending ? "opacity-60" : ""}`
    : `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[12px] ${
        on
          ? "border-rose-300 bg-rose-50 text-rose-700"
          : "border-slate-300 text-slate-600 hover:bg-slate-50"
      } ${pending ? "opacity-60" : ""}`;

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={on}
      aria-label={on ? tr.lr_fav_remove : tr.lr_fav_add}
      className={cls}
      title={on ? tr.lr_fav_saved : tr.lr_fav_save}
    >
      <svg
        width={compact ? 14 : 13}
        height={compact ? 14 : 13}
        viewBox="0 0 24 24"
        fill={on ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      {!compact && label ? <span>{label}</span> : null}
    </button>
  );
}
