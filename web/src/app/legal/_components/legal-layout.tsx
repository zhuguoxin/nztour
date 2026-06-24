import Link from "next/link";
import { TopBar } from "../../_components/top-bar";
import { getLocale } from "@/lib/i18n";

/**
 * Shared shell for every legal page (Terms of Service, Privacy Policy,
 * Acceptable Use Policy, Cookies Policy). Three columns on desktop:
 *
 *   [ left:  legal nav     |  centre:  document body  |  right:  TOC ]
 *
 * Mobile collapses to a single column with the legal nav at the top.
 *
 * Pages pass in their full document body as children plus a `meta`
 * object with the title, effective date, and TOC (heading anchors).
 */
export interface LegalDocMeta {
  title: string;
  /** Effective date in human form, e.g. "1 January 2026" */
  effectiveDate: string;
  /** Last updated, same format. May equal effectiveDate. */
  lastUpdated: string;
  /** Document version, e.g. "v1.0" */
  version: string;
  /** Anchor → label list for the right-side TOC */
  toc: Array<{ id: string; label: string }>;
  /** Slug of the current page for the left nav highlight ("terms", "privacy", etc.) */
  activeSlug: LegalSlug;
}

export type LegalSlug =
  | "terms"
  | "privacy"
  | "acceptable-use"
  | "cookies";

const LEGAL_NAV: Array<{ slug: LegalSlug; label: string; labelZh: string }> = [
  { slug: "terms", label: "Terms of Service", labelZh: "服务条款" },
  { slug: "privacy", label: "Privacy Policy", labelZh: "隐私政策" },
  { slug: "acceptable-use", label: "Acceptable Use Policy", labelZh: "可接受使用政策" },
  { slug: "cookies", label: "Cookies Policy", labelZh: "Cookie 政策" },
];

