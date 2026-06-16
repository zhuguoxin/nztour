import { notFound } from "next/navigation";
import Link from "next/link";
import { TopBar } from "../../_components/top-bar";
import { getCurrentRole, requireOperatorMembership } from "@/lib/roles";
import { db } from "@/lib/db";
import {
  getOperatorKPIs,
  listOperatorCourses,
  listRecentLearners,
  listTopQuestions,
  getDailyActivity,
} from "@/lib/operator-stats";
import { CreateCoursePanel } from "./create-course-panel";
import { VoicesModal } from "@/app/supplier/[slug]/voices-modal";
import { PageBreadcrumb } from "../../_components/page-breadcrumb";
import { OperatorSwitcher, type SwitcherOperator } from "./operator-switcher";
import { ActivityChart } from "./activity-chart";
import { t, fmt, type Dict } from "@/lib/i18n";
import { resolveTheme } from "@/lib/theme";
import { updateOperatorTheme, resetOperatorTheme } from "./branding-actions";
import { ColourField } from "./colour-field";
import { LogoUploader } from "./logo-uploader";
import { MediaPicker } from "../../_components/media-picker";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}

/** Parse a YYYY-MM-DD date into unix seconds. Returns null on bad input. */
function parseDateParam(s: string | undefined, endOfDay = false): number | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(s + (endOfDay ? "T23:59:59Z" : "T00:00:00Z"));
  const t = d.getTime();
  return Number.isFinite(t) ? Math.floor(t / 1000) : null;
}

