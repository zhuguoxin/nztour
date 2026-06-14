import Link from "next/link";
import { fmt } from "@/lib/i18n-shared";
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
  return (
    <Link
      href={`/learn/${course.operator_slug}/${course.slug}`}
      className="group rounded-2xl overflow-hidden bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-[0_8px_32px_rgba(15,23,42,0.08)] transition flex flex-col"
    >
      <div className="h-24 relative shrink-0" style={{ background: cover }}>
        <div className="absolute bottom-3 left-4 text-[30px] leading-none drop-shadow">
          {course.emoji ?? "📘"}
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        {showOperator ? (
          <div className="text-[12px] text-slate-500 mb-0.5 truncate">{course.operator_name}</div>
        ) : null}
        <div className="font-semibold text-[15px] text-slate-900 leading-snug line-clamp-2">
          {course.title}
        </div>
        {course.summary ? (
          <p className="text-[12.5px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
            {course.summary}
          </p>
        ) : null}
        <div className="mt-auto pt-3 flex items-center gap-2 text-[12.5px] text-slate-500">
          {course.est_minutes ? <span>{fmt(tr.card_minutes, { n: course.est_minutes })}</span> : null}
          <span className="text-emerald-700 font-medium group-hover:underline ml-auto">
            {tr.ex_start_course}
          </span>
        </div>
      </div>
    </Link>
  );
}
