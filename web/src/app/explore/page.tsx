import Link from "next/link";
import { listOperatorsWithCourseCounts, listPublishedCourses } from "@/lib/db";
import { TopBar } from "../_components/top-bar";
import { AskAI } from "../_components/ask-ai";
import { OperatorCard } from "../_components/operator-card";
import { t, fmt } from "@/lib/i18n";
import { ExploreSearch } from "./explore-search";

export const dynamic = "force-dynamic";

/**
 * Public "Explore" discovery page — light theme, mirrors the home page styling.
 * Combines the AI ask bar, a featured-products grid, and a searchable course
 * grid. No sign-in required; CourseCard links into /learn which gates itself.
 */
export default async function ExplorePage() {
  const [operators, courses, tr] = await Promise.all([
    listOperatorsWithCourseCounts(),
    listPublishedCourses(),
    t(),
  ]);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased text-[16px]">
      <TopBar />

      {/* Hero with AI ask bar */}
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
          <div className="inline-flex items-center justify-center mb-6 sm:mb-7">
            <span className="px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[12px] sm:text-[13px] font-medium tracking-wide font-mono">
              {tr.ex_label}
            </span>
          </div>
          <h1 className="text-[36px] sm:text-[48px] md:text-[64px] leading-[1.1] sm:leading-[1.05] font-semibold tracking-tight text-slate-900">
            {tr.ex_title}
          </h1>
          <p className="mt-5 sm:mt-6 text-[15px] sm:text-[17px] md:text-[19px] text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {tr.ex_subtitle}
          </p>

          <div className="mt-9 sm:mt-12">
            <AskAI
              variant="hero"
              placeholder={tr.hero_ask_placeholder}
              examples={[tr.hero_example_1, tr.hero_example_2, tr.hero_example_3]}
              askLabel={tr.hero_ask_button}
              thinkingText={tr.ai_thinking_inline}
              noAnswerWarning={tr.ai_no_answer_inline}
            />
          </div>
        </div>
      </section>

      {/* Featured products */}
      <section className="px-5 sm:px-8 pb-14 sm:pb-16 max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-5 sm:mb-7 gap-3">
          <div className="min-w-0">
            <h2 className="text-[20px] sm:text-[24px] font-semibold text-slate-900">
              {tr.ex_products_heading}
            </h2>
            <p className="text-[13px] sm:text-[15px] text-slate-600 mt-1 sm:mt-1.5">
              {tr.ex_products_sub}
            </p>
          </div>
          <Link
            href="/products"
            className="text-[13px] sm:text-[15px] text-emerald-700 hover:text-emerald-800 font-medium whitespace-nowrap shrink-0"
          >
            {tr.ex_view_all_products}
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {operators.slice(0, 6).map((op) => (
            <OperatorCard key={op.id} op={op} tr={tr} canManage={false} />
          ))}
        </div>
      </section>

      {/* All courses */}
      <section className="px-5 sm:px-8 pb-16 sm:pb-20 max-w-6xl mx-auto">
        <div className="mb-5 sm:mb-7">
          <h2 className="text-[20px] sm:text-[24px] font-semibold text-slate-900">
            {tr.ex_courses_heading}
          </h2>
          <p className="text-[13px] sm:text-[15px] text-slate-600 mt-1 sm:mt-1.5">
            {fmt(tr.ex_courses_sub, { n: courses.length, ops: operators.length })}
          </p>
        </div>

        <ExploreSearch courses={courses} />
      </section>
    </div>
  );
}
