import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { getCurrentRole } from "@/lib/roles";
import { getLocale, t } from "@/lib/i18n";
import { LocaleSwitcher } from "./locale-switcher";

/**
 * Shared dark-green topbar — Libretour platform chrome.
 *
 * Lives above both white platform pages and operator-themed content pages.
 * The contrast (dark chrome → light/branded content area) reads like Github /
 * Vercel / Slack and keeps the platform identity visible without competing
 * with operator branding underneath.
 *
 * - Mobile: two rows (Logo+actions / nav). Hamburger explicitly rejected.
 * - Desktop: single row.
 *
 * `breadcrumb` is rendered in the desktop row in place of the nav links
 * (used on /learn/* pages to show "Libretour / NZSki / Coronet Peak 2026").
 *
 * Role-aware: operators see an "Operator console" pill linking to
 * /product/<first-slug>; platform admins see "Admin" linking to /admin.
 */
export async function TopBar({ breadcrumb }: { breadcrumb?: React.ReactNode }) {
  const [role, locale, tr] = await Promise.all([getCurrentRole(), getLocale(), t()]);
  // The Supplier panel is the back-office hub. Admins and supplier members get
  // the supplier pill (picker when they manage more than one, direct otherwise).
  const supplierHref =
    role.isAdmin || role.suppliers.length > 1
      ? "/supplier"
      : role.suppliers.length === 1
        ? `/supplier/${role.suppliers[0].supplier_slug}`
        : null;
  // Product pill only for users who have product (operator) access WITHOUT any
  // supplier access — they drill straight to their product(s). Anyone with
  // supplier access manages products from inside the supplier panel.
  const operatorHref =
    supplierHref
      ? null
      : role.operators.length > 1
        ? "/product"
        : role.operators.length === 1
          ? `/product/${role.operators[0].operator_slug}`
          : null;
  return (
    <header className="sticky top-0 z-10 border-b border-white/[.06] bg-[#04241e]/95 backdrop-blur-md px-4 sm:px-8 py-3">
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
            {supplierHref ? (
              <Link
                href={supplierHref}
                className="px-2 py-1.5 rounded-md border border-teal-300/30 text-teal-200 hover:bg-teal-300/10 text-[12px]"
                title={tr.nav_supplier_console}
              >
                {tr.nav_supplier_short}
              </Link>
            ) : null}
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
            {supplierHref ? (
              <Link
                href={supplierHref}
                className="px-3 py-2 rounded-md border border-teal-300/30 text-teal-200 hover:bg-teal-300/10 text-[13px]"
              >
                {tr.nav_supplier_console}
              </Link>
            ) : null}
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
  const h = compact ? 22 : 26;
  const w = (h * 240) / 320; // preserve the 240×320 mark aspect ratio
  return (
    <Link href="/" className="flex items-center gap-2 shrink-0">
      <LibretourMark height={h} width={w} />
      <span className={`font-semibold ${compact ? "text-[15px]" : "text-[17px]"} text-white`}>
        <span className="text-emerald-300">Libre</span>tour
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
