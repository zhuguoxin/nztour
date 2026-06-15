import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { TopBar } from "../../../_components/top-bar";
import { requireSupplierMembership } from "@/lib/roles";
import { db } from "@/lib/db";
import { t, fmt } from "@/lib/i18n";
import { SupplierProfile, type SupplierProfileData } from "../supplier-profile";

export const dynamic = "force-dynamic";

interface Row {
  slug: string;
  name: string;
  legal_name: string | null;
  intro: string | null;
  website: string | null;
  country: string;
  hq_city: string | null;
  address: string | null;
  contact_email: string | null;
  phone: string | null;
  billing_email: string | null;
  poc_name: string | null;
  poc_title: string | null;
  poc_email: string | null;
  poc_phone: string | null;
  links_json: string | null;
  default_lang: string | null;
  timezone: string | null;
  cover_r2_key: string | null;
}

export default async function SupplierProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let access;
  try {
    access = await requireSupplierMembership(slug);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "unauthorised") redirect("/sign-in");
    notFound();
  }

  const s = await db()
    .prepare(
      `SELECT slug, name, legal_name, intro, website, country, hq_city, address,
              contact_email, phone, billing_email, poc_name, poc_title, poc_email,
              poc_phone, links_json, default_lang, timezone, cover_r2_key
       FROM suppliers WHERE id = ?`,
    )
    .bind(access.supplierId)
    .first<Row>();
  if (!s) notFound();

  const tr = await t();
  const data: SupplierProfileData = { ...s, hasCover: !!s.cover_r2_key };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased text-[16px]">
      <TopBar
        breadcrumb={
          <span className="flex items-center gap-2 min-w-0">
            <Link href="/" className="hover:text-white shrink-0">{tr.nav_home}</Link>
            <span className="text-white/20 shrink-0">/</span>
            <Link href={`/supplier/${slug}`} className="hover:text-white shrink-0">
              {fmt(tr.sp_breadcrumb, { name: s.name })}
            </Link>
            <span className="text-white/20 shrink-0">/</span>
            <span className="text-white truncate">{tr.sp_p_heading}</span>
          </span>
        }
      />
      <main className="px-5 sm:px-8 py-8 max-w-4xl mx-auto">
        <Link href={`/supplier/${slug}`} className="text-[13px] text-emerald-700 hover:underline">
          {tr.sp_back_panel}
        </Link>
        <h1 className="text-[24px] sm:text-[28px] font-semibold tracking-tight text-slate-900 mt-2 mb-5">
          {tr.sp_p_heading}
        </h1>
        <SupplierProfile s={data} />
      </main>
    </div>
  );
}
