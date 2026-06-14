import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { TopBar } from "../../_components/top-bar";
import { requireSupplierMembership } from "@/lib/roles";
import { db } from "@/lib/db";
import { t, fmt } from "@/lib/i18n";
import { hasMiniMaxKey } from "@/lib/minimax";
import { VoicesPanel, type VoiceRow } from "./voices-panel";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

interface SupplierRow {
  id: string;
  slug: string;
  name: string;
  legal_name: string | null;
  country: string;
  hq_city: string | null;
  website: string | null;
  intro: string | null;
  plan_tier: string;
  contact_email: string | null;
}

interface ProductKpiRow {
  id: string;
  slug: string;
  name: string;
  display_name: string | null;
  country: string;
  cover_color: string | null;
  course_count: number;
  learner_count: number;
  badge_count: number;
}

/**
 * /supplier/<slug> — the aggregated holding-entity dashboard.
 *
 * Shows three layers:
 *   1. Supplier identity strip — name, legal name, website, plan tier
 *   2. Roll-up KPIs across every owned product (learners, completions, badges,
 *      published courses)
 *   3. Per-product cards with mini KPI strip; click → /product/<slug>
 *
 * If supplier owns exactly one product, we redirect straight to the product
 * dashboard — no point making the user click twice.
 *
 * Role gate: supplier_memberships row (or platform_admin). Product-level
 * operator_memberships do NOT grant access here — supplier role is more
 * privileged (sees siblings).
 */
