import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { TopBar } from "../../../_components/top-bar";
import { requireSupplierMembership } from "@/lib/roles";
import { db } from "@/lib/db";
import { t, fmt } from "@/lib/i18n";
import { hasMiniMaxKey } from "@/lib/minimax";
import { VoicesPanel, type VoiceRow } from "../voices-panel";

export const dynamic = "force-dynamic";

/**
 * Dedicated voices page for a supplier — reachable even for single-product
 * suppliers (the main /supplier/<slug> dashboard folds away to the product
 * dashboard when there's only one product, which would otherwise hide the
 * voice-cloning UI). Voices are supplier-level (shared across all of the
 * supplier's products).
 */
export default async function SupplierVoices({
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

  const supplier = await db()
    .prepare(`SELECT id, slug, name FROM suppliers WHERE id = ?`)
    .bind(access.supplierId)
    .first<{ id: string; slug: string; name: string }>();
  if (!supplier) notFound();

  const { results: voices = [] } = await db()
    .prepare(
      `SELECT id, name, provider, external_id, kind, gender, langs, status, status_detail, created_at
       FROM voice_profiles
       WHERE supplier_id = ? OR supplier_id IS NULL
       ORDER BY (supplier_id IS NULL) DESC, created_at DESC`,
    )
    .bind(supplier.id)
    .all<VoiceRow>();

  const tr = await t();

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased text-[16px]">
      <TopBar
        breadcrumb={
          <span className="flex items-center gap-2 min-w-0">
            <Link href="/" className="hover:text-white shrink-0">{tr.nav_home}</Link>
            <span className="text-white/20 shrink-0">/</span>
            <span className="text-white truncate">{fmt(tr.sp_voices_crumb, { name: supplier.name })}</span>
          </span>
        }
      />
      <main className="px-5 sm:px-8 py-8 sm:py-10 max-w-4xl mx-auto">
        <Link href={`/supplier/${supplier.slug}`} className="text-[13px] text-emerald-700 hover:underline">
          {tr.sp_back_panel}
        </Link>
        <div className="mb-6 mt-2">
          <div className="text-[11px] tracking-widest font-mono text-emerald-700/70">{tr.sp_voices_label}</div>
          <h1 className="text-[26px] sm:text-[30px] font-semibold tracking-tight text-slate-900 mt-1">
            {supplier.name}
          </h1>
          <p className="text-[13.5px] text-slate-600 mt-1.5">
            {tr.sp_voices_blurb}
          </p>
        </div>
        <VoicesPanel
          supplierSlug={supplier.slug}
          voices={voices ?? []}
          hasXIKey={hasMiniMaxKey()}
        />
      </main>
    </div>
  );
}
