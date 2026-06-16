"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export interface SwitcherOperator {
  slug: string;
  name: string;
  role: string; // 'admin' | 'editor' | 'platform-admin'
}

/**
 * Dropdown to switch between operators in the dashboard header.
 *
 * Shown only when the user can manage 2+ operators. With 1, nothing to switch
 * to — the page just shows the operator name without a dropdown affordance.
 */
export interface SwitcherLabels {
  switch: string;
  panel_title: string; // contains {n}
  view_all: string;
}

export function OperatorSwitcher({
  currentSlug,
  currentName,
  operators,
  labels,
}: {
  currentSlug: string;
  currentName: string;
  operators: SwitcherOperator[];
  labels: SwitcherLabels;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (open && ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (operators.length < 2) {
    return null;
  }

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="ml-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-300 hover:bg-slate-50 text-[13px] text-slate-700"
        aria-haspopup="listbox"
        aria-expanded={open}
        title={labels.switch}
      >
        {labels.switch}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" />
        </svg>
      </button>
      {open ? (
        <div
          role="listbox"
          className="absolute left-0 top-full mt-1 z-30 min-w-[240px] rounded-lg bg-[#062b22] border border-slate-300 shadow-[0_8px_28px_rgba(0,0,0,.4)] overflow-hidden"
        >
          <div className="px-3 py-2 text-[10px] tracking-widest font-mono text-slate-400 border-b border-slate-200">
            {labels.panel_title.replace("{n}", String(operators.length))}
          </div>
          <div className="max-h-[70vh] overflow-y-auto">
            {operators.map((o) => {
              const isCurrent = o.slug === currentSlug;
              return (
                <Link
                  key={o.slug}
                  href={`/product/${o.slug}`}
                  className={`flex items-center justify-between px-3 py-2.5 text-[13.5px] border-b border-slate-100 last:border-b-0 ${
                    isCurrent
                      ? "bg-emerald-600/[.06] text-slate-900"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                  onClick={() => setOpen(false)}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="truncate">{o.name}</span>
                    {isCurrent ? (
                      <span className="text-emerald-700 text-[11px]">●</span>
                    ) : null}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono uppercase shrink-0 ml-2">
                    {o.role}
                  </span>
                </Link>
              );
            })}
          </div>
          <Link
            href="/product"
            className="block px-3 py-2.5 text-[12px] text-emerald-700 hover:bg-slate-100 border-t border-slate-200"
            onClick={() => setOpen(false)}
          >
            {labels.view_all}
          </Link>
        </div>
      ) : null}
      <span className="sr-only">currently viewing: {currentName}</span>
    </div>
  );
}
