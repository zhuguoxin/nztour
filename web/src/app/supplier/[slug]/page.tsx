import { notFound, redirect } from "next/navigation";
import { mediaUrl } from "@/lib/media";
import Link from "next/link";
import { TopBar } from "../../_components/top-bar";
import { requireSupplierMembership } from "@/lib/roles";
import { db } from "@/lib/db";
import { t, fmt } from "@/lib/i18n";
import { VoicesModal } from "./voices-modal";
import { GlossaryModal } from "./glossary-modal";
import { BillingModal } from "./billing-modal";
import { PageBreadcrumb } from "../../_components/page-breadcrumb";
import { MemberManager } from "../../_components/member-manager";
import { listSupplierMembers, addSupplierMember, removeSupplierMember } from "./actions";
import { requireOnboarded } from "@/lib/onboarding";

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
  status: string;
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
  await requireOnboarded();

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
              poc_name, poc_title, poc_email, poc_phone, status
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

  // The supplier panel is a hub: brief identity + management entry cards (which
  // open dedicated management pages) + roll-up KPIs and product cards. Counts
  // power the card subtitles.
  const counts = await db()
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM voice_profiles WHERE supplier_id = ?) AS voices_count,
         (SELECT COUNT(*) FROM glossary_entries WHERE supplier_id = ?) AS glossary_count`,
    )
    .bind(supplier.id, supplier.id)
    .first<{ voices_count: number; glossary_count: number }>();
  const voicesCount = counts?.voices_count ?? 0;
  const glossaryCount = counts?.glossary_count ?? 0;
  const membersRes = await listSupplierMembers(slug);
  const members = membersRes.ok ? membersRes.members ?? [] : [];

  // Aggregate KPIs.
  const totalProducts = products.length;
  const totalCourses = products.reduce((acc, p) => acc + p.course_count, 0);
  const totalLearners = products.reduce((acc, p) => acc + p.learner_count, 0);
  const totalBadges = products.reduce((acc, p) => acc + p.badge_count, 0);

  return (
    <div className="min-h-screen font-sans antialiased text-body bg-white text-slate-900">
      <TopBar />

      <main className="px-5 sm:px-8 py-8 max-w-[1300px] mx-auto">
        <PageBreadcrumb
          className="mb-3"
          items={[
            { href: "/", label: tr.nav_home },
            ...(access.isAdmin ? [{ href: "/supplier", label: tr.sup_picker_title_admin }] : []),
            { label: supplier.name },
          ]}
        />
        {supplier.status === "pending" ? (
          <div className="mb-5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
            <div className="text-small font-semibold text-slate-900">{tr.sp_pending_banner_title}</div>
            <div className="text-caption text-slate-900 mt-0.5">{tr.sp_pending_banner_body}</div>
          </div>
        ) : null}
        {/* Cover hero — shown on entry to the supplier panel */}
        <div className="relative h-40 sm:h-52 rounded-2xl overflow-hidden border border-slate-200 mb-6 bg-gradient-to-br from-slate-800 to-slate-600">
          {supplier.cover_r2_key ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mediaUrl(supplier.cover_r2_key)}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
            <div className="text-micro tracking-widest font-mono text-white/70">
              {tr.sup_d_chrome_label}
            </div>
            <h1 className="text-h2 sm:text-h1 font-semibold tracking-tight text-white mt-0.5">
              {supplier.name}
            </h1>
            <div className="flex items-center gap-2.5 mt-1.5 text-caption text-white/85 flex-wrap">
              {supplier.legal_name && supplier.legal_name !== supplier.name ? (
                <span>{supplier.legal_name}</span>
              ) : null}
              <span className="font-mono uppercase text-micro text-white/70">{supplier.country}</span>
              {supplier.hq_city ? <span>· {supplier.hq_city}</span> : null}
              <span className="px-2 py-0.5 rounded-md bg-white/15 border border-white/25 text-white text-micro font-mono uppercase">
                {supplier.plan_tier}
              </span>
              {access.isAdmin ? (
                <span className="px-2 py-0.5 rounded-full bg-lime-300/20 border border-lime-300/40 text-lime-100 text-micro font-medium">
                  {tr.op_d_view_as_admin}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Two-column: editable profile rail + management main column */}
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start">
          {/* Left rail — brief identity + management entry cards */}
          <div className="space-y-4 lg:sticky lg:top-4">
            {/* Condensed info card */}
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="relative h-24 bg-gradient-to-br from-slate-800 to-slate-600">
                {supplier.cover_r2_key ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mediaUrl(supplier.cover_r2_key)}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : null}
              </div>
              <div className="p-4">
                <div className="font-semibold text-body text-slate-900">{supplier.name}</div>
                {supplier.intro ? (
                  <p className="text-caption text-slate-600 mt-1 leading-relaxed line-clamp-3">{supplier.intro}</p>
                ) : null}
                {supplier.website ? (
                  <a
                    href={supplier.website}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-block text-caption text-slate-900 hover:underline mt-1.5"
                  >
                    {supplier.website.replace(/^https?:\/\//, "")}
                  </a>
                ) : null}
                <div className="mt-3">
                  <Link
                    href={`/supplier/${supplier.slug}/profile`}
                    className="text-caption font-medium text-slate-900 hover:underline"
                  >
                    {tr.sp_edit_details}
                  </Link>
                </div>
              </div>
            </div>

            {/* Management entry cards */}
            <div className="space-y-2.5">
              <div className="text-micro font-mono uppercase tracking-widest text-slate-600 px-1">
                {tr.sp_hub_manage}
              </div>
              <VoicesModal
                supplierSlug={supplier.slug}
                className="w-full text-left flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 hover:border-emerald-300 hover:shadow-[0_4px_18px_rgba(15,23,42,0.06)] transition"
              >
                <span className="text-h2 leading-none shrink-0">🎙</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-small text-slate-900">{tr.sp_p_nav_voices}</span>
                  <span className="block text-caption text-slate-500 truncate">
                    {fmt(tr.sp_hub_voices_desc, { n: voicesCount })}
                  </span>
                </span>
                <span className="text-slate-400 text-body shrink-0">›</span>
              </VoicesModal>
              <GlossaryModal
                supplierSlug={supplier.slug}
                className="w-full text-left flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 hover:border-emerald-300 hover:shadow-[0_4px_18px_rgba(15,23,42,0.06)] transition"
              >
                <span className="text-h2 leading-none shrink-0">📖</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-small text-slate-900">{tr.sp_p_nav_glossary}</span>
                  <span className="block text-caption text-slate-500 truncate">
                    {fmt(tr.sp_hub_glossary_desc, { n: glossaryCount })}
                  </span>
                </span>
                <span className="text-slate-400 text-body shrink-0">›</span>
              </GlossaryModal>
              <BillingModal
                supplierSlug={supplier.slug}
                className="w-full text-left flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 hover:border-emerald-300 hover:shadow-[0_4px_18px_rgba(15,23,42,0.06)] transition"
              >
                <span className="text-h2 leading-none shrink-0">💳</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-small text-slate-900">{tr.sp_hub_billing_card}</span>
                  <span className="block text-caption text-slate-500 truncate">{tr.sp_hub_billing_desc}</span>
                </span>
                <span className="text-slate-400 text-body shrink-0">›</span>
              </BillingModal>
            </div>

            {/* Team & access — grant supplier membership */}
            <MemberManager
              slug={supplier.slug}
              members={members}
              roles={[
                { value: "owner", label: tr.admin_role_owner },
                { value: "manager", label: tr.admin_role_manager },
                { value: "viewer", label: tr.admin_role_viewer },
              ]}
              addAction={addSupplierMember}
              removeAction={removeSupplierMember}
            />
          </div>

          {/* Main column — roll-up KPIs + product cards */}
          <div className="space-y-9 min-w-0">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Kpi label={tr.sup_d_kpi_products} value={totalProducts} />
              <Kpi label={tr.sup_d_kpi_courses} value={totalCourses} />
              <Kpi label={tr.sup_d_kpi_learners} value={totalLearners} />
              <Kpi label={tr.sup_d_kpi_badges} value={totalBadges} />
            </div>

            <div>
              <div className="flex items-center justify-between gap-3 mb-3">
                <h2 className="text-title sm:text-h3 font-semibold text-slate-900">
                  {fmt(tr.sup_d_products_heading, { n: totalProducts })}
                </h2>
                <Link
                  href={`/supplier/${supplier.slug}/products/new`}
                  className="px-3.5 py-1.5 rounded-md bg-emerald-600 text-white font-semibold text-caption hover:bg-emerald-700 shrink-0 whitespace-nowrap"
                >
                  + {tr.admin_new_product}
                </Link>
              </div>
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
                      <div className="font-semibold text-body text-slate-900">
                        {p.display_name ?? p.name}
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                        <MiniKpi label={tr.sup_d_mini_courses} value={p.course_count} />
                        <MiniKpi label={tr.sup_d_mini_learners} value={p.learner_count} />
                        <MiniKpi label={tr.sup_d_mini_badges} value={p.badge_count} />
                      </div>
                      <div className="text-caption text-slate-900 mt-3">{tr.sup_d_card_cta}</div>
                    </div>
                  </Link>
                ))}
              </div>
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
      <div className="text-micro tracking-widest font-mono text-slate-700">{label}</div>
      <div className="text-h1 font-semibold text-slate-900 mt-1.5 tabular-nums">{value}</div>
    </div>
  );
}

function MiniKpi({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-body font-semibold text-slate-900 tabular-nums">{value}</div>
      <div className="text-micro uppercase tracking-wider text-slate-700 mt-0.5">{label}</div>
    </div>
  );
}

async function NoAccess() {
  const tr = await t();
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased">
      <TopBar />
      <main className="px-5 sm:px-8 py-16 max-w-xl mx-auto text-center">
        <div className="text-micro tracking-widest font-mono text-rose-700/70">{tr.sp_no_access_label}</div>
        <h1 className="text-h2 font-semibold text-slate-900 mt-1">
          {tr.sp_no_access_title}
        </h1>
        <p className="text-small text-slate-600 mt-2">
          {tr.sp_no_access_body}
        </p>
        <Link
          href="/"
          className="inline-block mt-6 px-4 py-2 rounded-md bg-[#04241e] text-white font-semibold hover:bg-[#0a3a2f] text-small"
        >
          {tr.sp_back_home}
        </Link>
      </main>
    </div>
  );
}
