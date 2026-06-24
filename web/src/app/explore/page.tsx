import Link from "next/link";
import { TopBar } from "../_components/top-bar";
import { t, fmt } from "@/lib/i18n";
import { listActiveSuppliers } from "@/lib/db";
import { fallbackCover } from "@/lib/cover";
import { mediaUrl } from "@/lib/media";

export const dynamic = "force-dynamic";

/**
 * /explore — user-facing showcase of the suppliers (tourism companies) offering
 * training on Libretour. Each card links to that supplier's product. (Replaced
 * the old destination photo mosaic.)
 */
export default async function ExplorePage() {
  const [suppliers, tr] = await Promise.all([listActiveSuppliers(), t()]);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased text-body">
      <TopBar />

      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 -z-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(16,185,129,0.08) 0%, transparent 60%)",
          }}
        />
        <div className="relative px-5 sm:px-8 pt-14 sm:pt-20 pb-8 max-w-[1300px] mx-auto">
          <div className="text-micro tracking-widest font-mono text-slate-700 mb-2">
            {tr.ex_label}
          </div>
          <h1 className="text-h1 sm:text-display leading-[1.05] font-semibold tracking-tight text-slate-900">
            {tr.ex_title}
          </h1>
          <p className="mt-3 text-body sm:text-title text-slate-600 max-w-2xl leading-relaxed">
            {tr.ex_subtitle}
          </p>
        </div>
      </section>

      <section className="px-5 sm:px-8 pb-16 sm:pb-20 max-w-[1300px] mx-auto">
        {suppliers.length === 0 ? (
          <div className="text-body text-slate-500">{tr.ex_empty}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {suppliers.map((s) => {
              const cover = s.cover_r2_key
                ? mediaUrl(s.cover_r2_key)
                : (s.cover_image_url ?? fallbackCover(s.slug));
              const href = `/suppliers/${s.slug}`;
              return (
                <Link
                  key={s.id}
                  href={href}
                  className="rounded-2xl overflow-hidden bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-[0_8px_32px_rgba(15,23,42,0.08)] transition h-full"
                >
                  <div
                    className="aspect-[16/9] relative overflow-hidden"
                    style={{ background: "linear-gradient(135deg,#475569 0%,#64748b 100%)" }}
                  >
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cover} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                    ) : null}
                    {s.hq_city || s.country ? (
                      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm text-micro font-medium text-white/90 border border-white/15">
                        {[s.country, s.hq_city].filter(Boolean).join(" · ")}
                      </div>
                    ) : null}
                  </div>
                  <div className="p-5">
                    <div className="font-semibold text-title text-slate-900 leading-snug line-clamp-2">
                      {s.name}
                    </div>
                    <div className="flex items-center gap-2.5 mt-2.5 text-small text-slate-500">
                      <span>{fmt(tr.admin_sup_products, { n: s.product_count })}</span>
                      {s.course_count > 0 ? (
                        <>
                          <span className="text-slate-300">·</span>
                          <span>
                            {fmt(
                              s.course_count === 1 ? tr.card_courses_count : tr.card_courses_count_plural,
                              { n: s.course_count },
                            )}
                          </span>
                        </>
                      ) : null}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
