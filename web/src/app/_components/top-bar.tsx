import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";

/**
 * Shared dark-green topbar.
 * - Mobile: two rows (Logo+actions / nav). Hamburger explicitly rejected.
 * - Desktop: single row.
 *
 * `breadcrumb` is rendered in the desktop row in place of the nav links
 * (used on /learn/* pages to show "TourTrain / NZSki / Coronet Peak 2026").
 */
export function TopBar({ breadcrumb }: { breadcrumb?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-10 border-b border-white/[.06] bg-[#04241e]/85 backdrop-blur-md px-4 sm:px-8 py-3">
      {/* === Mobile row 1: Logo + Lang + Sign in + Get certified === */}
      <div className="flex items-center justify-between gap-2 md:hidden">
        <Logo compact />
        <div className="flex items-center gap-1.5 shrink-0">
          <LangPicker compact />
          <Show when="signed-out">
            <span className="[&>button]:px-2 [&>button]:py-1.5 [&>button]:rounded-md [&>button]:text-[#d8f0e1] [&>button]:hover:bg-white/[.06] [&>button]:text-[13px]">
              <SignInButton mode="modal" />
            </span>
            <span className="[&>button]:px-2.5 [&>button]:py-1.5 [&>button]:rounded-md [&>button]:bg-emerald-400 [&>button]:text-[#04241e] [&>button]:font-semibold [&>button]:hover:bg-emerald-300 [&>button]:text-[13px]">
              <SignUpButton mode="modal">Get certified</SignUpButton>
            </span>
          </Show>
          <Show when="signed-in">
            <Link
              href="/learn"
              className="px-2.5 py-1.5 rounded-md bg-emerald-400 text-[#04241e] font-semibold hover:bg-emerald-300 text-[13px]"
            >
              Learning
            </Link>
            <UserButton appearance={{ variables: { colorPrimary: "#34d399" } }} />
          </Show>
        </div>
      </div>

      {/* === Mobile row 2: nav (or breadcrumb when on a deep page) === */}
      <div className="mt-2.5 md:hidden -mx-1">
        {breadcrumb ? (
          <div className="px-1 text-[13px] text-[#a7d4b6] truncate">{breadcrumb}</div>
        ) : (
          <nav className="flex items-center justify-between gap-1 text-[14px] text-[#a7d4b6]">
            <a className="flex-1 text-center px-1 py-1.5 hover:text-white">Explore</a>
            <a className="flex-1 text-center px-1 py-1.5 hover:text-white">Operators</a>
            <a className="flex-1 text-center px-1 py-1.5 hover:text-white">Badges</a>
            <a className="flex-1 text-center px-1 py-1.5 hover:text-white">Pricing</a>
          </nav>
        )}
      </div>

      {/* === Desktop single row === */}
      <div className="hidden md:flex items-center justify-between gap-6">
        <Logo />
        {breadcrumb ? (
          <div className="flex-1 min-w-0 text-[14px] text-[#a7d4b6] truncate">{breadcrumb}</div>
        ) : (
          <nav className="flex items-center gap-1 text-[15px] text-[#a7d4b6]">
            <a className="px-3.5 py-2 hover:text-white">Explore</a>
            <a className="px-3.5 py-2 hover:text-white">Operators</a>
            <a className="px-3.5 py-2 hover:text-white">Badges</a>
            <a className="px-3.5 py-2 hover:text-white">Pricing</a>
          </nav>
        )}
        <div className="flex items-center gap-2 shrink-0">
          <LangPicker />
          <Show when="signed-out">
            <span className="[&>button]:px-3.5 [&>button]:py-2 [&>button]:rounded-md [&>button]:text-[#d8f0e1] [&>button]:hover:bg-white/[.06] [&>button]:text-[14px]">
              <SignInButton mode="modal" />
            </span>
            <span className="[&>button]:px-4 [&>button]:py-2 [&>button]:rounded-md [&>button]:bg-emerald-400 [&>button]:text-[#04241e] [&>button]:font-semibold [&>button]:hover:bg-emerald-300 [&>button]:text-[14px]">
              <SignUpButton mode="modal">Get certified</SignUpButton>
            </span>
          </Show>
          <Show when="signed-in">
            <Link
              href="/learn"
              className="px-4 py-2 rounded-md bg-emerald-400 text-[#04241e] font-semibold hover:bg-emerald-300 text-[14px]"
            >
              Go to learning →
            </Link>
            <UserButton appearance={{ variables: { colorPrimary: "#34d399" } }} />
          </Show>
        </div>
      </div>
    </header>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  const size = compact ? 20 : 24;
  return (
    <Link href="/" className="flex items-center gap-2 shrink-0">
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M3 19l9-14 9 14H3z" stroke="#34d399" strokeWidth="2" fill="rgba(52,211,153,.12)" />
        <circle cx="12" cy="14" r="2" fill="#bef264" />
      </svg>
      <span className={`font-semibold ${compact ? "text-[15px]" : "text-[17px]"} text-white`}>
        <span className="text-emerald-300">Tour</span>Train
      </span>
    </Link>
  );
}

export function LangPicker({ compact = false }: { compact?: boolean }) {
  return (
    <button
      type="button"
      className={`rounded-md text-[#c4e9d3] hover:bg-white/[.06] inline-flex items-center ${
        compact ? "px-1.5 py-1.5 text-[12px] gap-1" : "px-3 py-2 text-[13px] gap-1.5"
      }`}
      aria-label="Change language"
    >
      <svg width={compact ? 12 : 14} height={compact ? 12 : 14} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        <path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" stroke="currentColor" strokeWidth="2" />
      </svg>
      EN
    </button>
  );
}
