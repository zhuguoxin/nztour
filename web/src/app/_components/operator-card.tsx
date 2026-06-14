import Link from "next/link";
import { fmt } from "@/lib/i18n-shared";
import type { Dict } from "@/lib/i18n";
import type { OperatorCard as OperatorCardData } from "@/lib/db";

/**
 * Marketplace product (operator) card — shared by the home page, /explore and
 * /products. Whole-card link target defaults to the operator's first published
 * course (jump straight into learning); pass `href` to override (e.g. the
 * /products grid links to the product detail page instead).
 */
export function OperatorCard({
  op,
  tr,
  canManage,
  href,
}: {
  op: OperatorCardData;
  tr: Dict;
  canManage: boolean;
  href?: string;
}) {
  const hasCourses = op.course_count > 0;
  const cover = op.cover_color ?? "linear-gradient(135deg,#475569 0%,#64748b 100%)";
  const coursesLabel =
    op.course_count === 1
      ? fmt(tr.card_courses_count, { n: op.course_count })
      : fmt(tr.card_courses_count_plural, { n: op.course_count });

  const targetHref =
    href ?? (hasCourses && op.sample_course_slug ? `/learn/${op.slug}/${op.sample_course_slug}` : null);

  return (
    <article className="rounded-2xl overflow-hidden bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-[0_8px_32px_rgba(15,23,42,0.08)] transition h-full relative">
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
            href={`/product/${op.slug}`}
            className="absolute top-3.5 right-3.5 z-10 px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-semibold hover:bg-emerald-700 shadow"
          >
            {tr.card_manage}
          </Link>
        ) : null}
        <div className="absolute bottom-3.5 left-4 right-4 flex items-end justify-between">
          <div className="text-[36px] leading-none drop-shadow">{op.emoji ?? "📚"}</div>
        </div>
      </div>
      <div className="p-5">
        <div className="text-[13px] text-slate-500 mb-1">{op.name}</div>
        <div className="font-semibold text-[17px] text-slate-900 leading-snug line-clamp-2">
          {op.sample_course_title ?? tr.card_curriculum_coming_soon}
        </div>
        <div className="flex items-center gap-2.5 mt-3.5 text-[13px] text-slate-500">
          <span>{coursesLabel}</span>
          {op.module_count > 0 ? (
            <>
              <span className="text-slate-300">·</span>
              <span>{fmt(tr.card_modules_count, { n: op.module_count })}</span>
            </>
          ) : null}
          {op.est_minutes > 0 ? (
            <>
              <span className="text-slate-300">·</span>
              <span>{fmt(tr.card_minutes, { n: op.est_minutes })}</span>
            </>
          ) : null}
        </div>
      </div>
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
