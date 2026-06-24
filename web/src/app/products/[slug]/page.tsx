import Link from "next/link";
import { notFound } from "next/navigation";
import { listOperatorsWithCourseCounts, listPublishedCourses, db } from "@/lib/db";
import { t, fmt } from "@/lib/i18n";
import { fallbackCover } from "@/lib/cover";
import { mediaUrl } from "@/lib/media";
import { auth } from "@clerk/nextjs/server";
import { CourseCard } from "../../_components/course-card";
import { TopBar } from "../../_components/top-bar";
import { Delisted } from "../../_components/delisted";

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
  if (!op) {
    // Not in the public list. If it exists but its supplier is disabled, a
    // learner with history here gets a "delisted" notice; otherwise 404.
    const dl = await db()
      .prepare(
        `SELECT o.id FROM operators o
         LEFT JOIN suppliers s ON s.id = o.supplier_id
         WHERE o.slug = ? AND s.status = 'suspended'`,
      )
      .bind(slug)
      .first<{ id: string }>();
    if (dl) {
      const { userId: uid } = await auth();
      let hasHistory = false;
      if (uid) {
        const h = await db()
          .prepare(
            `SELECT 1 AS x FROM enrollments e JOIN courses c ON c.id = e.course_id
               WHERE e.user_id = ? AND c.operator_id = ?
             UNION SELECT 1 FROM badges b WHERE b.user_id = ? AND b.operator_id = ? LIMIT 1`,
          )
          .bind(uid, dl.id, uid, dl.id)
          .first<{ x: number }>();
        hasHistory = !!h;
      }
      if (hasHistory) return <Delisted message={tr.delisted_product} backLabel={tr.delisted_back} />;
    }
    notFound();
  }

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
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased text-body">
      <TopBar breadcrumb={breadcrumb} />

      {/* Product header */}
      <section className="px-5 sm:px-8 pt-12 sm:pt-16 pb-8 max-w-[1300px] mx-auto">
        <Link
          href="/products"
          className="inline-block text-small text-slate-900 hover:text-slate-900 font-medium mb-6"
        >
          {tr.prd_back}
        </Link>
        <div className="relative h-44 sm:h-60 rounded-2xl overflow-hidden border border-slate-200 mb-6 bg-slate-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={
              op.cover_r2_key
                ? mediaUrl(op.cover_r2_key)
                : (op.cover_image_url ?? fallbackCover(op.slug))
            }
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
        <div className="flex items-start gap-4">
          <div className="min-w-0">
            <h1 className="text-h1 sm:text-display leading-tight font-semibold tracking-tight text-slate-900">
              {op.name}
            </h1>
            <div className="mt-2 text-small text-slate-500">
              {fmt(tr.card_courses_count_plural, { n: op.course_count })}
            </div>
            {op.intro ? (
              <p className="mt-3 text-body text-slate-700 leading-relaxed max-w-2xl">{op.intro}</p>
            ) : null}
            {op.website ? (
              <a
                href={op.website}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-block mt-2 text-small text-slate-900 hover:underline"
              >
                {op.website.replace(/^https?:\/\//, "")}
              </a>
            ) : null}
          </div>
        </div>
      </section>

      {/* Courses */}
      <section className="px-5 sm:px-8 pb-16 sm:pb-20 max-w-[1300px] mx-auto">
        <h2 className="text-h3 sm:text-h2 font-semibold text-slate-900 mb-5 sm:mb-7">
          {tr.prd_courses_heading}
        </h2>
        {courses.length === 0 ? (
          <div className="text-body text-slate-500">{tr.prd_no_courses}</div>
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
