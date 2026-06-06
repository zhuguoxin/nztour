import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { getCurrentRole } from "@/lib/roles";
import { getLocale, t } from "@/lib/i18n";
import { LocaleSwitcher } from "./locale-switcher";

/**
 * Shared light-theme topbar — Libretour platform chrome.
 *
 * Sits on a white background even on operator-themed pages so the platform
 * identity stays neutral above the operator's branded content area.
 *
 * - Mobile: two rows (Logo+actions / nav). Hamburger explicitly rejected.
 * - Desktop: single row.
 *
 * `breadcrumb` is rendered in the desktop row in place of the nav links
 * (used on /learn/* pages to show "Libretour / NZSki / Coronet Peak 2026").
 *
 * Role-aware: operators see an "Operator console" pill linking to
 * /operator/<first-slug>; platform admins see "Admin" linking to /admin.
 */
export async function TopBar({ breadcrumb }: { breadcrumb?: React.ReactNode }) {
  const [role, locale, tr] = await Promise.all([getCurrentRole(), getLocale(), t()]);
  const operatorHref =
    role.isAdmin || role.operators.length > 1
      ? "/operator"
      : role.operators.length === 1
        ? `/operator/${role.operators[0].operator_slug}`
        : null;
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/85 backdrop-blur-md px-4 sm:px-8 py-3">
      {/* === Mobile row 1: Logo + Lang + Sign in + Get certified === */}
      <div className="flex items-center justify-between gap-2 md:hidden">
        <Logo compact />
        <div className="flex items-center gap-1.5 shrink-0">
          <LocaleSwitcher current={locale} compact label={tr.language_label} />
          <Show when="signed-out">
            <span className="[&>button]:px-2 [&>button]:py-1.5 [&>button]:rounded-md [&>button]:text-slate-700 [&>button]:hover:bg-slate-100 [&>button]:text-[13px]">
              <SignInButton mode="modal">{tr.sign_in}</SignInButton>
            </span>
            <span className="[&>button]:px-2.5 [&>button]:py-1.5 [&>button]:rounded-md [&>button]:bg-emerald-600 [&>button]:text-white [&>button]:font-semibold [&>button]:hover:bg-emerald-700 [&>button]:text-[13px]">
              <SignUpButton mode="modal">{tr.get_certified}</SignUpButton>
            </span>
          </Show>
          <Show when="signed-in">
            {operatorHref ? (
              <Link
                href={operatorHref}
                className="px-2 py-1.5 rounded-md border border-emerald-600/30 text-emerald-700 hover:bg-emerald-50 text-[12px]"
                title={tr.nav_operator_console}
              >
                {tr.nav_operator_short}
              </Link>
            ) : null}
            {role.isAdmin ? (
              <Link
                href="/admin"
                className="px-2 py-1.5 rounded-md border border-lime-600/30 text-lime-700 hover:bg-lime-50 text-[12px]"
              >
                {tr.nav_admin}
              </Link>
            ) : null}
            <Link
              href="/learn"
              className="px-2.5 py-1.5 rounded-md bg-emerald-600 text-white font-semibold hover:bg-emerald-700 text-[13px]"
            >
              {tr.nav_learning_short}
            </Link>
            <UserButton appearance={{ variables: { colorPrimary: "#059669" } }} />
          </Show>
        </div>
      </div>

      {/* === Mobile row 2: nav (or breadcrumb when on a deep page) === */}
      <div className="mt-2.5 md:hidden -mx-1">
        {breadcrumb ? (
          <div className="px-1 text-[13px] text-slate-600 truncate">{breadcrumb}</div>
        ) : (
          <nav className="flex items-center justify-between gap-1 text-[14px] text-slate-600">
            <a className="flex-1 text-center px-1 py-1.5 hover:text-slate-900">{tr.nav_explore}</a>
            <a className="flex-1 text-center px-1 py-1.5 hover:text-slate-900">{tr.nav_operators}</a>
            <a className="flex-1 text-center px-1 py-1.5 hover:text-slate-900">{tr.nav_badges}</a>
            <a className="flex-1 text-center px-1 py-1.5 hover:text-slate-900">{tr.nav_pricing}</a>
          </nav>
        )}
      </div>

      {/* === Desktop single row === */}
      <div className="hidden md:flex items-center justify-between gap-6">
        <Logo />
        {breadcrumb ? (
          <div className="flex-1 min-w-0 text-[14px] text-slate-600 truncate">{breadcrumb}</div>
        ) : (
          <nav className="flex items-center gap-1 text-[15px] text-slate-600">
            <a className="px-3.5 py-2 hover:text-slate-900">{tr.nav_explore}</a>
            <a className="px-3.5 py-2 hover:text-slate-900">{tr.nav_operators}</a>
            <a className="px-3.5 py-2 hover:text-slate-900">{tr.nav_badges}</a>
            <a className="px-3.5 py-2 hover:text-slate-900">{tr.nav_pricing}</a>
          </nav>
        )}
        <div className="flex items-center gap-2 shrink-0">
          <LocaleSwitcher current={locale} label={tr.language_label} />
          <Show when="signed-out">
            <span className="[&>button]:px-3.5 [&>button]:py-2 [&>button]:rounded-md [&>button]:text-slate-700 [&>button]:hover:bg-slate-100 [&>button]:text-[14px]">
              <SignInButton mode="modal">{tr.sign_in}</SignInButton>
            </span>
            <span className="[&>button]:px-4 [&>button]:py-2 [&>button]:rounded-md [&>button]:bg-emerald-600 [&>button]:text-white [&>button]:font-semibold [&>button]:hover:bg-emerald-700 [&>button]:text-[14px]">
              <SignUpButton mode="modal">{tr.get_certified}</SignUpButton>
            </span>
          </Show>
          <Show when="signed-in">
            {operatorHref ? (
              <Link
                href={operatorHref}
                className="px-3 py-2 rounded-md border border-emerald-600/30 text-emerald-700 hover:bg-emerald-50 text-[13px]"
              >
                {tr.nav_operator_console}
              </Link>
            ) : null}
            {role.isAdmin ? (
              <Link
                href="/admin"
                className="px-3 py-2 rounded-md border border-lime-600/30 text-lime-700 hover:bg-lime-50 text-[13px]"
              >
                {tr.nav_admin}
              </Link>
            ) : null}
            <Link
              href="/learn"
              className="px-4 py-2 rounded-md bg-emerald-600 text-white font-semibold hover:bg-emerald-700 text-[14px]"
            >
              {tr.nav_learning_button}
            </Link>
            <UserButton appearance={{ variables: { colorPrimary: "#059669" } }} />
          </Show>
        </div>
      </div>
    </header>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  const h = compact ? 22 : 26;
  const w = (h * 240) / 320; // preserve the 240×320 mark aspect ratio
  return (
    <Link href="/" className="flex items-center gap-2 shrink-0">
      <LibretourMark height={h} width={w} />
      <span className={`font-semibold ${compact ? "text-[15px]" : "text-[17px]"} text-slate-900`}>
        <span className="text-emerald-700">Libre</span>tour
      </span>
    </Link>
  );
}

