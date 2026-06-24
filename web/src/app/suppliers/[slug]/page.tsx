import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getPublicSupplier, listOperatorsWithCourseCounts, db } from "@/lib/db";
import { t, fmt } from "@/lib/i18n";
import { getCurrentRole } from "@/lib/roles";
import { TopBar } from "../../_components/top-bar";
import { OperatorCard } from "../../_components/operator-card";
import { Delisted } from "../../_components/delisted";

export const dynamic = "force-dynamic";

/**
 * Public, user-facing supplier (company) detail page. Shows the company header
 * and a grid of its products. The back-office dashboard lives at /supplier/<slug>
 * (membership-gated); this is the public showcase reached from /explore.
 *
 * A disabled (suspended) supplier 404s for visitors, but a learner who has
 * history under it gets a "delisted" notice.
 */
export default async function SupplierDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [supplier, ops, tr, role] = await Promise.all([
    getPublicSupplier(slug),
    listOperatorsWithCourseCounts(),
    t(),
    getCurrentRole(),
  ]);
  if (!supplier) notFound();

  if (supplier.status === "suspended") {
    const { userId: uid } = await auth();
    let hasHistory = false;
    if (uid) {
      const h = await db()
        .prepare(
          `SELECT 1 AS x FROM enrollments e
             JOIN courses c ON c.id = e.course_id
             JOIN operators o ON o.id = c.operator_id
             WHERE e.user_id = ? AND o.supplier_id = ?
           UNION SELECT 1 FROM badges b JOIN operators o ON o.id = b.operator_id
             WHERE b.user_id = ? AND o.supplier_id = ? LIMIT 1`,
        )
        .bind(uid, supplier.id, uid, supplier.id)
        .first<{ x: number }>();
      hasHistory = !!h;
    }
    if (!hasHistory) notFound();
    return <Delisted message={tr.delisted_supplier} backLabel={tr.delisted_back} />;
  }

  const products = ops.filter((o) => o.supplier_slug === slug);
  const manageableSlugs = new Set(
    role.isAdmin ? ops.map((o) => o.slug) : role.operators.map((o) => o.operator_slug),
  );
  const location = [supplier.country, supplier.hq_city].filter(Boolean).join(" · ");

  const breadcrumb = (
    <span className="flex items-center gap-2 min-w-0">
      <Link href="/" className="hover:text-white">{tr.nav_home}</Link>
      <span className="text-white/20">/</span>
      <Link href="/explore" className="hover:text-white">{tr.ex_title}</Link>
      <span className="text-white/20">/</span>
      <span className="text-white truncate">{supplier.name}</span>
    </span>
  );

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased text-body">
      <TopBar breadcrumb={breadcrumb} />

      <section className="px-5 sm:px-8 pt-12 sm:pt-16 pb-6 max-w-[1300px] mx-auto">
        {location ? (
          <div className="text-caption tracking-widest font-mono text-slate-700 mb-2 uppercase">
            {location}
          </div>
        ) : null}
        <h1 className="text-h1 sm:text-display leading-tight font-semibold tracking-tight text-slate-900">
          {supplier.name}
        </h1>
        {supplier.intro ? (
          <p className="mt-3 text-body sm:text-title text-slate-600 max-w-2xl leading-relaxed">
            {supplier.intro}
          </p>
        ) : null}
        {supplier.website ? (
          <a
            href={supplier.website}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-block mt-3 text-small text-slate-900 hover:underline"
          >
            {supplier.website.replace(/^https?:\/\//, "")} ↗
          </a>
        ) : null}
      </section>

      <section className="px-5 sm:px-8 pb-16 sm:pb-20 max-w-[1300px] mx-auto">
        <h2 className="text-title sm:text-h2 font-semibold text-slate-900 mb-5">
          {fmt(tr.sd_products, { n: products.length })}
        </h2>
        {products.length === 0 ? (
          <div className="text-body text-slate-500">{tr.sd_empty}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {products.map((op) => (
              <OperatorCard
                key={op.id}
                op={op}
                tr={tr}
                canManage={manageableSlugs.has(op.slug)}
                href={`/products/${op.slug}`}
                nameAsTitle
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