export async function LegalLayout({
  meta,
  children,
}: {
  meta: LegalDocMeta;
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const zh = locale === "zh-CN";
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased text-body">
      <TopBar
        breadcrumb={
          <span className="flex items-center gap-2 min-w-0">
            <Link href="/" className="hover:text-white shrink-0">{zh ? "首页" : "Home"}</Link>
            <span className="text-white/20 shrink-0">/</span>
            <Link href="/legal/terms" className="hover:text-white shrink-0">{zh ? "法律" : "Legal"}</Link>
            <span className="text-white/20 shrink-0">/</span>
            <span className="text-white truncate">{meta.title}</span>
          </span>
        }
      />

      <main className="px-5 sm:px-8 py-8 sm:py-12 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr_220px] gap-8 lg:gap-12">
          {/* Left nav */}
          <aside className="lg:sticky lg:top-20 lg:self-start order-1">
            <div className="text-micro tracking-widest font-mono text-slate-700 mb-2">
              {zh ? "法律" : "LEGAL"}
            </div>
            <nav className="space-y-0.5">
              {LEGAL_NAV.map((n) => {
                const active = n.slug === meta.activeSlug;
                return (
                  <Link
                    key={n.slug}
                    href={`/legal/${n.slug}`}
                    className={`block px-2 py-1.5 rounded text-small ${
                      active
                        ? "bg-emerald-50 text-slate-900 border-l-2 border-emerald-600 font-medium"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    {zh ? n.labelZh : n.label}
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Document body */}
          <article className="order-3 lg:order-2 prose-legal min-w-0">
            <header className="mb-8 pb-5 border-b border-slate-200">
              <div className="text-micro tracking-widest font-mono text-slate-700 mb-1.5">
                {meta.activeSlug.toUpperCase().replace("-", " ")}
              </div>
              <h1 className="text-h1 sm:text-h1 font-semibold tracking-tight text-slate-900">
                {meta.title}
              </h1>
              <div className="mt-3 flex items-center gap-3 text-caption text-slate-500 flex-wrap">
                <span>
                  <span className="text-slate-400">{zh ? "生效日期" : "Effective"}</span>{" "}
                  <span className="font-mono">{meta.effectiveDate}</span>
                </span>
                <span className="text-slate-300">·</span>
                <span>
                  <span className="text-slate-400">{zh ? "最近更新" : "Last updated"}</span>{" "}
                  <span className="font-mono">{meta.lastUpdated}</span>
                </span>
                <span className="text-slate-300">·</span>
                <span className="font-mono text-slate-600">{meta.version}</span>
              </div>
              <div className="mt-4 px-3 py-2 rounded border border-amber-200 bg-amber-50 text-caption text-slate-900">
                <strong>{zh ? "供法律审查的草稿。" : "Draft for legal review."}</strong>{" "}
                {zh
                  ? "本文件由 Libretour Limited 作为初始发布版本起草，尚未经外部律师审阅。本文件系本着诚信原则提供，应理解为公司当前的立场。我们将在完成独立法律审查后发布经签署确认的版本。"
                  : <>This document was drafted by
                Libretour Limited as an initial release and has not yet been reviewed by
                an external solicitor. It is provided in good faith and should be
                understood as the company&apos;s current position. We will publish a
                signed-off version following independent legal review.</>}
                {zh && (
                  <div className="mt-1.5">
                    本中文译本仅供参考;如中英文版本存在任何歧义,以英文版本为准。
                  </div>
                )}
              </div>
            </header>

            {children}

            <footer className="mt-12 pt-6 border-t border-slate-200 text-caption text-slate-500 space-y-2">
              <p>
                {zh ? "对本文件有疑问?请通过 " : "Questions about this document? Contact us at "}
                <a className="text-slate-900 hover:underline" href="mailto:legal@libretour.com">
                  legal@libretour.com
                </a>
                {zh ? " 与我们联系。" : "."}
              </p>
              <p>
                {zh
                  ? "Libretour Limited，NZBN [TBD-NZBN]，注册办公地址 [TBD-registered-address]，新西兰。"
                  : "Libretour Limited, NZBN [TBD-NZBN], registered office [TBD-registered-address], New Zealand."}
              </p>
            </footer>
          </article>

          {/* Right TOC */}
          <aside className="hidden lg:block order-2 lg:order-3 lg:sticky lg:top-20 lg:self-start">
            <div className="text-micro tracking-widest font-mono text-slate-700 mb-2">
              {zh ? "本页内容" : "ON THIS PAGE"}
            </div>
            <nav className="space-y-1">
              {meta.toc.map((t) => (
                <a
                  key={t.id}
                  href={`#${t.id}`}
                  className="block text-caption text-slate-500 hover:text-slate-900 py-0.5 leading-snug"
                >
                  {t.label}
                </a>
              ))}
            </nav>
          </aside>
        </div>
      </main>
    </div>
  );
}

/**
 * Section heading helper used by every legal doc. Renders an anchored
 * `<h2>` that matches the TOC entry, plus an optional leading section
 * number for visual rhythm.
 */
export function LegalSection({
  id,
  number,
  title,
  children,
}: {
  id: string;
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mt-8 scroll-mt-20">
      <h2 className="text-h3 sm:text-h3 font-semibold tracking-tight text-slate-900 mb-3">
        <span className="font-mono text-slate-900 mr-2 text-body">{number}</span>
        {title}
      </h2>
      <div className="space-y-3 text-small text-slate-700 leading-[1.7]">
        {children}
      </div>
    </section>
  );
}

/** Numbered sub-list (a), (b), (c)... — common in legal copy. */
export function LegalList({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="ml-5 space-y-2 list-[lower-alpha] marker:text-slate-900 marker:font-mono">
      {items.map((it, i) => (
        <li key={i} className="pl-1">{it}</li>
      ))}
    </ol>
  );
}

/** Defined-term inline emphasis, e.g. (each a "Learner"). */
export function Term({ children }: { children: React.ReactNode }) {
  return <strong className="text-slate-900 font-semibold">{children}</strong>;
}
