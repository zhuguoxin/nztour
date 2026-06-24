import Link from "next/link";
import { fmt } from "@/lib/i18n-shared";
import { fallbackCover } from "@/lib/cover";
import { mediaUrl } from "@/lib/media";
import type { Dict } from "@/lib/i18n";
import type { CourseWithOperator } from "@/lib/db";

/**
 * Public course card — used on /explore and /products/[slug]. Links straight
 * into the learner reader (which gates on sign-in). Shows the supplier name,
 * course title, optional summary, and reading time.
 */
export function CourseCard({
  course,
  tr,
  showOperator = true,
}: {
  course: CourseWithOperator;
  tr: Dict;
  showOperator?: boolean;
}) {
  const cover = course.cover_color ?? "linear-gradient(135deg,#475569 0%,#64748b 100%)";
  const coverImg = course.cover_r2_key
    ? mediaUrl(course.cover_r2_key)
    : fallbackCover(course.slug);
  return (
    <Link
      href={`/learn/${course.operator_slug}/${course.slug}`}
      className="group rounded-2xl overflow-hidden bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-[0_8px_32px_rgba(15,23,42,0.08)] transition flex flex-col"
    >
      <div className="aspect-[16/9] relative shrink-0 overflow-hidden" style={{ background: cover }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverImg}
          alt=""
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
      <div className="p-4 flex-1 flex flex-col">
        {showOperator ? (
          <div className="text-caption text-slate-500 mb-0.5 truncate">{course.operator_name}</div>
        ) : null}
        <div className="font-semibold text-body text-slate-900 leading-snug line-clamp-2">
          {course.title}
        </div>
        {course.summary ? (
          <p className="text-caption text-slate-500 mt-1 line-clamp-2 leading-relaxed">
            {course.summary}
          </p>
        ) : null}
        <div className="mt-auto pt-3 flex items-center gap-2 text-caption text-slate-500">
          {course.est_minutes ? <span>{fmt(tr.card_minutes, { n: course.est_minutes })}</span> : null}
          <span className="text-slate-900 font-medium group-hover:underline ml-auto">
            {tr.ex_start_course}
          </span>
        </div>
      </div>
    </Link>
  );
}
