import { notFound } from "next/navigation";
import Link from "next/link";
import { TopBar } from "../../../_components/top-bar";
import { requireOperatorMembership } from "@/lib/roles";
import { db } from "@/lib/db";
import { CategorizeButton } from "./categorize-button";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ from?: string; to?: string; theme?: string; q?: string }>;
}

interface ThemeRow {
  id: string;
  label: string;
  description: string | null;
  question_count: number;
}

interface QARow {
  id: string;
  question: string;
  answer: string;
  source_kind: string;
  created_at: number;
  user_name: string | null;
  user_email: string;
  course_title: string | null;
  course_slug: string | null;
  theme_id: string | null;
  theme_label: string | null;
}

function parseDate(s: string | undefined, endOfDay = false): number | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(s + (endOfDay ? "T23:59:59Z" : "T00:00:00Z"));
  const t = d.getTime();
  return Number.isFinite(t) ? Math.floor(t / 1000) : null;
}

/**
 * /product/<slug>/qa — full AI Q&A archive for the operator.
 *
 * Default view: theme list (left) + recent Q&A pairs (right) for the
 * window, with drill-down: click a theme to filter; click a row to expand
 * the answer; learner name/email shown inline so the operator can follow
 * up if relevant.
 *
 * The "Refresh themes" button runs Claude-based categorization on any
 * uncategorized rows in the window. UI is intentionally non-magical —
 * categorization runs on demand, not silently on every page load.
 */
