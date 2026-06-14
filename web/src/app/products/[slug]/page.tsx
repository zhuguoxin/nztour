import Link from "next/link";
import { notFound } from "next/navigation";
import { listOperatorsWithCourseCounts, listPublishedCourses } from "@/lib/db";
import { t, fmt } from "@/lib/i18n";
import { CourseCard } from "../../_components/course-card";
import { TopBar } from "../../_components/top-bar";

export const dynamic = "force-dynamic";

/**
 * Public product detail — a single operator (supplier) and its published
 * courses. Light theme matching the home page; the dark TopBar carries a
 * breadcrumb (Home / Products / <product>). Course cards link into the learner
 * reader and hide the operator name (we're already inside the product).
 */
export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [ops, all, tr] = await Promise.all([
    listOperatorsWithCourseCounts(),
    listPublishedCourses(),
    t(),
  ]);

  const op = ops.find((o) => o.slug === slug);
  if (!op) notFound();

  const courses = all.filter((c) => c.operator_slug === slug);

  const breadcrumb = (
    <span className="flex items-center gap-2 min-w-0">
      <Link href="/" className="hover:text-white">
        {tr.nav_home}
      </Link>
      <span className="text-white/20">/</span>
      <Link href="/products" className="hover:text-white">
        {tr.pr_title}
      </Link>
      <span className="text-white/20">/</span>
      <span className="text-white/80 truncate">{op.name}</span>
    </span>
  );

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased text-[16px]">
      <TopBar breadcrumb={breadcrumb} />

      {/* Product header */}
      <section className="px-5 sm:px-8 pt-12 sm:pt-16 pb-8 max-w-6xl mx-auto">
        <Link
          href="/products"
          className="inline-block text-[13px] text-emerald-700 hover:text-emerald-800 font-medium mb-6"
        >
          {tr.prd_back}
        </Link>
        <div className="flex items-start gap-4">
          <div className="text-[44px] leading-none">{op.emoji ?? "📚"}</div>
          <div className="min-w-0">
            <h1 className="text-[28px] sm:text-[38px] leading-tight font-semibold tracking-tight text-slate-900">
              {op.name}
            </h1>
            <div className="mt-2 text-[14px] text-slate-500">
              {fmt(tr.card_courses_count_plural, { n: op.course_count })}
            </div>
          </div>
        </div>
      </section>

      {/* Courses */}
      <section className="px-5 sm:px-8 pb-16 sm:pb-20 max-w-6xl mx-auto">
        <h2 className="text-[20px] sm:text-[24px] font-semibold text-slate-900 mb-5 sm:mb-7">
          {tr.prd_courses_heading}
        </h2>
        {courses.length === 0 ? (
          <div className="text-[15px] text-slate-500">{tr.prd_no_courses}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} tr={tr} showOperator={false} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
