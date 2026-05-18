import Link from "next/link";
import { listOperatorsWithCourseCounts } from "@/lib/db";
import { TopBar } from "./_components/top-bar";
import { AskAI } from "./_components/ask-ai";
import { t, fmt } from "@/lib/i18n";
import { getCurrentRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

/**
 * Dark-green tech palette. Tokens:
 *   --bg          #04241e  (page)
 *   --bg-soft     #062b22  (sticky header w/ blur)
 *   --panel       #0a3a2f  (card surface)
 *   --panel-hover #0e4738
 *   --line        rgba(255,255,255,.08)
 *   --line-hover  rgba(52,211,153,.4)
 *   --ink         #f0fdf4  (high-contrast text)
 *   --ink-muted   #a7d4b6
 *   --ink-faint   #6b9981
 *   --accent      #34d399 (emerald-400)
 *   --accent-deep #10b981
 *   --lime        #bef264
 */
export default async function Home() {
  const [operators, tr, role] = await Promise.all([
    listOperatorsWithCourseCounts(),
    t(),
    getCurrentRole(),
  ]);
  const totalCourses = operators.reduce((s, o) => s + o.course_count, 0);
  // Set of operator slugs the current user can manage (admins can manage any).
  const manageableSlugs = new Set(
    role.isAdmin
      ? operators.map((o) => o.slug)
      : role.operators.map((o) => o.operator_slug),
  );

  return (
    <div className="min-h-screen bg-[#04241e] text-[#f0fdf4] font-sans antialiased text-[16px]">
      <TopBar />

      {/* Hero with AI bar */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 -z-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(52,211,153,0.12) 0%, transparent 60%), radial-gradient(ellipse 50% 50% at 100% 30%, rgba(190,242,100,0.06) 0%, transparent 60%), radial-gradient(ellipse 50% 50% at 0% 80%, rgba(20,184,166,0.08) 0%, transparent 60%)",
          }}
        />
        <div className="relative px-5 sm:px-6 pt-16 sm:pt-24 pb-12 sm:pb-16 text-center max-w-4xl mx-auto">
          <div className="inline-flex flex-wrap items-center justify-center gap-2 mb-6 sm:mb-7">
            <span className="px-3 py-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/30 text-emerald-300 text-[12px] sm:text-[13px] font-medium">
              {fmt(tr.hero_live_chip, { operators: operators.length, courses: totalCourses })}
            </span>
            <span className="px-3 py-1.5 rounded-full bg-white/[.04] border border-white/[.08] text-[#c4e9d3] text-[12px] sm:text-[13px] font-medium">
              {tr.hero_lang_chip}
            </span>
          </div>
          <h1 className="text-[36px] sm:text-[48px] md:text-[64px] leading-[1.1] sm:leading-[1.05] font-semibold tracking-tight text-white">
            {tr.hero_title_a}{" "}
            <span className="bg-gradient-to-br from-emerald-300 via-emerald-400 to-lime-300 bg-clip-text text-transparent">
              {tr.hero_title_b}
            </span>
          </h1>
          <p className="mt-5 sm:mt-6 text-[15px] sm:text-[17px] md:text-[19px] text-[#a7d4b6] max-w-2xl mx-auto leading-relaxed">
            {tr.hero_subtitle}
          </p>

          {/* AI ask bar */}
          <div className="mt-9 sm:mt-12">
            <AskAI
              variant="hero"
              placeholder={tr.hero_ask_placeholder}
              examples={[tr.hero_example_1, tr.hero_example_2, tr.hero_example_3]}
            />
          </div>
        </div>
      </section>

      {/* Operator marketplace */}
      <section className="px-5 sm:px-8 pb-16 sm:pb-20 max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-5 sm:mb-7 gap-3">
          <div className="min-w-0">
            <h2 className="text-[20px] sm:text-[24px] font-semibold text-white">
              {tr.featured_operators}
            </h2>
            <p className="text-[13px] sm:text-[15px] text-[#a7d4b6] mt-1 sm:mt-1.5">
              {tr.featured_operators_subtitle}
            </p>
          </div>
          <a className="text-[13px] sm:text-[15px] text-emerald-300 hover:text-emerald-200 font-medium whitespace-nowrap shrink-0">
            {fmt(tr.view_all_count, { n: operators.length })}
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {operators.map((op) => (
            <OperatorCard
              key={op.id}
              op={op}
              tr={tr}
              canManage={manageableSlugs.has(op.slug)}
            />
          ))}
        </div>

        {/* Value props strip */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <ValueProp
            badge={tr.value_for_agents_badge}
            badgeClass="bg-emerald-400/10 text-emerald-300 border-emerald-400/30"
            text={tr.value_for_agents}
          />
          <ValueProp
            badge={tr.value_for_operators_badge}
            badgeClass="bg-lime-400/10 text-lime-300 border-lime-400/30"
            text={tr.value_for_operators}
          />
          <ValueProp
            badge={tr.value_ai_badge}
            badgeClass="bg-white/[.04] text-[#c4e9d3] border-white/[.10]"
            text={tr.value_ai}
          />
        </div>
      </section>

      <footer className="border-t border-white/[.06] px-8 py-7 text-center text-[12px] font-mono text-[#5d9279]">
        {fmt(tr.footer_build, { operators: operators.length, courses: totalCourses })}
      </footer>
    </div>
  );
}

