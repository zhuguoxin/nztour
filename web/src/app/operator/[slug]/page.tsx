import { notFound } from "next/navigation";
import Link from "next/link";
import { TopBar } from "../../_components/top-bar";
import { requireOperatorMembership } from "@/lib/roles";
import { db } from "@/lib/db";
import {
  getOperatorKPIs,
  listOperatorCourses,
  listRecentLearners,
  listTopQuestions,
} from "@/lib/operator-stats";
import { UploadStub } from "./upload-stub";

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

  const [kpis, courses, learners, topQs] = await Promise.all([
    getOperatorKPIs(operator.id),
    listOperatorCourses(operator.id),
    listRecentLearners(operator.id, 10),
    listTopQuestions(operator.id, 6),
  ]);

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
                viewing as admin
              </span>
            ) : null}
          </span>
        }
      />

      <main className="px-5 sm:px-8 py-8 sm:py-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-7 sm:mb-9 flex-wrap">
          <div>
            <div className="text-[11px] tracking-widest font-mono text-emerald-300/70">/OPERATOR</div>
            <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-tight text-white mt-1">
              {operator.display_name ?? operator.name}
            </h1>
            <p className="text-[13px] sm:text-[14px] text-[#a7d4b6] mt-1.5">
              Manage your courses, watch what agents are learning, and see the questions they're
              asking — all in one place.
            </p>
          </div>
          <button
            disabled
            title="Course CRUD lands in v0.2"
            className="px-4 py-2 rounded-md bg-emerald-400 text-[#04241e] font-semibold text-[13px] hover:bg-emerald-300 disabled:opacity-60"
          >
            + New course
          </button>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KpiCard
            label="Total learners"
            value={kpis.total_learners.toLocaleString()}
            sub={`+${kpis.learners_this_week} this week`}
            tone="emerald"
          />
          <KpiCard
            label="Courses published"
            value={kpis.courses_published.toString()}
            sub={kpis.courses_draft ? `${kpis.courses_draft} draft` : "all live"}
            tone="default"
          />
          <KpiCard
            label="Badges awarded"
            value={kpis.badges_awarded.toLocaleString()}
            sub={`${kpis.completion_rate_pct}% completion`}
            tone="lime"
          />
          <KpiCard
            label="AI questions"
            value={kpis.ai_questions_total.toLocaleString()}
            sub={`${kpis.ai_questions_30d} in last 30d`}
            tone="emerald"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5 mb-8">
          {/* My courses */}
          <section className="rounded-2xl border border-white/[.08] bg-[#0a3a2f]">
            <header className="px-5 py-4 border-b border-white/[.06] flex items-center justify-between">
              <div className="font-semibold text-[14px] text-white">My courses</div>
              <span className="text-[12px] text-[#86b69a]">
                {kpis.courses_published + kpis.courses_draft} total
              </span>
            </header>
            <div>
              {courses.length === 0 ? (
                <div className="px-5 py-8 text-center text-[13px] text-[#86b69a]">
                  No courses yet.
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
                        {c.modules} module{c.modules === 1 ? "" : "s"} · updated{" "}
                        {fmtRelative(c.updated_at)}
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium tabular-nums shrink-0 ${
                        c.learners > 0
                          ? "bg-emerald-400/10 border border-emerald-400/30 text-emerald-200"
                          : "bg-white/[.04] border border-white/[.08] text-[#86b69a]"
                      }`}
                      title={`${c.learners} learner${c.learners === 1 ? "" : "s"} have started this course`}
                    >
                      👁 {c.learners}
                    </span>
                    <StatusPill status={c.status} />
                    <button
                      disabled
                      className="px-3 py-1.5 rounded-md border border-white/[.10] text-[#d8f0e1] text-[12px] hover:bg-white/[.06] disabled:opacity-50"
                      title="Course editor lands in v0.2"
                    >
                      Edit
                    </button>
                    {c.status === "published" ? (
                      <Link
                        href={`/learn/${operator.slug}/${c.slug}`}
                        className="px-3 py-1.5 rounded-md bg-white/[.04] border border-white/[.08] text-emerald-300 text-[12px] hover:bg-white/[.08]"
                      >
                        View
                      </Link>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Upload zone */}
          <UploadStub />
        </div>

        {/* Learners + Top questions */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5">
          <section className="rounded-2xl border border-white/[.08] bg-[#0a3a2f] overflow-hidden">
            <header className="px-5 py-4 border-b border-white/[.06] flex items-center justify-between">
              <div className="font-semibold text-[14px] text-white">Recent learner progress</div>
              <button
                disabled
                title="CSV export lands in v0.2"
                className="px-3 py-1.5 rounded-md border border-white/[.10] text-[#d8f0e1] text-[12px] hover:bg-white/[.06] disabled:opacity-50"
              >
                Export CSV
              </button>
            </header>
            {learners.length === 0 ? (
              <div className="px-5 py-10 text-center text-[13px] text-[#86b69a]">
                No learners yet — share your course link with agents to get the first enrollments.
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-left">
                    <th className="px-5 py-3 text-[11px] tracking-widest font-mono text-[#86b69a]">Learner</th>
                    <th className="px-3 py-3 text-[11px] tracking-widest font-mono text-[#86b69a] hidden md:table-cell">Agency</th>
                    <th className="px-3 py-3 text-[11px] tracking-widest font-mono text-[#86b69a] hidden md:table-cell">Course</th>
                    <th className="px-3 py-3 text-[11px] tracking-widest font-mono text-[#86b69a]">Progress</th>
                    <th className="px-5 py-3 text-[11px] tracking-widest font-mono text-[#86b69a]">Badge</th>
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
                        <BadgePill status={l.badge_status} />
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
              <div className="font-semibold text-[14px] text-white">Top questions agents ask</div>
              <div className="text-[12px] text-[#86b69a] mt-0.5">
                Last 30 days · {kpis.ai_questions_30d} queries
              </div>
            </header>
            <div className="p-5 space-y-3.5">
              {topQs.length === 0 ? (
                <div className="text-center text-[13px] text-[#86b69a] py-6">
                  No questions yet. Share the AI assistant with agents to start gathering insights.
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
                          {q.asks} ask{q.asks === 1 ? "" : "s"} ·{" "}
                          {sourceLabel(q.source_kind)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <button
                disabled
                title="Content-gap deep-dive lands in v0.2"
                className="w-full mt-3 px-3 py-2 rounded-md border border-white/[.10] text-[#d8f0e1] text-[12px] hover:bg-white/[.06] disabled:opacity-50"
              >
                View all questions →
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

function StatusPill({ status }: { status: string }) {
  if (status === "published") {
    return (
      <span className="px-2 py-0.5 rounded-full bg-lime-300/10 border border-lime-300/30 text-lime-300 text-[11px] font-medium">
        Published
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 rounded-full bg-amber-300/10 border border-amber-300/30 text-amber-300 text-[11px] font-medium">
      Draft
    </span>
  );
}

function BadgePill({ status }: { status: "issued" | "pending" | "not_yet" }) {
  if (status === "issued") {
    return (
      <span className="px-2 py-0.5 rounded-full bg-lime-300/10 border border-lime-300/30 text-lime-300 text-[11px] font-medium">
        Issued
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="px-2 py-0.5 rounded-full bg-amber-300/10 border border-amber-300/30 text-amber-300 text-[11px] font-medium">
        Pending
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 rounded-full bg-white/[.04] border border-white/[.08] text-[#a7d4b6] text-[11px] font-medium">
      Not yet
    </span>
  );
}

function NoAccess({ slug }: { slug: string }) {
  return (
    <div className="min-h-screen bg-[#04241e] text-[#f0fdf4] font-sans antialiased flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <div className="text-[11px] tracking-widest font-mono text-rose-300 mb-2">403</div>
        <h1 className="text-[24px] font-semibold text-white">No operator access</h1>
        <p className="mt-3 text-[14px] text-[#a7d4b6]">
          You don't have permission to manage <code className="font-mono text-emerald-300">{slug}</code>.
          Ask the platform admin to grant you operator membership.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block px-4 py-2 rounded-md border border-white/[.10] text-[14px] text-[#d8f0e1] hover:bg-white/[.06]"
        >
          ← Home
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

function sourceLabel(kind: string): string {
  switch (kind) {
    case "rag":
      return "✓ answered from your content";
    case "web":
      return "⚠ fell back to web — consider adding to course";
    case "no_answer":
      return "✗ no answer found — content gap";
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