export default async function QAArchive({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;

  let access;
  try {
    access = await requireOperatorMembership(slug);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "forbidden" || msg === "unauthorised" || msg === "not_found") notFound();
    throw err;
  }

  const operator = await db()
    .prepare(`SELECT id, slug, name FROM operators WHERE slug = ?`)
    .bind(slug)
    .first<{ id: string; slug: string; name: string }>();
  if (!operator) notFound();

  const now = Math.floor(Date.now() / 1000);
  const fromTs = parseDate(sp.from) ?? now - 30 * 86400;
  const toTs = parseDate(sp.to, true) ?? now;
  const themeFilter = sp.theme ?? null;
  const q = (sp.q ?? "").trim().slice(0, 80);

  const [themes, qaRows, uncategorizedCount] = await Promise.all([
    db()
      .prepare(
        `SELECT id, label, description, question_count
         FROM qa_themes WHERE operator_id = ?
         ORDER BY question_count DESC, label`,
      )
      .bind(operator.id)
      .all<ThemeRow>(),
    db()
      .prepare(
        `SELECT q.id, q.question, q.answer, q.source_kind, q.created_at,
                u.name AS user_name, u.email AS user_email,
                c.title AS course_title, c.slug AS course_slug,
                q.theme_id, t.label AS theme_label
         FROM qa_logs q
         LEFT JOIN users u ON u.id = q.user_id
         LEFT JOIN courses c ON c.id = q.course_id
         LEFT JOIN qa_themes t ON t.id = q.theme_id
         WHERE q.operator_id = ?
           AND q.created_at >= ? AND q.created_at <= ?
           ${themeFilter ? `AND q.theme_id = ?` : ""}
           ${q ? `AND q.question LIKE ?` : ""}
         ORDER BY q.created_at DESC
         LIMIT 200`,
      )
      .bind(
        ...[
          operator.id,
          fromTs,
          toTs,
          ...(themeFilter ? [themeFilter] : []),
          ...(q ? [`%${q}%`] : []),
        ],
      )
      .all<QARow>(),
    db()
      .prepare(
        `SELECT COUNT(*) AS n FROM qa_logs
         WHERE operator_id = ? AND theme_id IS NULL
           AND created_at >= ? AND created_at <= ?`,
      )
      .bind(operator.id, fromTs, toTs)
      .first<{ n: number }>(),
  ]);

  const fmtIso = (t: number) => new Date(t * 1000).toISOString().slice(0, 10);
  const todayIso = fmtIso(now);
  const fromIso = fmtIso(fromTs);
  const toIso = fmtIso(toTs);

  const baseQuery = (extra: Record<string, string | undefined> = {}) => {
    const p = new URLSearchParams({ from: fromIso, to: toIso });
    if (themeFilter && extra.theme === undefined) p.set("theme", themeFilter);
    if (q && extra.q === undefined) p.set("q", q);
    for (const [k, v] of Object.entries(extra)) {
      if (v === undefined) p.delete(k);
      else p.set(k, v);
    }
    return p.toString();
  };

  return (
    <div className="min-h-screen bg-[#04241e] text-[#f0fdf4] font-sans antialiased">
      <TopBar
        breadcrumb={
          <span className="flex items-center gap-2 min-w-0 text-[14px]">
            <Link href={`/product/${slug}`} className="hover:text-white">
              {operator.name}
            </Link>
            <span className="text-white/20">/</span>
            <span className="text-white">Q&amp;A archive</span>
          </span>
        }
      />

      <main className="px-5 sm:px-8 py-8 max-w-6xl mx-auto">
        {/* Window + refresh button */}
        <section className="rounded-xl border border-white/[.08] bg-[#0a3a2f] px-4 py-3 mb-5 flex items-center gap-3 flex-wrap">
          <div className="text-[11px] tracking-widest font-mono text-emerald-300/70">REPORTING WINDOW</div>
          <div className="font-mono text-[12.5px] text-white">{fromIso} → {toIso}</div>
          <form action={`/product/${slug}/qa`} className="flex items-center gap-1 ml-1">
            <input
              type="date"
              name="from"
              defaultValue={fromIso}
              max={todayIso}
              className="bg-[#04241e] border border-white/[.10] rounded px-2 py-1 text-[12px] text-white"
            />
            <span className="text-[#86b69a]">→</span>
            <input
              type="date"
              name="to"
              defaultValue={toIso}
              max={todayIso}
              className="bg-[#04241e] border border-white/[.10] rounded px-2 py-1 text-[12px] text-white"
            />
            <button
              type="submit"
              className="px-2.5 py-1 rounded bg-emerald-400 text-[#04241e] font-semibold text-[12px] hover:bg-emerald-300"
            >
              Apply
            </button>
          </form>
          <div className="ml-auto flex items-center gap-2">
            {uncategorizedCount && uncategorizedCount.n > 0 ? (
              <span className="text-[11.5px] text-amber-300 font-mono">
                {uncategorizedCount.n} uncategorized
              </span>
            ) : (
              <span className="text-[11.5px] text-emerald-300 font-mono">all categorized</span>
            )}
            <CategorizeButton
              operatorSlug={slug}
              from={fromTs}
              to={toTs}
              disabled={!uncategorizedCount || uncategorizedCount.n === 0}
            />
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5">
          {/* Theme sidebar */}
          <aside className="rounded-xl border border-white/[.08] bg-[#0a3a2f] p-3 h-fit">
            <div className="text-[11px] tracking-widest font-mono text-emerald-300/70 mb-2 px-1">
              THEMES — {themes.results?.length ?? 0}
            </div>
            <Link
              href={`/product/${slug}/qa?${baseQuery({ theme: undefined })}`}
              className={`block px-2 py-1.5 rounded text-[13px] mb-1 ${
                themeFilter === null
                  ? "bg-emerald-400/15 text-white border border-emerald-400/30"
                  : "text-[#d8f0e1] hover:bg-white/[.06]"
              }`}
            >
              All themes
              <span className="ml-1.5 font-mono text-[11px] text-[#86b69a]">
                {(themes.results ?? []).reduce((acc, t) => acc + t.question_count, 0)}
              </span>
            </Link>
            <ul className="space-y-0.5 max-h-[60vh] overflow-y-auto">
              {(themes.results ?? []).map((t) => {
                const active = themeFilter === t.id;
                return (
                  <li key={t.id}>
                    <Link
                      href={`/product/${slug}/qa?${baseQuery({ theme: t.id })}`}
                      className={`block px-2 py-1.5 rounded text-[13px] ${
                        active
                          ? "bg-emerald-400/15 text-white border border-emerald-400/30"
                          : "text-[#d8f0e1] hover:bg-white/[.06] border border-transparent"
                      }`}
                      title={t.description ?? undefined}
                    >
                      <div className="truncate">{t.label}</div>
                      <div className="font-mono text-[10px] text-[#86b69a]">
                        {t.question_count} question{t.question_count === 1 ? "" : "s"}
                      </div>
                    </Link>
                  </li>
                );
              })}
              {(themes.results ?? []).length === 0 ? (
                <div className="px-2 py-3 text-[12px] text-[#86b69a]">
                  No themes yet — click Refresh themes to categorize.
                </div>
              ) : null}
            </ul>
          </aside>

          {/* Q&A list */}
          <section className="rounded-xl border border-white/[.08] bg-[#0a3a2f] overflow-hidden">
            <header className="px-4 py-3 border-b border-white/[.06] flex items-center gap-3 flex-wrap">
              <div className="text-[13.5px] font-semibold text-white">
                {themeFilter
                  ? `Filtered: ${(themes.results ?? []).find((t) => t.id === themeFilter)?.label ?? themeFilter}`
                  : "All Q&A"}
                <span className="ml-1.5 text-[11px] text-[#86b69a] font-mono">
                  {qaRows.results?.length ?? 0} shown · 200 max
                </span>
              </div>
              <form action={`/product/${slug}/qa`} className="ml-auto">
                <input type="hidden" name="from" value={fromIso} />
                <input type="hidden" name="to" value={toIso} />
                {themeFilter ? <input type="hidden" name="theme" value={themeFilter} /> : null}
                <input
                  type="search"
                  name="q"
                  defaultValue={q}
                  placeholder="Search question text…"
                  className="bg-[#04241e] border border-white/[.10] rounded px-2 py-1 text-[12px] text-white outline-none focus:border-emerald-400/60 w-56"
                />
              </form>
            </header>

            <ul className="divide-y divide-white/[.04]">
              {(qaRows.results ?? []).map((r) => (
                <li key={r.id} className="px-4 py-3">
                  <details className="group">
                    <summary className="cursor-pointer list-none flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-[13.5px] text-white">{r.question}</div>
                        <div className="text-[11px] text-[#86b69a] mt-0.5 flex items-center gap-2 flex-wrap">
                          {r.theme_label ? (
                            <span className="px-1.5 py-0.5 rounded border border-emerald-400/30 text-emerald-300 font-mono text-[10px]">
                              {r.theme_label}
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded border border-amber-400/30 text-amber-300 font-mono text-[10px]">
                              uncategorized
                            </span>
                          )}
                          <span>{r.user_name ?? maskEmail(r.user_email)}</span>
                          <span className="text-white/20">·</span>
                          <span className="font-mono">{r.user_email}</span>
                          {r.course_title ? (
                            <>
                              <span className="text-white/20">·</span>
                              <span>{r.course_title}</span>
                            </>
                          ) : null}
                          <span className="text-white/20">·</span>
                          <span>{new Date(r.created_at * 1000).toISOString().slice(0, 16).replace("T", " ")}</span>
                          <span className="text-white/20">·</span>
                          <span className="uppercase font-mono">{r.source_kind}</span>
                        </div>
                      </div>
                      <span className="text-[#86b69a] text-[12px] group-open:rotate-180 transition-transform shrink-0">⌄</span>
                    </summary>
                    <div className="mt-2 ml-1 p-3 rounded bg-[#04241e] border border-white/[.06]">
                      <div className="text-[12px] text-[#a7d4b6] whitespace-pre-wrap leading-relaxed">
                        {r.answer}
                      </div>
                    </div>
                  </details>
                </li>
              ))}
              {(qaRows.results ?? []).length === 0 ? (
                <li className="px-4 py-10 text-center text-[13px] text-[#86b69a]">
                  No questions in this window/filter.
                </li>
              ) : null}
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}

function maskEmail(email: string): string {
  const [u, d] = email.split("@");
  if (!u || !d) return email;
  return `${u.slice(0, 2)}${"•".repeat(Math.max(3, u.length - 2))}@${d}`;
}
