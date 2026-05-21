import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { getCurrentRole } from "@/lib/roles";
import { getLocale, t } from "@/lib/i18n";
import { LocaleSwitcher } from "./locale-switcher";

/**
 * Shared dark-green topbar.
 * - Mobile: two rows (Logo+actions / nav). Hamburger explicitly rejected.
 * - Desktop: single row.
 *
 * `breadcrumb` is rendered in the desktop row in place of the nav links
 * (used on /learn/* pages to show "TourTrain / NZSki / Coronet Peak 2026").
 *
 * Role-aware: operators see an "Operator console" pill linking to
 * /operator/<first-slug>; platform admins see "Admin" linking to /admin.
 */
export async function TopBar({ breadcrumb }: { breadcrumb?: React.ReactNode }) {
  const [role, locale, tr] = await Promise.all([getCurrentRole(), getLocale(), t()]);
  // Operator console destination:
  //  - admins, or users with >1 operator memberships → /operator picker
  //  - exactly 1 membership → that operator's dashboard directly
  //  - 0 memberships and not admin → hide the pill
  const operatorHref =
    role.isAdmin || role.operators.length > 1
      ? "/operator"
      : role.operators.length === 1
        ? `/operator/${role.operators[0].operator_slug}`
        : null;
  return (
    <header className="sticky top-0 z-10 border-b border-white/[.06] bg-[#04241e]/85 backdrop-blur-md px-4 sm:px-8 py-3">
      {/* === Mobile row 1: Logo + Lang + Sign in + Get certified === */}
      <div className="flex items-center justify-between gap-2 md:hidden">
        <Logo compact />
        <div className="flex items-center gap-1.5 shrink-0">
          <LocaleSwitcher current={locale} compact label={tr.language_label} />
          <Show when="signed-out">
            <span className="[&>button]:px-2 [&>button]:py-1.5 [&>button]:rounded-md [&>button]:text-[#d8f0e1] [&>button]:hover:bg-white/[.06] [&>button]:text-[13px]">
              <SignInButton mode="modal">{tr.sign_in}</SignInButton>
            </span>
            <span className="[&>button]:px-2.5 [&>button]:py-1.5 [&>button]:rounded-md [&>button]:bg-emerald-400 [&>button]:text-[#04241e] [&>button]:font-semibold [&>button]:hover:bg-emerald-300 [&>button]:text-[13px]">
              <SignUpButton mode="modal">{tr.get_certified}</SignUpButton>
            </span>
          </Show>
          <Show when="signed-in">
            {operatorHref ? (
              <Link
                href={operatorHref}
                className="px-2 py-1.5 rounded-md border border-emerald-400/30 text-emerald-300 hover:bg-emerald-400/10 text-[12px]"
                title={tr.nav_operator_console}
              >
                {tr.nav_operator_short}
              </Link>
            ) : null}
            {role.isAdmin ? (
              <Link
                href="/admin"
                className="px-2 py-1.5 rounded-md border border-lime-300/30 text-lime-300 hover:bg-lime-300/10 text-[12px]"
              >
                {tr.nav_admin}
              </Link>
            ) : null}
            <Link
              href="/learn"
              className="px-2.5 py-1.5 rounded-md bg-emerald-400 text-[#04241e] font-semibold hover:bg-emerald-300 text-[13px]"
            >
              {tr.nav_learning_short}
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
            <a className="flex-1 text-center px-1 py-1.5 hover:text-white">{tr.nav_explore}</a>
            <a className="flex-1 text-center px-1 py-1.5 hover:text-white">{tr.nav_operators}</a>
            <a className="flex-1 text-center px-1 py-1.5 hover:text-white">{tr.nav_badges}</a>
            <a className="flex-1 text-center px-1 py-1.5 hover:text-white">{tr.nav_pricing}</a>
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
            <a className="px-3.5 py-2 hover:text-white">{tr.nav_explore}</a>
            <a className="px-3.5 py-2 hover:text-white">{tr.nav_operators}</a>
            <a className="px-3.5 py-2 hover:text-white">{tr.nav_badges}</a>
            <a className="px-3.5 py-2 hover:text-white">{tr.nav_pricing}</a>
          </nav>
        )}
        <div className="flex items-center gap-2 shrink-0">
          <LocaleSwitcher current={locale} label={tr.language_label} />
          <Show when="signed-out">
            <span className="[&>button]:px-3.5 [&>button]:py-2 [&>button]:rounded-md [&>button]:text-[#d8f0e1] [&>button]:hover:bg-white/[.06] [&>button]:text-[14px]">
              <SignInButton mode="modal">{tr.sign_in}</SignInButton>
            </span>
            <span className="[&>button]:px-4 [&>button]:py-2 [&>button]:rounded-md [&>button]:bg-emerald-400 [&>button]:text-[#04241e] [&>button]:font-semibold [&>button]:hover:bg-emerald-300 [&>button]:text-[14px]">
              <SignUpButton mode="modal">{tr.get_certified}</SignUpButton>
            </span>
          </Show>
          <Show when="signed-in">
            {operatorHref ? (
              <Link
                href={operatorHref}
                className="px-3 py-2 rounded-md border border-emerald-400/30 text-emerald-300 hover:bg-emerald-400/10 text-[13px]"
              >
                {tr.nav_operator_console}
              </Link>
            ) : null}
            {role.isAdmin ? (
              <Link
                href="/admin"
                className="px-3 py-2 rounded-md border border-lime-300/30 text-lime-300 hover:bg-lime-300/10 text-[13px]"
              >
                {tr.nav_admin}
              </Link>
            ) : null}
            <Link
              href="/learn"
              className="px-4 py-2 rounded-md bg-emerald-400 text-[#04241e] font-semibold hover:bg-emerald-300 text-[14px]"
            >
              {tr.nav_learning_button}
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
