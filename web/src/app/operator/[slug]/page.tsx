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
} from "@/lib/operator-stats";
import { UploadStub } from "./upload-stub";
import { OperatorSwitcher, type SwitcherOperator } from "./operator-switcher";
import { t, fmt } from "@/lib/i18n";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function OperatorDashboard({ params }: Props) {
  const { slug } = await params;

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
    .prepare(`SELECT id, slug, name, display_name, country FROM operators WHERE slug = ?`)
    .bind(slug)
    .first<{ id: string; slug: string; name: string; display_name: string | null; country: string }>();
  if (!operator) notFound();

  const [kpis, courses, learners, topQs, role, tr] = await Promise.all([
    getOperatorKPIs(operator.id),
    listOperatorCourses(operator.id),
    listRecentLearners(operator.id, 10),
    listTopQuestions(operator.id, 6),
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

  return (
    <div className="min-h-screen bg-[#04241e] text-[#f0fdf4] font-sans antialiased text-[16px]">
      <TopBar
        breadcrumb={
          <span className="flex items-center gap-2">
            <Link href="/" className="hover:text-white">Home</Link>
            <span className="text-white/20">/</span>
            <span className="text-white">Operator · {operator.name}</span>
            {access.isAdmin ? (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-lime-300/10 border border-lime-300/30 text-lime-300 text-[11px] font-medium">
                {tr.op_d_view_as_admin}
              </span>
            ) : null}
          </span>
        }
      />

      <main className="px-5 sm:px-8 py-8 sm:py-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-7 sm:mb-9 flex-wrap">
          <div className="min-w-0">
            <div className="text-[11px] tracking-widest font-mono text-emerald-300/70">
              {tr.op_d_chrome_label}
            </div>
            <div className="flex items-center flex-wrap gap-2 mt-1">
              <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-tight text-white">
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
            <p className="text-[13px] sm:text-[14px] text-[#a7d4b6] mt-1.5">{tr.op_d_blurb}</p>
          </div>
          <button
            disabled
            title={tr.op_d_new_course_disabled}
            className="px-4 py-2 rounded-md bg-emerald-400 text-[#04241e] font-semibold text-[13px] hover:bg-emerald-300 disabled:opacity-60"
          >
            {tr.op_d_new_course}
          </button>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5 mb-8">
          {/* My courses */}
          <section className="rounded-2xl border border-white/[.08] bg-[#0a3a2f]">
            <header className="px-5 py-4 border-b border-white/[.06] flex items-center justify-between">
              <div className="font-semibold text-[14px] text-white">{tr.op_d_my_courses}</div>
              <span className="text-[12px] text-[#86b69a]">
                {fmt(tr.op_d_total_count, { n: kpis.courses_published + kpis.courses_draft })}
              </span>
            </header>
            <div>
              {courses.length === 0 ? (
                <div className="px-5 py-8 text-center text-[13px] text-[#86b69a]">
                  {tr.op_d_no_courses}
                </div>
              ) : (
                courses.map((c) => (
                  <div
                    key={c.id}
                    className="px-5 py-4 flex items-center gap-4 border-b border-white/[.04] last:border-b-0"
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-[20px] shrink-0"
                      style={{ background: c.cover_color ?? "#1e293b" }}
                    >
                      {c.emoji ?? "📚"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-[14px] text-white truncate">{c.title}</div>
                      <div className="text-[12px] text-[#86b69a]">
                        {fmt(
                          c.modules === 1 ? tr.op_d_course_modules : tr.op_d_course_modules_plural,
                          { n: c.modules },
                        )}{" "}
                        ·{" "}
                        {fmt(tr.op_d_course_updated, { rel: fmtRelative(c.updated_at) })}
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium tabular-nums shrink-0 ${
                        c.learners > 0
                          ? "bg-emerald-400/10 border border-emerald-400/30 text-emerald-200"
                          : "bg-white/[.04] border border-white/[.08] text-[#86b69a]"
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
                    <button
                      disabled
                      className="px-3 py-1.5 rounded-md border border-white/[.10] text-[#d8f0e1] text-[12px] hover:bg-white/[.06] disabled:opacity-50"
                      title={tr.op_d_new_course_disabled}
                    >
                      {tr.op_d_action_edit}
                    </button>
                    {c.status === "published" ? (
                      <Link
                        href={`/learn/${operator.slug}/${c.slug}`}
                        className="px-3 py-1.5 rounded-md bg-white/[.04] border border-white/[.08] text-emerald-300 text-[12px] hover:bg-white/[.08]"
                      >
                        {tr.op_d_action_view}
                      </Link>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Upload zone */}
          <UploadStub
            labels={{
              title: tr.op_d_upload_title,
              sub: tr.op_d_upload_sub,
              dropzone_a: tr.op_d_upload_dropzone_a,
              dropzone_b: tr.op_d_upload_dropzone_b,
              dropzone_blurb: tr.op_d_upload_dropzone_blurb,
              alert: tr.op_d_upload_alert,
              state_pdf_done: tr.op_d_upload_state_pdf_done,
              state_pptx_done: tr.op_d_upload_state_pptx_done,
              state_video_done: tr.op_d_upload_state_video_done,
              state_pptx_progress: tr.op_d_upload_state_pptx_progress,
              state_video_progress: tr.op_d_upload_state_video_progress,
              state_pdf_progress: tr.op_d_upload_state_pdf_progress,
              done_chip: tr.op_d_upload_state_done_chip,
            }}
          />
        </div>

        {/* Learners + Top questions */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5">
          <section className="rounded-2xl border border-white/[.08] bg-[#0a3a2f] overflow-hidden">
            <header className="px-5 py-4 border-b border-white/[.06] flex items-center justify-between">
              <div className="font-semibold text-[14px] text-white">{tr.op_d_learners_title}</div>
              <button
                disabled
                title={tr.op_d_learners_export_tooltip}
                className="px-3 py-1.5 rounded-md border border-white/[.10] text-[#d8f0e1] text-[12px] hover:bg-white/[.06] disabled:opacity-50"
              >
                {tr.op_d_learners_export}
              </button>
            </header>
            {learners.length === 0 ? (
              <div className="px-5 py-10 text-center text-[13px] text-[#86b69a]">
                {tr.op_d_learners_empty}
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-left">
                    <th className="px-5 py-3 text-[11px] tracking-widest font-mono text-[#86b69a]">{tr.op_d_learners_th_learner}</th>
                    <th className="px-3 py-3 text-[11px] tracking-widest font-mono text-[#86b69a] hidden md:table-cell">{tr.op_d_learners_th_agency}</th>
                    <th className="px-3 py-3 text-[11px] tracking-widest font-mono text-[#86b69a] hidden md:table-cell">{tr.op_d_learners_th_course}</th>
                    <th className="px-3 py-3 text-[11px] tracking-widest font-mono text-[#86b69a]">{tr.op_d_learners_th_progress}</th>
                    <th className="px-5 py-3 text-[11px] tracking-widest font-mono text-[#86b69a]">{tr.op_d_learners_th_badge}</th>
                  </tr>
                </thead>
                <tbody>
                  {learners.map((l) => (
                    <tr key={`${l.user_id}_${l.course_id}`} className="border-t border-white/[.04]">
                      <td className="px-5 py-3 text-[13px] text-white">{l.name ?? maskEmail(l.email)}</td>
                      <td className="px-3 py-3 text-[13px] text-[#a7d4b6] hidden md:table-cell">
                        {l.agency_name ?? <span className="text-[#5d9279]">—</span>}
                      </td>
                      <td className="px-3 py-3 text-[13px] text-[#a7d4b6] hidden md:table-cell truncate max-w-[180px]">
                        {l.course_title}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-1.5 bg-black/30 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-400 to-lime-300"
                              style={{ width: `${l.progress_pct}%` }}
                            />
                          </div>
                          <span className="text-[12px] text-[#a7d4b6] font-mono tabular-nums">
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

          {/* Top questions */}
          <section className="rounded-2xl border border-white/[.08] bg-[#0a3a2f]">
            <header className="px-5 py-4 border-b border-white/[.06]">
              <div className="font-semibold text-[14px] text-white">{tr.op_d_topqs_title}</div>
              <div className="text-[12px] text-[#86b69a] mt-0.5">
                {fmt(tr.op_d_topqs_sub, { n: kpis.ai_questions_30d })}
              </div>
            </header>
            <div className="p-5 space-y-3.5">
              {topQs.length === 0 ? (
                <div className="text-center text-[13px] text-[#86b69a] py-6">
                  {tr.op_d_topqs_empty}
                </div>
              ) : (
                topQs.map((q, i) => {
                  const tone =
                    q.source_kind === "rag"
                      ? "text-emerald-300"
                      : q.source_kind === "web"
                        ? "text-amber-300"
                        : q.source_kind === "no_answer"
                          ? "text-rose-300"
                          : "text-[#a7d4b6]";
                  return (
                    <div key={i} className="flex items-start gap-3">
                      <div className={`text-[20px] font-bold w-7 tabular-nums ${tone}`}>{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] text-white">"{q.question}"</div>
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
                className="w-full mt-3 px-3 py-2 rounded-md border border-white/[.10] text-[#d8f0e1] text-[12px] hover:bg-white/[.06] disabled:opacity-50"
              >
                {tr.op_d_topqs_view_all}
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

// ============================================================================
//  Subcomponents
// ============================================================================

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
    tone === "emerald" ? "text-emerald-300" : tone === "lime" ? "text-lime-300" : "text-[#a7d4b6]";
  return (
    <div className="rounded-2xl border border-white/[.08] bg-[#0a3a2f] p-4 sm:p-5">
      <div className="text-[11px] tracking-widest font-mono text-[#86b69a]">{label.toUpperCase()}</div>
      <div className="text-[26px] sm:text-[28px] font-semibold text-white mt-1.5 tabular-nums">{value}</div>
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
      <span className="px-2 py-0.5 rounded-full bg-lime-300/10 border border-lime-300/30 text-lime-300 text-[11px] font-medium">
        {labels.published}
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 rounded-full bg-amber-300/10 border border-amber-300/30 text-amber-300 text-[11px] font-medium">
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
      <span className="px-2 py-0.5 rounded-full bg-lime-300/10 border border-lime-300/30 text-lime-300 text-[11px] font-medium">
        {labels.issued}
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="px-2 py-0.5 rounded-full bg-amber-300/10 border border-amber-300/30 text-amber-300 text-[11px] font-medium">
        {labels.pending}
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 rounded-full bg-white/[.04] border border-white/[.08] text-[#a7d4b6] text-[11px] font-medium">
      {labels.not_yet}
    </span>
  );
}

async function NoAccess({ slug }: { slug: string }) {
  const tr = await t();
  const [before, after] = tr.op_d_403_body.split("{slug}");
  return (
    <div className="min-h-screen bg-[#04241e] text-[#f0fdf4] font-sans antialiased flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <div className="text-[11px] tracking-widest font-mono text-rose-300 mb-2">
          {tr.op_d_403_label}
        </div>
        <h1 className="text-[24px] font-semibold text-white">{tr.op_d_403_title}</h1>
        <p className="mt-3 text-[14px] text-[#a7d4b6]">
          {before}
          <code className="font-mono text-emerald-300">{slug}</code>
          {after}
        </p>
        <Link
          href="/"
          className="mt-6 inline-block px-4 py-2 rounded-md border border-white/[.10] text-[14px] text-[#d8f0e1] hover:bg-white/[.06]"
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

function fmtRelative(unix: number): string {
  const now = Date.now() / 1000;
  const diff = now - unix;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)}d ago`;
  return `${Math.floor(diff / (86400 * 30))}mo ago`;
}
