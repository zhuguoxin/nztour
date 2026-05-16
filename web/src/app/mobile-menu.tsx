"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

const NAV = [
  { label: "Explore", href: "#" },
  { label: "Operators", href: "#" },
  { label: "Badges", href: "#" },
  { label: "Pricing", href: "#" },
];

const LANGS = [
  { code: "en", label: "English" },
  { code: "zh-CN", label: "简体中文" },
  { code: "zh-TW", label: "繁體中文" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "de", label: "Deutsch" },
  { code: "es", label: "Español" },
];

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const [showLangs, setShowLangs] = useState(false);

  // Close on Escape, and prevent body scroll while open.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="w-10 h-10 -mr-1 rounded-md hover:bg-white/[.06] flex items-center justify-center text-[#e6f5ec]"
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M6 6l12 12M18 6l-12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {open ? (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setOpen(false)}
            className="fixed inset-0 top-[57px] bg-black/40 backdrop-blur-sm z-20"
            aria-hidden
          />
          {/* Panel */}
          <div className="fixed left-0 right-0 top-[57px] z-30 bg-[#062b22] border-b border-white/[.08] shadow-[0_8px_32px_rgba(0,0,0,.4)] animate-[slidedown_.16s_ease-out]">
            <nav className="px-5 py-4 flex flex-col">
              {NAV.map((n) => (
                <a
                  key={n.label}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="px-2 py-3 text-[16px] text-[#e6f5ec] border-b border-white/[.04] hover:text-emerald-300"
                >
                  {n.label}
                </a>
              ))}

              {/* Language picker (collapsible) */}
              <button
                type="button"
                onClick={() => setShowLangs((v) => !v)}
                className="px-2 py-3 text-[16px] text-[#a7d4b6] flex items-center justify-between border-b border-white/[.04]"
              >
                <span className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                    <path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" stroke="currentColor" strokeWidth="2" />
                  </svg>
                  Language · EN
                </span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  className={`transition-transform ${showLangs ? "rotate-180" : ""}`}
                >
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" />
                </svg>
              </button>
              {showLangs ? (
                <div className="pl-8 pr-2 py-2 grid grid-cols-2 gap-1 border-b border-white/[.04]">
                  {LANGS.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => {
                        setShowLangs(false);
                        setOpen(false);
                      }}
                      className="text-left text-[14px] text-[#c4e9d3] hover:text-white px-2 py-1.5 rounded-md hover:bg-white/[.04] flex items-center justify-between"
                    >
                      <span>{l.label}</span>
                      <span className="text-[11px] text-[#5d9279] font-mono">{l.code}</span>
                    </button>
                  ))}
                </div>
              ) : null}

              {/* Auth actions */}
              <div className="mt-4 grid grid-cols-1 gap-2">
                <Show when="signed-out">
                  <SignUpButton mode="modal">
                    <button
                      onClick={() => setOpen(false)}
                      className="w-full px-4 py-3 rounded-md bg-emerald-400 text-[#04241e] font-semibold text-[15px]"
                    >
                      Get certified
                    </button>
                  </SignUpButton>
                  <SignInButton mode="modal">
                    <button
                      onClick={() => setOpen(false)}
                      className="w-full px-4 py-2.5 rounded-md border border-white/[.10] text-[#e6f5ec] text-[14px]"
                    >
                      Sign in
                    </button>
                  </SignInButton>
                </Show>
                <Show when="signed-in">
                  <Link
                    href="/learn"
                    onClick={() => setOpen(false)}
                    className="w-full text-center px-4 py-3 rounded-md bg-emerald-400 text-[#04241e] font-semibold text-[15px]"
                  >
                    Go to learning →
                  </Link>
                  <div className="flex items-center justify-between px-2 mt-1">
                    <span className="text-[13px] text-[#86b69a]">Account</span>
                    <UserButton appearance={{ variables: { colorPrimary: "#34d399" } }} />
                  </div>
                </Show>
              </div>
            </nav>
          </div>
        </>
      ) : null}

      <style>{`
        @keyframes slidedown {
          from { transform: translateY(-6px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}
