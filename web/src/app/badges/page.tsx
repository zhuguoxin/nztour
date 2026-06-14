import Link from "next/link";
import { getBadgeStats, listRecentBadges } from "@/lib/db";
import { TopBar } from "../_components/top-bar";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function BadgesPage() {
  const [tr, stats, badges] = await Promise.all([
    t(),
    getBadgeStats(),
    listRecentBadges(24),
  ]);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased text-[16px]">
      <TopBar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 -z-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(16,185,129,0.08) 0%, transparent 60%), radial-gradient(ellipse 50% 50% at 100% 30%, rgba(132,204,22,0.05) 0%, transparent 60%), radial-gradient(ellipse 50% 50% at 0% 80%, rgba(20,184,166,0.05) 0%, transparent 60%)",
          }}
        />
        <div className="relative px-5 sm:px-6 pt-16 sm:pt-24 pb-12 sm:pb-16 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center justify-center gap-2 mb-6 sm:mb-7">
            <span className="px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[12px] sm:text-[13px] font-medium font-mono tracking-widest">
              {tr.bd_label}
            </span>
          </div>
          <h1 className="text-[36px] sm:text-[48px] md:text-[60px] leading-[1.1] sm:leading-[1.05] font-semibold tracking-tight text-slate-900">
            {tr.bd_title}
          </h1>
          <p className="mt-5 sm:mt-6 text-[15px] sm:text-[17px] md:text-[19px] text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {tr.bd_subtitle}
          </p>
          <div className="mt-9 sm:mt-11">
            <Link
              href="/explore"
              className="inline-flex items-center justify-center px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-[15px] sm:text-[16px] font-medium transition-colors"
            >
              {tr.bd_cta}
            </Link>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="px-5 sm:px-8 pb-12 sm:pb-16 max-w-5xl mx-auto">
        <div className="grid grid-cols-3 gap-3 sm:gap-5">
          <Kpi value={stats.total} label={tr.bd_stat_awarded} />
          <Kpi value={stats.learners} label={tr.bd_stat_learners} />
          <Kpi value={stats.courses} label={tr.bd_stat_courses} />
        </div>
      </section>

      {/* How to earn */}
      <section className="px-5 sm:px-8 pb-16 sm:pb-20 max-w-5xl mx-auto">
        <h2 className="text-[20px] sm:text-[24px] font-semibold text-slate-900 text-center mb-8 sm:mb-10">
          {tr.bd_how_heading}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          <Step n={1} title={tr.bd_how_1_t} body={tr.bd_how_1_b} />
          <Step n={2} title={tr.bd_how_2_t} body={tr.bd_how_2_b} />
          <Step n={3} title={tr.bd_how_3_t} body={tr.bd_how_3_b} />
        </div>
      </section>

      {/* Badge wall */}
      <section className="px-5 sm:px-8 pb-20 sm:pb-24 max-w-6xl mx-auto">
        <h2 className="text-[20px] sm:text-[24px] font-semibold text-slate-900 mb-5 sm:mb-7">
          {tr.bd_wall_heading}
        </h2>

        {badges.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center text-[15px] text-slate-500">
            {tr.bd_wall_empty}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {badges.map((b) => {
              const date = new Date(b.awarded_at * 1000)
                .toISOString()
                .slice(0, 10);
              return (
                <div
                  key={b.verify_code}
                  className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-col"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-[22px] leading-none shrink-0" aria-hidden>
                      🏅
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] text-slate-500">
                        <span className="text-slate-700 font-medium">
                          {b.learner_name ?? tr.bd_anon_learner}
                        </span>{" "}
                        {tr.bd_earned}
                      </p>
                      <p className="mt-1 text-[15px] font-semibold text-slate-900 leading-snug">
                        {b.course_title}
                      </p>
                      <p className="mt-0.5 text-[12.5px] text-slate-400">
                        {b.operator_name}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-slate-400">
                      {date}
                    </span>
                    <Link
                      href={`/verify/${b.verify_code}`}
                      className="text-[13px] font-medium text-emerald-700 hover:text-emerald-800 whitespace-nowrap"
                    >
                      {tr.bd_verify}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

// ============================================================================
//  Subcomponents
// ============================================================================

function Kpi({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 text-center">
      <div className="text-[28px] sm:text-[40px] font-semibold tracking-tight text-slate-900">
        {value}
      </div>
      <div className="mt-1 text-[12px] sm:text-[14px] text-slate-500">
        {label}
      </div>
    </div>
  );
}

function Step({
  n,
  title,
  body,
}: {
  n: number;
  title: string;
  body: string;
}) {
  return (
    <div className="text-center md:text-left">
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[16px] font-semibold mb-4">
        {n}
      </div>
      <h3 className="text-[16px] sm:text-[17px] font-semibold text-slate-900">
        {title}
      </h3>
      <p className="mt-1.5 text-[14px] text-slate-600 leading-relaxed">
        {body}
      </p>
    </div>
  );
}