// ============================================================================
//  Subcomponents
// ============================================================================

function OperatorCard({
  op,
  tr,
  canManage,
}: {
  op: Awaited<ReturnType<typeof listOperatorsWithCourseCounts>>[number];
  tr: Awaited<ReturnType<typeof t>>;
  canManage: boolean;
}) {
  const hasCourses = op.course_count > 0;
  const cover = op.cover_color ?? "linear-gradient(135deg,#475569 0%,#64748b 100%)";
  const coursesLabel =
    op.course_count === 1
      ? fmt(tr.card_courses_count, { n: op.course_count })
      : fmt(tr.card_courses_count_plural, { n: op.course_count });

  const targetHref =
    hasCourses && op.sample_course_slug
      ? `/learn/${op.slug}/${op.sample_course_slug}`
      : null;

  return (
    <article className="rounded-2xl overflow-hidden bg-[#0a3a2f] border border-white/[.08] hover:border-emerald-400/40 hover:shadow-[0_8px_32px_rgba(52,211,153,0.10)] transition h-full relative">
      <div className="h-32 relative" style={{ background: cover }}>
        <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5">
          {hasCourses ? (
            <span className="px-2.5 py-1 rounded-full bg-black/35 backdrop-blur-sm text-[11px] font-medium text-emerald-200 border border-white/15">
              {tr.card_live}
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full bg-black/35 backdrop-blur-sm text-[11px] font-medium text-white/80 border border-white/15">
              {tr.card_coming_soon}
            </span>
          )}
        </div>
        {canManage ? (
          <Link
            href={`/operator/${op.slug}`}
            className="absolute top-3.5 right-3.5 z-10 px-2.5 py-1 rounded-full bg-emerald-400 text-[#04241e] text-[11px] font-semibold hover:bg-emerald-300 shadow"
          >
            ⚙ Manage
          </Link>
        ) : null}
        <div className="absolute bottom-3.5 left-4 right-4 flex items-end justify-between">
          <div className="text-[36px] leading-none drop-shadow">{op.emoji ?? "📚"}</div>
        </div>
      </div>
      <div className="p-5">
        <div className="text-[13px] text-[#86b69a] mb-1">{op.name}</div>
        <div className="font-semibold text-[17px] text-white leading-snug line-clamp-2">
          {op.sample_course_title ?? tr.card_curriculum_coming_soon}
        </div>
        <div className="flex items-center gap-2.5 mt-3.5 text-[13px] text-[#86b69a]">
          <span>{coursesLabel}</span>
          {op.module_count > 0 ? (
            <>
              <span className="text-white/20">·</span>
              <span>{fmt(tr.card_modules_count, { n: op.module_count })}</span>
            </>
          ) : null}
          {op.est_minutes > 0 ? (
            <>
              <span className="text-white/20">·</span>
              <span>{fmt(tr.card_minutes, { n: op.est_minutes })}</span>
            </>
          ) : null}
        </div>
      </div>
      {/* Whole-card hit area: anchor positioned absolutely under the Manage
          pill so the pill stays clickable. Card uses z-stacking so the
          Manage button (z-10) sits above the link surface (z-0). */}
      {targetHref ? (
        <Link
          href={targetHref}
          aria-label={op.sample_course_title ?? op.name}
          className="absolute inset-0 z-0 cursor-pointer"
        />
      ) : null}
    </article>
  );
}

function ValueProp({
  badge,
  badgeClass,
  text,
}: {
  badge: string;
  badgeClass: string;
  text: string;
}) {
  return (
    <div>
      <span
        className={`inline-block px-2.5 py-1 rounded-full border text-[12px] font-medium mb-3 ${badgeClass}`}
      >
        {badge}
      </span>
      <p className="text-[15px] text-[#c4e9d3] leading-relaxed">{text}</p>
    </div>
  );
}

