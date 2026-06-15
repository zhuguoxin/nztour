import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { TopBar } from "../../_components/top-bar";
import { requireSupplierMembership } from "@/lib/roles";
import { db } from "@/lib/db";
import { t, fmt } from "@/lib/i18n";
import { hasMiniMaxKey } from "@/lib/minimax";
import { VoicesPanel, type VoiceRow } from "./voices-panel";
import { GlossaryPanel } from "../../_components/glossary-panel";
import { listGlossaryEntries } from "@/lib/glossary";
import { TRANSLATE_LANGS } from "@/lib/translate";
import { SupplierProfile } from "./supplier-profile";

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
  cover_r2_key: string | null;
  phone: string | null;
  address: string | null;
  billing_email: string | null;
  links_json: string | null;
  default_lang: string | null;
  timezone: string | null;
  poc_name: string | null;
  poc_title: string | null;
  poc_email: string | null;
  poc_phone: string | null;
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
    if (msg === "forbidden") return await NoAccess();
    if (msg === "unauthorised") redirect("/sign-in");
    throw err;
  }

  const supplier = await db()
    .prepare(
      `SELECT id, slug, name, legal_name, country, hq_city, website, intro, plan_tier, contact_email,
              cover_r2_key, phone, address, billing_email, links_json, default_lang, timezone,
              poc_name, poc_title, poc_email, poc_phone
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

  // The supplier panel is the back-office hub — it lists the supplier's
  // products (click one to manage its courses) plus voices, even when the
  // supplier owns a single product. (Previously it folded away to the product
  // dashboard for single-product suppliers.)

  // Voices owned by this supplier OR platform stock (supplier_id IS NULL).
  // Stock first in the panel so customers see what's available out of the box.
  const { results: voices = [] } = await db()
    .prepare(
      `SELECT id, name, provider, external_id, kind, gender, langs, status, status_detail, created_at
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
            <Link href="/" className="hover:text-white">{tr.nav_home}</Link>
            <span className="text-white/20">/</span>
            <span className="text-white">{fmt(tr.sp_breadcrumb, { name: supplier.name })}</span>
            {access.isAdmin ? (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-lime-300/10 border border-lime-300/30 text-lime-300 text-[11px] font-medium">
                {tr.op_d_view_as_admin}
              </span>
            ) : null}
          </span>
        }
      />

      <main className="px-5 sm:px-8 py-8 max-w-7xl mx-auto">
        {/* Cover hero — shown on entry to the supplier panel */}
        <div className="relative h-40 sm:h-52 rounded-2xl overflow-hidden border border-slate-200 mb-6 bg-gradient-to-br from-slate-800 to-slate-600">
          {supplier.cover_r2_key ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/supplier-cover?slug=${encodeURIComponent(supplier.slug)}`}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
            <div className="text-[11px] tracking-widest font-mono text-white/70">
              {tr.sup_d_chrome_label}
            </div>
            <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-tight text-white mt-0.5">
              {supplier.name}
            </h1>
            <div className="flex items-center gap-2.5 mt-1.5 text-[12.5px] text-white/85 flex-wrap">
              {supplier.legal_name && supplier.legal_name !== supplier.name ? (
                <span>{supplier.legal_name}</span>
              ) : null}
              <span className="font-mono uppercase text-[11px] text-white/70">{supplier.country}</span>
              {supplier.hq_city ? <span>· {supplier.hq_city}</span> : null}
              <span className="px-2 py-0.5 rounded-md bg-white/15 border border-white/25 text-white text-[11px] font-mono uppercase">
                {supplier.plan_tier}
              </span>
              {access.isAdmin ? (
                <span className="px-2 py-0.5 rounded-full bg-lime-300/20 border border-lime-300/40 text-lime-100 text-[11px] font-medium">
                  {tr.op_d_view_as_admin}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Two-column: editable profile rail + management main column */}
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start">
          {/* Left rail — supplier profile (cover upload + editable fields) */}
          <div className="space-y-4 lg:sticky lg:top-4">
            <div className="text-[12px] font-semibold text-slate-700 px-1">{tr.sp_p_heading}</div>
            <SupplierProfile
              s={{
                slug: supplier.slug,
                name: supplier.name,
                legal_name: supplier.legal_name,
                intro: supplier.intro,
                website: supplier.website,
                country: supplier.country,
                hq_city: supplier.hq_city,
                address: supplier.address,
                contact_email: supplier.contact_email,
                phone: supplier.phone,
                billing_email: supplier.billing_email,
                poc_name: supplier.poc_name,
                poc_title: supplier.poc_title,
                poc_email: supplier.poc_email,
                poc_phone: supplier.poc_phone,
                links_json: supplier.links_json,
                default_lang: supplier.default_lang,
                timezone: supplier.timezone,
                hasCover: !!supplier.cover_r2_key,
              }}
            />
            <div className="rounded-2xl border border-slate-200 bg-white p-3 flex items-center gap-4 text-[13px]">
              <a href="#voices" className="text-emerald-700 hover:underline">🎙 {tr.sp_p_nav_voices}</a>
              <a href="#glossary" className="text-emerald-700 hover:underline">📖 {tr.sp_p_nav_glossary}</a>
            </div>
          </div>

          {/* Main column — roll-up KPIs, products, voices, glossary */}
          <div className="space-y-9 min-w-0">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Kpi label={tr.sup_d_kpi_products} value={totalProducts} />
              <Kpi label={tr.sup_d_kpi_courses} value={totalCourses} />
              <Kpi label={tr.sup_d_kpi_learners} value={totalLearners} />
              <Kpi label={tr.sup_d_kpi_badges} value={totalBadges} />
            </div>

            <div>
              <h2 className="text-[18px] sm:text-[20px] font-semibold text-slate-900 mb-3">
                {fmt(tr.sup_d_products_heading, { n: totalProducts })}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </div>

            <div id="voices" className="scroll-mt-4">
              <VoicesPanel supplierSlug={supplier.slug} voices={voices ?? []} hasXIKey={cloneEnabled} />
            </div>

            <div id="glossary" className="scroll-mt-4">
              <GlossaryPanel
                scope="supplier"
                slug={supplier.slug}
                entries={await listGlossaryEntries({ supplierId: supplier.id })}
                languages={TRANSLATE_LANGS}
              />
            </div>
          </div>
        </div>
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

async function NoAccess() {
  const tr = await t();
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased">
      <TopBar />
      <main className="px-5 sm:px-8 py-16 max-w-xl mx-auto text-center">
        <div className="text-[11px] tracking-widest font-mono text-rose-700/70">{tr.sp_no_access_label}</div>
        <h1 className="text-[24px] font-semibold text-slate-900 mt-1">
          {tr.sp_no_access_title}
        </h1>
        <p className="text-[13.5px] text-slate-600 mt-2">
          {tr.sp_no_access_body}
        </p>
        <Link
          href="/"
          className="inline-block mt-6 px-4 py-2 rounded-md bg-[#04241e] text-white font-semibold hover:bg-[#0a3a2f] text-[14px]"
        >
          {tr.sp_back_home}
        </Link>
      </main>
    </div>
  );
}