export default async function OperatorDashboard({ params, searchParams }: Props) {
  const { slug } = await params;
  const { from: fromParam, to: toParam } = await searchParams;

  // Default window: last 30 days. Date pickers narrow it.
  const now = Math.floor(Date.now() / 1000);
  const defaultFrom = now - 30 * 86400;
  const fromTs = parseDateParam(fromParam) ?? defaultFrom;
  const toTs = parseDateParam(toParam, true) ?? now;
  const windowDays = Math.max(1, Math.round((toTs - fromTs) / 86400));

  // Auth + role gate. Admins can see any operator's console; operators only theirs.
  let access;
  try {
    access = await requireOperatorMembership(slug);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "not_found") notFound();
    if (msg === "forbidden") {
      return <NoAccess slug={slug} />;
    }
    throw err;
  }

  const operator = await db()
    .prepare(
      `SELECT o.id, o.slug, o.name, o.display_name, o.country,
              o.theme_bg, o.theme_panel, o.theme_accent, o.theme_ink, o.theme_logo_r2_key,
              o.cover_r2_key, s.slug AS supplier_slug
       FROM operators o LEFT JOIN suppliers s ON s.id = o.supplier_id
       WHERE o.slug = ?`,
    )
    .bind(slug)
    .first<{
      id: string;
      slug: string;
      name: string;
      display_name: string | null;
      country: string;
      theme_bg: string | null;
      theme_panel: string | null;
      theme_accent: string | null;
      theme_ink: string | null;
      theme_logo_r2_key: string | null;
      cover_r2_key: string | null;
      supplier_slug: string | null;
    }>();
  if (!operator) notFound();

  const [kpis, courses, learners, topQs, activity, role, tr] = await Promise.all([
    getOperatorKPIs(operator.id, { from: fromTs, to: toTs }),
    listOperatorCourses(operator.id),
    listRecentLearners(operator.id, 10),
    listTopQuestions(operator.id, 6),
    getDailyActivity(operator.id, Math.min(30, Math.max(7, windowDays))),
    getCurrentRole(),
    t(),
  ]);

  // Build the list of operators this user can switch to. Admins see all
  // active operators; non-admins see only their explicit memberships.
  let switcherOps: SwitcherOperator[] = [];
  if (role.isAdmin) {
    const { results } = await db()
      .prepare(`SELECT slug, name FROM operators WHERE status='active' ORDER BY name`)
      .all<{ slug: string; name: string }>();
    switcherOps = (results ?? []).map((r) => ({
      slug: r.slug,
      name: r.name,
      role: "platform-admin",
    }));
  } else {
    switcherOps = role.operators.map((o) => ({
      slug: o.operator_slug,
      name: o.operator_name,
      role: o.role,
    }));
  }

  // The back-office stays Libretour-branded (dark green) — the operator's
  // own theme only applies to the learner-facing /learn and /verify surfaces.
  // The Branding panel renders a live preview so the operator still sees
  // exactly what their theme looks like.
  return (
    <div className="min-h-screen font-sans antialiased text-[16px] bg-white text-slate-900">
      <TopBar />

      <main className="px-5 sm:px-8 py-8 sm:py-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-7 sm:mb-9 flex-wrap">
          <div className="min-w-0">
            <PageBreadcrumb
              className="mb-1.5"
              items={[
                { href: "/", label: tr.nav_home },
                ...(operator.supplier_slug
                  ? [{ href: `/supplier/${operator.supplier_slug}`, label: tr.bc_supplier }]
                  : []),
                { label: operator.name },
              ]}
            />
            <div className="text-[11px] tracking-widest font-mono text-emerald-700/70">
              {tr.op_d_chrome_label}
            </div>
            <div className="flex items-center flex-wrap gap-2 mt-1">
              <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-tight text-slate-900">
                {operator.display_name ?? operator.name}
              </h1>
              <OperatorSwitcher
                currentSlug={operator.slug}
                currentName={operator.name}
                operators={switcherOps}
                labels={{
                  switch: tr.op_d_switch,
                  panel_title: tr.op_d_switch_panel_title,
                  view_all: tr.op_d_switch_view_all,
                }}
              />
            </div>
            <p className="text-[13px] sm:text-[14px] text-slate-600 mt-1.5">{tr.op_d_blurb}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/product/${slug}/settings`}
              className="px-3 py-2 rounded-md border border-slate-300 text-slate-700 text-[13px] hover:bg-slate-50"
              title={tr.pp_heading}
            >
              ⚙ {tr.pp_nav_settings}
            </Link>
            {operator.supplier_slug ? (
              <VoicesModal
                supplierSlug={operator.supplier_slug}
                className="px-3 py-2 rounded-md border border-slate-300 text-slate-700 text-[13px] hover:bg-slate-50"
              >
                {tr.pd_voices_link}
              </VoicesModal>
            ) : null}
          </div>
        </div>

        {/* Date range + CSV export */}
        <DateRangeBar
          fromTs={fromTs}
          toTs={toTs}
          windowDays={windowDays}
          slug={slug}
          tr={tr}
        />

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <KpiCard
            label={tr.op_d_kpi_total_learners}
            value={kpis.total_learners.toLocaleString()}
            sub={fmt(tr.op_d_kpi_this_week, { n: kpis.learners_this_week })}
            tone="emerald"
          />
          <KpiCard
            label={tr.op_d_kpi_courses_published}
            value={kpis.courses_published.toString()}
            sub={
              kpis.courses_draft
                ? fmt(tr.op_d_kpi_drafts, { n: kpis.courses_draft })
                : tr.op_d_kpi_all_live
            }
            tone="default"
          />
          <KpiCard
            label={tr.op_d_kpi_badges_awarded}
            value={kpis.badges_awarded.toLocaleString()}
            sub={fmt(tr.op_d_kpi_completion, { pct: kpis.completion_rate_pct })}
            tone="lime"
          />
          <KpiCard
            label={tr.op_d_kpi_ai_questions}
            value={kpis.ai_questions_total.toLocaleString()}
            sub={fmt(tr.op_d_kpi_30d, { n: kpis.ai_questions_30d })}
            tone="emerald"
          />
          <KpiCard
            label={tr.pd_kpi_satisfaction}
            value={kpis.satisfaction_avg > 0 ? `${kpis.satisfaction_avg.toFixed(1)} ★` : "—"}
            sub={kpis.satisfaction_count > 0 ? fmt(tr.pd_kpi_ratings, { n: kpis.satisfaction_count }) : tr.pd_kpi_no_ratings}
            tone="default"
          />
        </div>

        {/* Two-column dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-5">
          {/* Left column: courses + learners */}
          <div className="space-y-5 min-w-0">
          {/* My courses */}
          <section className="rounded-2xl border border-slate-200 bg-white">
            <header className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3 flex-wrap">
              <div className="font-semibold text-[14px] text-slate-900">{tr.op_d_my_courses}</div>
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-slate-500">
                  {fmt(tr.op_d_total_count, { n: kpis.courses_published + kpis.courses_draft })}
                </span>
                <Link
                  href={`/product/${slug}/courses/new`}
                  className="px-3 py-1.5 rounded-md bg-emerald-600 text-white font-semibold text-[12.5px] hover:bg-emerald-700"
                >
                  + {tr.op_d_new_course}
                </Link>
              </div>
            </header>
            <div>
              {courses.length === 0 ? (
                <div className="px-5 py-8 text-center text-[13px] text-slate-500">
                  {tr.op_d_no_courses}
                </div>
              ) : (
                courses.map((c) => (
                  <div
                    key={c.id}
                    className="px-5 py-4 flex items-center gap-4 border-b border-slate-100 last:border-b-0"
                  >
                    <Link
                      href={`/product/${operator.slug}/courses/${c.slug}/edit`}
                      className="flex items-center gap-4 flex-1 min-w-0 group"
                      title={tr.op_d_action_edit}
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-[20px] shrink-0 overflow-hidden"
                        style={{ background: c.cover_color ?? "#1e293b" }}
                      >
                        {c.cover_r2_key ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={`/api/course-cover?id=${c.id}`}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          c.emoji ?? "📚"
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-[14px] text-slate-900 truncate group-hover:text-emerald-700">
                          {c.title}
                        </div>
                        <div className="text-[12px] text-slate-500">
                          {fmt(
                            c.modules === 1 ? tr.op_d_course_modules : tr.op_d_course_modules_plural,
                            { n: c.modules },
                          )}{" "}
                          ·{" "}
                          {fmt(tr.op_d_course_updated, { rel: fmtRelative(c.updated_at, tr) })}
                        </div>
                      </div>
                    </Link>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium tabular-nums shrink-0 ${
                        c.learners > 0
                          ? "bg-emerald-100 border border-emerald-200 text-emerald-700"
                          : "bg-slate-100 border border-slate-200 text-slate-500"
                      }`}
                      title={fmt(
                        c.learners === 1
                          ? tr.op_d_course_learners_tooltip
                          : tr.op_d_course_learners_tooltip_plural,
                        { n: c.learners },
                      )}
                    >
                      👁 {c.learners}
                    </span>
                    <StatusPill status={c.status} labels={{ published: tr.op_d_status_published, draft: tr.op_d_status_draft }} />
                    <Link
                      href={`/product/${operator.slug}/courses/${c.slug}/edit`}
                      className="px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 text-[12px] hover:bg-slate-50"
                    >
                      {tr.op_d_action_edit}
                    </Link>
                    {c.status === "published" ? (
                      <Link
                        href={`/learn/${operator.slug}/${c.slug}`}
                        className="px-3 py-1.5 rounded-md bg-slate-100 border border-slate-200 text-emerald-700 text-[12px] hover:bg-slate-100"
                      >
                        {tr.op_d_action_view}
                      </Link>
                    ) : null}
                  </div>
                ))
              )}
            </div>
            {/* Quick: upload a doc → AI-generate a course */}
            <div className="px-5 py-4 border-t border-slate-200 bg-slate-50/60 rounded-b-2xl">
              <div className="text-[12px] font-semibold text-slate-700 mb-0.5">{tr.op_d_upload_title}</div>
              <div className="text-[11.5px] text-slate-500 mb-2.5">{tr.op_d_upload_sub}</div>
              <CreateCoursePanel operatorSlug={operator.slug} bare />
            </div>
          </section>

          {/* Learners */}
          <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <header className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="font-semibold text-[14px] text-slate-900">{tr.op_d_learners_title}</div>
              <button
                disabled
                title={tr.op_d_learners_export_tooltip}
                className="px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 text-[12px] hover:bg-slate-50 disabled:opacity-50"
              >
                {tr.op_d_learners_export}
              </button>
            </header>
            {learners.length === 0 ? (
              <div className="px-5 py-10 text-center text-[13px] text-slate-500">
                {tr.op_d_learners_empty}
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-left">
                    <th className="px-5 py-3 text-[11px] tracking-widest font-mono text-slate-500">{tr.op_d_learners_th_learner}</th>
                    <th className="px-3 py-3 text-[11px] tracking-widest font-mono text-slate-500 hidden md:table-cell">{tr.op_d_learners_th_agency}</th>
                    <th className="px-3 py-3 text-[11px] tracking-widest font-mono text-slate-500 hidden md:table-cell">{tr.op_d_learners_th_course}</th>
                    <th className="px-3 py-3 text-[11px] tracking-widest font-mono text-slate-500">{tr.op_d_learners_th_progress}</th>
                    <th className="px-5 py-3 text-[11px] tracking-widest font-mono text-slate-500">{tr.op_d_learners_th_badge}</th>
                  </tr>
                </thead>
                <tbody>
                  {learners.map((l) => (
                    <tr key={`${l.user_id}_${l.course_id}`} className="border-t border-slate-100">
                      <td className="px-5 py-3 text-[13px] text-slate-900">{l.name ?? maskEmail(l.email)}</td>
                      <td className="px-3 py-3 text-[13px] text-slate-600 hidden md:table-cell">
                        {l.agency_name ?? <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-3 py-3 text-[13px] text-slate-600 hidden md:table-cell truncate max-w-[180px]">
                        {l.course_title}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-400 to-lime-300"
                              style={{ width: `${l.progress_pct}%` }}
                            />
                          </div>
                          <span className="text-[12px] text-slate-600 font-mono tabular-nums">
                            {l.progress_pct}%
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <BadgePill
                          status={l.badge_status}
                          labels={{
                            issued: tr.op_d_badge_issued,
                            pending: tr.op_d_badge_pending,
                            not_yet: tr.op_d_badge_not_yet,
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
          </div>

          {/* Right column: activity + top questions */}
          <div className="space-y-5 min-w-0">
          <ActivityChart
            points={activity}
            labels={{
              title: tr.op_d_activity_title,
              completions: tr.op_d_activity_completions,
              new_learners: tr.op_d_activity_new_learners,
              empty: tr.op_d_activity_empty,
            }}
          />
          {/* Top questions */}
          <section className="rounded-2xl border border-slate-200 bg-white">
            <header className="px-5 py-4 border-b border-slate-200">
              <div className="font-semibold text-[14px] text-slate-900">{tr.op_d_topqs_title}</div>
              <div className="text-[12px] text-slate-500 mt-0.5">
                {fmt(tr.op_d_topqs_sub, { n: kpis.ai_questions_30d })}
              </div>
            </header>
            <div className="p-5 space-y-3.5">
              {topQs.length === 0 ? (
                <div className="text-center text-[13px] text-slate-500 py-6">
                  {tr.op_d_topqs_empty}
                </div>
              ) : (
                topQs.map((q, i) => {
                  const tone =
                    q.source_kind === "rag"
                      ? "text-emerald-700"
                      : q.source_kind === "web"
                        ? "text-amber-600"
                        : q.source_kind === "no_answer"
                          ? "text-rose-600"
                          : "text-slate-600";
                  return (
                    <div key={i} className="flex items-start gap-3">
                      <div className={`text-[20px] font-bold w-7 tabular-nums ${tone}`}>{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] text-slate-900">"{q.question}"</div>
                        <div className={`text-[11px] mt-0.5 ${tone}`}>
                          {fmt(
                            q.asks === 1 ? tr.op_d_topqs_asks_one : tr.op_d_topqs_asks_plural,
                            { n: q.asks },
                          )}{" "}
                          ·{" "}
                          {sourceLabel(q.source_kind, {
                            rag: tr.op_d_topqs_source_rag,
                            web: tr.op_d_topqs_source_web,
                            none: tr.op_d_topqs_source_none,
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <button
                disabled
                title={tr.op_d_new_course_disabled}
                className="w-full mt-3 px-3 py-2 rounded-md border border-slate-300 text-slate-700 text-[12px] hover:bg-slate-50 disabled:opacity-50"
              >
                {tr.op_d_topqs_view_all}
              </button>
            </div>
          </section>
          </div>
        </div>

        {/* === Branding section === */}
        <BrandingPanel operator={operator} tr={tr} />
      </main>
    </div>
  );
}

function BrandingPanel({
  operator,
  tr,
}: {
  operator: {
    slug: string;
    theme_bg: string | null;
    theme_panel: string | null;
    theme_accent: string | null;
    theme_ink: string | null;
    theme_logo_r2_key: string | null;
    cover_r2_key: string | null;
    supplier_slug: string | null;
  };
  tr: Dict;
}) {
  const t = resolveTheme(operator);
  return (
    <section id="branding" className="scroll-mt-4 mt-8 rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <header className="px-5 py-4 border-b border-slate-200">
        <div className="font-semibold text-[14px] text-slate-900">{tr.br_title}</div>
        <div className="text-[12px] text-slate-500 mt-0.5">
          {tr.br_blurb}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-5 p-5">
        <form action={updateOperatorTheme} className="space-y-4">
          <input type="hidden" name="operator_slug" value={operator.slug} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ColourField
              name="theme_bg"
              label={tr.br_field_bg_label}
              hint={tr.br_field_bg_hint}
              swatchLabel={fmt(tr.br_colour_swatch, { label: tr.br_field_bg_label })}
              placeholder={tr.br_colour_placeholder}
              defaultValue={operator.theme_bg}
            />
            <ColourField
              name="theme_panel"
              label={tr.br_field_panel_label}
              hint={tr.br_field_panel_hint}
              swatchLabel={fmt(tr.br_colour_swatch, { label: tr.br_field_panel_label })}
              placeholder={tr.br_colour_placeholder}
              defaultValue={operator.theme_panel}
            />
            <ColourField
              name="theme_ink"
              label={tr.br_field_ink_label}
              hint={tr.br_field_ink_hint}
              swatchLabel={fmt(tr.br_colour_swatch, { label: tr.br_field_ink_label })}
              placeholder={tr.br_colour_placeholder}
              defaultValue={operator.theme_ink}
            />
            <ColourField
              name="theme_accent"
              label={tr.br_field_accent_label}
              hint={tr.br_field_accent_hint}
              swatchLabel={fmt(tr.br_colour_swatch, { label: tr.br_field_accent_label })}
              placeholder={tr.br_colour_placeholder}
              defaultValue={operator.theme_accent}
            />
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
            <div className="text-[11.5px] text-slate-500">
              {tr.br_save_hint}
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-emerald-600 text-white font-semibold text-[13px] hover:bg-emerald-700"
            >
              {tr.br_save}
            </button>
          </div>
        </form>

        {/* Live preview of the four tokens as a learner would see them */}
        <div className="rounded-xl overflow-hidden border border-slate-300" style={{ background: t.bg }}>
          <div className="px-3 py-2 text-[10px] font-mono tracking-widest" style={{ color: t.inkMuted }}>
            {tr.br_preview}
          </div>
          <div className="m-3 mt-0 rounded-lg p-3" style={{ background: t.panel }}>
            <div className="text-[13px] font-semibold" style={{ color: t.ink }}>
              {tr.br_preview_module_title}
            </div>
            <div className="text-[11px] mt-0.5" style={{ color: t.inkMuted }}>
              {tr.br_preview_module_sub}
            </div>
            <div className="h-1.5 rounded-full mt-2.5 overflow-hidden" style={{ background: "rgba(0,0,0,.3)" }}>
              <div className="h-full" style={{ width: "60%", background: t.accent }} />
            </div>
            <div
              className="mt-3 inline-block px-2.5 py-1 rounded-md text-[11px] font-semibold"
              style={{ background: t.accent, color: t.bg }}
            >
              {tr.br_preview_continue}
            </div>
          </div>
        </div>
      </div>

      {/* Product cover image — picked from the supplier media library. */}
      {operator.supplier_slug ? (
        <div className="px-5 pb-4 border-t border-slate-200 pt-4">
          <div className="text-[12px] font-semibold text-slate-900 mb-1">{tr.br_cover_title}</div>
          <div className="text-[12px] text-slate-500 mb-2.5">{tr.br_cover_blurb}</div>
          <div className="max-w-xs">
            <MediaPicker
              supplierSlug={operator.supplier_slug}
              target={{ target: "product", operatorSlug: operator.slug }}
              currentUrl={operator.cover_r2_key ? `/api/product-cover?slug=${encodeURIComponent(operator.slug)}` : null}
              aspect="video"
              theme="light"
            />
          </div>
        </div>
      ) : null}

      {/* Logo uploader + reset */}
      <div className="px-5 pb-5 flex items-center justify-between flex-wrap gap-3 border-t border-slate-200 pt-4">
        <LogoUploader
          operatorSlug={operator.slug}
          hasLogo={!!operator.theme_logo_r2_key}
          themeBg={t.bg}
        />
        <form action={resetOperatorTheme}>
          <input type="hidden" name="operator_slug" value={operator.slug} />
          <button
            type="submit"
            className="px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 text-[12px] hover:bg-slate-50"
          >
            {tr.br_reset}
          </button>
        </form>
      </div>
    </section>
  );
}

// ColourField moved to ./colour-field.tsx (client component) so the swatch
// and hex input stay synced — previously the picker's choice was silently
// dropped because the two inputs didn't share state.

// ============================================================================
//  Subcomponents
// ============================================================================

/**
 * Sticky date-range bar above the KPI grid. Three preset buttons + a
 * GET form with from/to date inputs. CSV export buttons live here too —
 * they hit /api/operator/learners.csv and /api/operator/qa.csv with the
 * current ?from=&to= preserved.
 */
function DateRangeBar({
  fromTs,
  toTs,
  windowDays,
  slug,
  tr,
}: {
  fromTs: number;
  toTs: number;
  windowDays: number;
  slug: string;
  tr: Dict;
}) {
  const fmtIso = (t: number) => new Date(t * 1000).toISOString().slice(0, 10);
  const fromIso = fmtIso(fromTs);
  const toIso = fmtIso(toTs);
  const todayIso = fmtIso(Math.floor(Date.now() / 1000));
  const presets: Array<{ label: string; days: number }> = [
    { label: tr.pd_preset_7d, days: 7 },
    { label: tr.pd_preset_30d, days: 30 },
    { label: tr.pd_preset_90d, days: 90 },
  ];
  return (
    <section className="rounded-xl border border-slate-200 bg-white px-4 py-3 mb-5 flex items-center gap-2 flex-wrap">
      <div className="text-[11px] tracking-widest font-mono text-emerald-700/70">{tr.pd_reporting_window}</div>
      <div className="font-mono text-[12.5px] text-slate-900">
        {fromIso} → {toIso}{" "}
        <span className="text-slate-500">({windowDays}d)</span>
      </div>

      <div className="flex items-center gap-1 ml-2">
        {presets.map((p) => {
          const fromD = new Date(Date.now() - p.days * 86400 * 1000);
          const params = new URLSearchParams({
            from: fromD.toISOString().slice(0, 10),
            to: todayIso,
          });
          return (
            <Link
              key={p.days}
              href={`/product/${slug}?${params.toString()}`}
              className="px-2 py-1 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 text-[11.5px]"
            >
              {p.label}
            </Link>
          );
        })}
      </div>

      <form action={`/product/${slug}`} className="flex items-center gap-1 ml-1">
        <input
          type="date"
          name="from"
          defaultValue={fromIso}
          max={todayIso}
          className="bg-white border border-slate-300 rounded px-2 py-1 text-[12px] text-slate-900"
        />
        <span className="text-slate-500">→</span>
        <input
          type="date"
          name="to"
          defaultValue={toIso}
          max={todayIso}
          className="bg-white border border-slate-300 rounded px-2 py-1 text-[12px] text-slate-900"
        />
        <button
          type="submit"
          className="px-2.5 py-1 rounded bg-emerald-600 text-white font-semibold text-[12px] hover:bg-emerald-700"
        >
          {tr.pd_apply}
        </button>
      </form>

      <div className="ml-auto flex items-center gap-2">
        <a
          href={`/api/operator/learners.csv?slug=${encodeURIComponent(slug)}&from=${fromIso}&to=${toIso}`}
          className="px-2.5 py-1 rounded border border-slate-300 text-emerald-700 hover:bg-slate-50 text-[12px]"
          title={tr.pd_learners_csv_tooltip}
        >
          {tr.pd_learners_csv}
        </a>
        <Link
          href={`/product/${slug}/qa?from=${fromIso}&to=${toIso}`}
          className="px-2.5 py-1 rounded border border-slate-300 text-emerald-700 hover:bg-slate-50 text-[12px]"
        >
          {tr.pd_qa_archive}
        </Link>
      </div>
    </section>
  );
}

function KpiCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone: "emerald" | "lime" | "default";
}) {
  const subColor =
    tone === "emerald" ? "text-emerald-700" : tone === "lime" ? "text-lime-700" : "text-slate-600";
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="text-[11px] tracking-widest font-mono text-slate-500">{label.toUpperCase()}</div>
      <div className="text-[26px] sm:text-[28px] font-semibold text-slate-900 mt-1.5 tabular-nums">{value}</div>
      <div className={`text-[12px] mt-1 ${subColor}`}>{sub}</div>
    </div>
  );
}

function StatusPill({
  status,
  labels,
}: {
  status: string;
  labels: { published: string; draft: string };
}) {
  if (status === "published") {
    return (
      <span className="px-2 py-0.5 rounded-full bg-lime-100 border border-lime-200 text-lime-700 text-[11px] font-medium">
        {labels.published}
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 rounded-full bg-amber-100 border border-amber-200 text-amber-700 text-[11px] font-medium">
      {labels.draft}
    </span>
  );
}

function BadgePill({
  status,
  labels,
}: {
  status: "issued" | "pending" | "not_yet";
  labels: { issued: string; pending: string; not_yet: string };
}) {
  if (status === "issued") {
    return (
      <span className="px-2 py-0.5 rounded-full bg-lime-100 border border-lime-200 text-lime-700 text-[11px] font-medium">
        {labels.issued}
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="px-2 py-0.5 rounded-full bg-amber-100 border border-amber-200 text-amber-700 text-[11px] font-medium">
        {labels.pending}
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-500 text-[11px] font-medium">
      {labels.not_yet}
    </span>
  );
}

async function NoAccess({ slug }: { slug: string }) {
  const tr = await t();
  const [before, after] = tr.op_d_403_body.split("{slug}");
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <div className="text-[11px] tracking-widest font-mono text-rose-600 mb-2">
          {tr.op_d_403_label}
        </div>
        <h1 className="text-[24px] font-semibold text-slate-900">{tr.op_d_403_title}</h1>
        <p className="mt-3 text-[14px] text-slate-600">
          {before}
          <code className="font-mono text-emerald-700">{slug}</code>
          {after}
        </p>
        <Link
          href="/"
          className="mt-6 inline-block px-4 py-2 rounded-md border border-slate-300 text-[14px] text-slate-700 hover:bg-slate-50"
        >
          {tr.op_d_403_home}
        </Link>
      </div>
    </div>
  );
}

function maskEmail(email: string): string {
  const [u, d] = email.split("@");
  if (!u || !d) return email;
  const head = u.slice(0, 2);
  return `${head}${"•".repeat(Math.max(3, u.length - 2))}@${d}`;
}

function sourceLabel(kind: string, labels: { rag: string; web: string; none: string }): string {
  switch (kind) {
    case "rag":
      return labels.rag;
    case "web":
      return labels.web;
    case "no_answer":
      return labels.none;
    default:
      return kind;
  }
}

function fmtRelative(unix: number, tr: Dict): string {
  const now = Date.now() / 1000;
  const diff = now - unix;
  if (diff < 60) return tr.pd_rel_just_now;
  if (diff < 3600) return fmt(tr.pd_rel_m_ago, { n: Math.floor(diff / 60) });
  if (diff < 86400) return fmt(tr.pd_rel_h_ago, { n: Math.floor(diff / 3600) });
  if (diff < 86400 * 30) return fmt(tr.pd_rel_d_ago, { n: Math.floor(diff / 86400) });
  return fmt(tr.pd_rel_mo_ago, { n: Math.floor(diff / (86400 * 30)) });
}
