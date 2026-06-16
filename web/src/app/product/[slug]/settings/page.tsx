import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { TopBar } from "../../../_components/top-bar";
import { requireOperatorMembership } from "@/lib/roles";
import { db } from "@/lib/db";
import { t } from "@/lib/i18n";
import { ProductProfile, type ProductProfileData } from "../product-profile";

export const dynamic = "force-dynamic";

interface Row extends ProductProfileData {
  supplier_slug: string | null;
}

export default async function ProductSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  try {
    await requireOperatorMembership(slug);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "unauthorised") redirect("/sign-in");
    notFound();
  }

  const p = await db()
    .prepare(
      `SELECT o.slug, o.name, o.display_name, o.intro, o.website, o.country, o.nzbn,
              o.category, o.region, o.primary_lang, o.timezone, o.contact_email,
              o.phone, o.address, o.poc_name, o.poc_title, o.poc_email, o.poc_phone,
              o.links_json, s.slug AS supplier_slug
       FROM operators o LEFT JOIN suppliers s ON s.id = o.supplier_id
       WHERE o.slug = ?`,
    )
    .bind(slug)
    .first<Row>();
  if (!p) notFound();

  const tr = await t();

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased text-[16px]">
      <TopBar
        breadcrumb={
          <span className="flex items-center gap-2 min-w-0">
            <Link href="/" className="hover:text-slate-900 shrink-0">{tr.nav_home}</Link>
            <span className="text-slate-900/20 shrink-0">/</span>
            <Link href={`/product/${slug}`} className="hover:text-slate-900 shrink-0 truncate">
              {p.name}
            </Link>
            <span className="text-slate-900/20 shrink-0">/</span>
            <span className="text-slate-900 truncate">{tr.pp_heading}</span>
          </span>
        }
      />
      <main className="px-5 sm:px-8 py-8 max-w-4xl mx-auto">
        <Link href={`/product/${slug}`} className="text-[13px] text-emerald-700 hover:underline">
          {tr.pp_back_dashboard}
        </Link>
        <div className="flex items-baseline justify-between gap-3 mt-2 mb-5 flex-wrap">
          <h1 className="text-[24px] sm:text-[28px] font-semibold tracking-tight text-slate-900">
            {tr.pp_heading}
          </h1>
          <Link href={`/product/${slug}#branding`} className="text-[12.5px] text-slate-600 hover:text-slate-900 hover:underline">
            {tr.pp_visuals_hint}
          </Link>
        </div>
        <ProductProfile p={p} />
      </main>
    </div>
  );
}
