import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { TopBar } from "../../../_components/top-bar";
import { requireSupplierMembership } from "@/lib/roles";
import { db } from "@/lib/db";
import { t, fmt } from "@/lib/i18n";
import { BillingForm } from "./billing-form";

export const dynamic = "force-dynamic";

export default async function SupplierBillingPage({
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
    .prepare(`SELECT slug, name, plan_tier, billing_email FROM suppliers WHERE id = ?`)
    .bind(access.supplierId)
    .first<{ slug: string; name: string; plan_tier: string; billing_email: string | null }>();
  if (!s) notFound();

  const tr = await t();

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased text-body">
      <TopBar />
      <main className="px-5 sm:px-8 py-8 max-w-2xl mx-auto">
        <Link href={`/supplier/${slug}`} className="text-small text-slate-900 hover:underline">
          {tr.sp_back_panel}
        </Link>
        <h1 className="text-h2 sm:text-h1 font-semibold tracking-tight text-slate-900 mt-2 mb-5">
          {tr.sp_hub_billing_card}
        </h1>
        <BillingForm supplierSlug={s.slug} billingEmail={s.billing_email} planTier={s.plan_tier} />
      </main>
    </div>
  );
}