export default async function SupplierDashboard({ params }: Props) {
  const { slug } = await params;

  let access;
  try {
    access = await requireSupplierMembership(slug);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "not_found") notFound();
    if (msg === "forbidden") return <NoAccess />;
    if (msg === "unauthorised") redirect("/sign-in");
    throw err;
  }

  const supplier = await db()
    .prepare(
      `SELECT id, slug, name, legal_name, country, hq_city, website, intro, plan_tier, contact_email
       FROM suppliers WHERE id = ?`,
    )
    .bind(access.supplierId)
    .first<SupplierRow>();
  if (!supplier) notFound();

  const tr = await t();

  const { results: products = [] } = await db()
    .prepare(
      `SELECT o.id, o.slug, o.name, o.display_name, o.country, o.cover_color,
              (SELECT COUNT(*) FROM courses c WHERE c.operator_id = o.id AND c.status='published') AS course_count,
              (SELECT COUNT(DISTINCT e.user_id) FROM enrollments e
                 JOIN courses c ON c.id = e.course_id
                 WHERE c.operator_id = o.id) AS learner_count,
              (SELECT COUNT(*) FROM badges b WHERE b.operator_id = o.id) AS badge_count
       FROM operators o
       WHERE o.supplier_id = ? AND o.status='active'
       ORDER BY badge_count DESC, course_count DESC, o.name`,
    )
    .bind(supplier.id)
    .all<ProductKpiRow>();

  // Single-product supplier → fold this layer away.
  if (products.length === 1) {
    redirect(`/product/${products[0].slug}`);
  }

  // Voices owned by this supplier OR platform stock (supplier_id IS NULL).
  // Stock first in the panel so customers see what's available out of the box.
  const { results: voices = [] } = await db()
    .prepare(
      `SELECT id, name, provider, external_id, kind, gender, status, status_detail, created_at
       FROM voice_profiles
       WHERE supplier_id = ? OR supplier_id IS NULL
       ORDER BY (supplier_id IS NULL) DESC, created_at DESC`,
    )
    .bind(supplier.id)
    .all<VoiceRow>();
  const cloneEnabled = hasMiniMaxKey();

  // Aggregate KPIs.
  const totalProducts = products.length;
  const totalCourses = products.reduce((acc, p) => acc + p.course_count, 0);
  const totalLearners = products.reduce((acc, p) => acc + p.learner_count, 0);
  const totalBadges = products.reduce((acc, p) => acc + p.badge_count, 0);

  return (
    <div className="min-h-screen font-sans antialiased text-[16px] bg-white text-slate-900">
      <TopBar
        breadcrumb={
          <span className="flex items-center gap-2">
            <Link href="/" className="hover:text-white">Home</Link>
            <span className="text-white/20">/</span>
            <span className="text-white">Supplier · {supplier.name}</span>
            {access.isAdmin ? (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-lime-300/10 border border-lime-300/30 text-lime-300 text-[11px] font-medium">
                {tr.op_d_view_as_admin}
              </span>
            ) : null}
          </span>
        }
      />

      <main className="px-5 sm:px-8 py-8 sm:py-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
          <div className="min-w-0">
            <div className="text-[11px] tracking-widest font-mono text-emerald-700/70">
              {tr.sup_d_chrome_label}
            </div>
            <h1 className="text-[28px] sm:text-[34px] font-semibold tracking-tight mt-1 text-slate-900">
              {supplier.name}
            </h1>
            {supplier.legal_name && supplier.legal_name !== supplier.name ? (
              <div className="text-[13px] text-slate-500 mt-0.5">{supplier.legal_name}</div>
            ) : null}
            <div className="flex items-center gap-3 mt-2 text-[13px] text-slate-600 flex-wrap">
              <span className="font-mono uppercase text-[11px] text-slate-500">{supplier.country}</span>
              {supplier.hq_city ? <span>· {supplier.hq_city}</span> : null}
              {supplier.website ? (
                <a
                  href={supplier.website}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-emerald-700 hover:underline"
                >
                  {supplier.website.replace(/^https?:\/\//, "")}
                </a>
              ) : null}
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-mono uppercase">
                {supplier.plan_tier}
              </span>
            </div>
            {supplier.intro ? (
              <p className="text-[14px] text-slate-700 mt-3 max-w-2xl leading-relaxed">{supplier.intro}</p>
            ) : null}
          </div>
        </div>

        {/* Aggregated KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-9">
          <Kpi label={tr.sup_d_kpi_products} value={totalProducts} />
          <Kpi label={tr.sup_d_kpi_courses} value={totalCourses} />
          <Kpi label={tr.sup_d_kpi_learners} value={totalLearners} />
          <Kpi label={tr.sup_d_kpi_badges} value={totalBadges} />
        </div>

        {/* Per-product cards */}
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-[18px] sm:text-[20px] font-semibold text-slate-900">
            {fmt(tr.sup_d_products_heading, { n: totalProducts })}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {products.map((p) => (
            <Link
              key={p.id}
              href={`/product/${p.slug}`}
              className="rounded-2xl border border-slate-200 bg-white overflow-hidden hover:border-emerald-300 hover:shadow-[0_8px_32px_rgba(15,23,42,0.08)] transition"
            >
              <div
                className="h-20"
                style={{
                  background: p.cover_color ?? "linear-gradient(135deg,#1e293b 0%,#334155 100%)",
                }}
              />
              <div className="p-4">
                <div className="font-semibold text-[15px] text-slate-900">
                  {p.display_name ?? p.name}
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                  <MiniKpi label={tr.sup_d_mini_courses} value={p.course_count} />
                  <MiniKpi label={tr.sup_d_mini_learners} value={p.learner_count} />
                  <MiniKpi label={tr.sup_d_mini_badges} value={p.badge_count} />
                </div>
                <div className="text-[12px] text-emerald-700 mt-3">{tr.sup_d_card_cta}</div>
              </div>
            </Link>
          ))}
        </div>

        <VoicesPanel supplierSlug={supplier.slug} voices={voices ?? []} hasXIKey={cloneEnabled} />
      </main>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-[11px] tracking-widest font-mono text-emerald-700/70">{label}</div>
      <div className="text-[28px] font-semibold text-slate-900 mt-1.5 tabular-nums">{value}</div>
    </div>
  );
}

function MiniKpi({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-[16px] font-semibold text-slate-900 tabular-nums">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}

function NoAccess() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased">
      <TopBar />
      <main className="px-5 sm:px-8 py-16 max-w-xl mx-auto text-center">
        <div className="text-[11px] tracking-widest font-mono text-rose-700/70">/ NO ACCESS</div>
        <h1 className="text-[24px] font-semibold text-slate-900 mt-1">
          You don&apos;t have supplier access to this account.
        </h1>
        <p className="text-[13.5px] text-slate-600 mt-2">
          Ask your supplier owner to grant you a membership, or contact Libretour support.
        </p>
        <Link
          href="/"
          className="inline-block mt-6 px-4 py-2 rounded-md bg-[#04241e] text-white font-semibold hover:bg-[#0a3a2f] text-[14px]"
        >
          Back to home
        </Link>
      </main>
    </div>
  );
}
