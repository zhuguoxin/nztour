import { listOperatorsWithCourseCounts } from "@/lib/db";
import { t, fmt } from "@/lib/i18n";
import { TopBar } from "../_components/top-bar";
import { ProductsBrowser } from "./products-browser";

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
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased text-body">
      <TopBar />

      {/* Hero */}
      <section className="px-5 sm:px-8 pt-12 sm:pt-16 pb-8 max-w-[1300px] mx-auto">
        <div className="text-micro tracking-widest font-mono text-slate-700 mb-3">
          {tr.pr_label}
        </div>
        <h1 className="text-h1 sm:text-display leading-tight font-semibold tracking-tight text-slate-900">
          {tr.pr_title}
        </h1>
        <p className="mt-3 text-body sm:text-title text-slate-600 max-w-2xl leading-relaxed">
          {tr.pr_subtitle}
        </p>
        <div className="mt-4 text-small text-slate-500">
          {fmt(tr.pr_count, { n: operators.length })}
        </div>
      </section>

      {/* Region filter + category-grouped products */}
      <section className="px-5 sm:px-8 pb-16 sm:pb-20 max-w-[1300px] mx-auto">
        {operators.length === 0 ? (
          <div className="text-body text-slate-500">{tr.pr_empty}</div>
        ) : (
          <ProductsBrowser operators={operators} />
        )}
      </section>
    </div>
  );
}
