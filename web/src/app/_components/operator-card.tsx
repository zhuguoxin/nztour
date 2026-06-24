import Link from "next/link";
import { fallbackCover } from "@/lib/cover";
import { mediaUrl } from "@/lib/media";
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
  nameAsTitle = false,
}: {
  op: OperatorCardData;
  tr: Dict;
  canManage: boolean;
  href?: string;
  /** Products listing: show the PRODUCT name as the bold title and omit the
   *  sample course title (this grid lists products, not courses). */
  nameAsTitle?: boolean;
}) {
  const hasCourses = op.course_count > 0;
  const cover = op.cover_color ?? "linear-gradient(135deg,#475569 0%,#64748b 100%)";
  // Uploaded/library cover wins over the hotlinked image; every card still shows
  // a photo (deterministic NZ-scenic fallback) — no emoji placeholders.
  const coverImg = op.cover_r2_key
    ? mediaUrl(op.cover_r2_key)
    : (op.cover_image_url ?? fallbackCover(op.slug));
  // Stacked stat block: number on its own line, short unit below. Keeps the row
  // tidy in every language (CJK labels no longer wrap mid-word). Only present
  // stats are shown, split into even columns.
  const stats: { n: string; label: string }[] = [
    {
      n: String(op.course_count),
      label: op.course_count === 1 ? tr.card_u_course : tr.card_u_courses,
    },
  ];
  if (op.module_count > 0) stats.push({ n: String(op.module_count), label: tr.card_u_modules });
  if (op.est_minutes > 0) stats.push({ n: `~${op.est_minutes}`, label: tr.card_u_min });

  const targetHref =
    href ?? (hasCourses && op.sample_course_slug ? `/learn/${op.slug}/${op.sample_course_slug}` : null);

  return (
    <article className="rounded-2xl overflow-hidden bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-[0_8px_32px_rgba(15,23,42,0.08)] transition h-full relative">
      <div className="aspect-[16/9] relative overflow-hidden" style={{ background: cover }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverImg}
          alt=""
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5 z-[1]">
          {hasCourses ? (
            <span className="px-2.5 py-1 rounded-full bg-black/35 backdrop-blur-sm text-micro font-medium text-white/90 border border-white/15">
              {tr.card_live}
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full bg-black/35 backdrop-blur-sm text-micro font-medium text-white/80 border border-white/15">
              {tr.card_coming_soon}
            </span>
          )}
        </div>
        {canManage ? (
          <Link
            href={`/product/${op.slug}`}
            className="absolute top-3.5 right-3.5 z-10 px-2.5 py-1 rounded-full bg-emerald-600 text-white text-micro font-semibold hover:bg-emerald-700 shadow"
          >
            {tr.card_manage}
          </Link>
        ) : null}
      </div>
      <div className="p-5">
        {nameAsTitle ? (
          <>
            {/* Products listing: company name (small) + product name (bold). */}
            {op.supplier_name && op.supplier_name !== op.name ? (
              <div className="text-small text-slate-500 mb-1">{op.supplier_name}</div>
            ) : null}
            <div className="font-semibold text-title text-slate-900 leading-snug line-clamp-2">
              {op.name}
            </div>
          </>
        ) : (
          <>
            <div className="text-small text-slate-500 mb-1">{op.name}</div>
            <div className="font-semibold text-title text-slate-900 leading-snug line-clamp-2">
              {op.sample_course_title ?? tr.card_curriculum_coming_soon}
            </div>
          </>
        )}
        <div className="flex mt-4">
          {stats.map((s, i) => (
            <div
              key={i}
              className={`flex-1 min-w-0 ${i > 0 ? "border-l border-slate-200 pl-3" : ""} ${
                i < stats.length - 1 ? "pr-3" : ""
              }`}
            >
              <div className="text-h3 font-semibold text-slate-900 leading-none">{s.n}</div>
              <div className="text-caption text-slate-500 mt-1.5">{s.label}</div>
            </div>
          ))}
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
