"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { setLocale } from "./locale-actions";
import { SUPPORTED, LANG_LABELS, type Locale } from "@/lib/i18n-shared";

interface Props {
  current: Locale;
  compact?: boolean;
  label?: string;
}

export function LocaleSwitcher({ current, compact = false, label }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement | null>(null);

  // Close on outside click / Escape
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

  const shortLabel = current === "en" ? "EN" : current === "zh-CN" ? "中" : current;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        className={`rounded-md text-[#c4e9d3] hover:bg-white/[.06] inline-flex items-center disabled:opacity-50 ${
          compact ? "px-1.5 py-1.5 text-[12px] gap-1" : "px-3 py-2 text-[13px] gap-1.5"
        }`}
        aria-label={label ?? "Change language"}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <svg width={compact ? 12 : 14} height={compact ? 12 : 14} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
          <path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" stroke="currentColor" strokeWidth="2" />
        </svg>
        {shortLabel}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" />
        </svg>
      </button>

      {open ? (
        <div
          role="listbox"
          className="absolute right-0 top-full mt-1 z-30 min-w-[160px] rounded-md bg-[#062b22] border border-white/[.10] shadow-[0_8px_28px_rgba(0,0,0,.4)] overflow-hidden"
        >
          {SUPPORTED.map((code) => (
            <button
              key={code}
              role="option"
              aria-selected={code === current}
              onClick={() => {
                setOpen(false);
                if (code === current) return;
                startTransition(() => setLocale(code));
              }}
              className={`w-full text-left px-3 py-2 text-[13px] flex items-center justify-between hover:bg-white/[.05] ${
                code === current ? "text-emerald-300" : "text-[#d8f0e1]"
              }`}
            >
              <span>{LANG_LABELS[code]}</span>
              <span className="text-[11px] text-[#86b69a] font-mono">{code}</span>
            </button>
          ))}
          <div className="px-3 py-1.5 text-[10px] text-[#5d9279] border-t border-white/[.06] font-mono">
            More languages coming soon
          </div>
        </div>
      ) : null}
    </div>
  );
}
