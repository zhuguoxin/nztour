import { listOperatorsWithCourseCounts } from "@/lib/db";
import { t, fmt } from "@/lib/i18n";
import { OperatorCard } from "../_components/operator-card";
import { TopBar } from "../_components/top-bar";

export const dynamic = "force-dynamic";

/**
 * Public products directory — every operator that offers training on Libretour.
 * Mirrors the home page light theme (white bg, emerald accent, slate text,
 * rounded-2xl cards). Each card links to the product detail page (not straight
 * into the first course), so visitors browse the supplier's full curriculum.
 */
export default async function ProductsPage() {
  const [operators, tr] = await Promise.all([listOperatorsWithCourseCounts(), t()]);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased text-[16px]">
      <TopBar />

      {/* Hero */}
      <section className="px-5 sm:px-8 pt-12 sm:pt-16 pb-8 max-w-[1400px] mx-auto">
        <div className="text-[11px] tracking-widest font-mono text-emerald-700/70 mb-3">
          {tr.pr_label}
        </div>
        <h1 className="text-[30px] sm:text-[40px] leading-tight font-semibold tracking-tight text-slate-900">
          {tr.pr_title}
        </h1>
        <p className="mt-3 text-[15px] sm:text-[17px] text-slate-600 max-w-2xl leading-relaxed">
          {tr.pr_subtitle}
        </p>
        <div className="mt-4 text-[13px] text-slate-500">
          {fmt(tr.pr_count, { n: operators.length })}
        </div>
      </section>

      {/* Products grid */}
      <section className="px-5 sm:px-8 pb-16 sm:pb-20 max-w-[1400px] mx-auto">
        {operators.length === 0 ? (
          <div className="text-[15px] text-slate-500">{tr.pr_empty}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {operators.map((op) => (
              <OperatorCard
                key={op.id}
                op={op}
                tr={tr}
                canManage={false}
                href={`/products/${op.slug}`}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