/** The layered-chevron pin mark. Uses a fixed clip id — every instance clips
 *  to the identical teardrop, so a shared/duplicate <clipPath id> is harmless
 *  and avoids any SSR-hydration id mismatch. */
export function LibretourMark({
  width,
  height,
  dark = "#1B7A4F",
  light = "#46B175",
}: {
  width: number;
  height: number;
  dark?: string;
  light?: string;
}) {
  return (
    <svg width={width} height={height} viewBox="0 0 240 320" fill="none" aria-hidden>
      <defs>
        <clipPath id="lt-pin-clip">
          <path d="M 120 300 C 42 208 28 174 28 116 a 92 92 0 1 1 184 0 C 212 174 198 208 120 300 Z" />
        </clipPath>
      </defs>
      <g clipPath="url(#lt-pin-clip)">
        {/* Simplified 3-band mark — bold enough to read at ~24px in the header */}
        <path d="M -80 6 L 120 40 L 120 118 L -80 84 Z" fill={dark} />
        <path d="M 320 6 L 120 40 L 120 118 L 320 84 Z" fill={light} />
        <path d="M -80 132 L 120 166 L 120 218 L -80 184 Z" fill={dark} />
        <path d="M 320 132 L 120 166 L 120 218 L 320 184 Z" fill={light} />
        <path d="M -80 222 L 120 262 L 120 302 L -80 262 Z" fill={dark} />
        <path d="M 320 222 L 120 262 L 120 302 L 320 262 Z" fill={light} />
      </g>
    </svg>
  );
}
