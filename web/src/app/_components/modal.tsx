"use client";

import { useEffect } from "react";

/**
 * Lightweight overlay modal. Backdrop click + Esc close; body scroll locked
 * while open. Used to bring shared management UIs (voices, …) in-place so the
 * experience is identical regardless of where they were opened from.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = "max-w-3xl",
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-start sm:items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className={`w-full ${maxWidth} my-auto rounded-2xl bg-white text-slate-900 shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {title !== undefined ? (
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 sticky top-0 bg-white rounded-t-2xl">
            <div className="font-semibold text-body text-slate-900">{title}</div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 rounded-md text-slate-500 hover:bg-slate-100 flex items-center justify-center text-title leading-none"
            >
              ✕
            </button>
          </div>
        ) : null}
        <div className="p-4 sm:p-5">{children}</div>
      </div>
    </div>
  );
}
