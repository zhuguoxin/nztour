import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { TopBar } from "../../../_components/top-bar";
import { requireSupplierMembership } from "@/lib/roles";
import { db } from "@/lib/db";
import { t, fmt } from "@/lib/i18n";
import { hasMiniMaxKey } from "@/lib/minimax";
import { VoicesPanel, type VoiceRow } from "../voices-panel";
import { safeReturnTo } from "@/lib/nav";

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
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { slug } = await params;
  const { from } = await searchParams;

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
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased text-body">
      <TopBar />
      <main className="px-5 sm:px-8 py-8 sm:py-10 max-w-4xl mx-auto">
        <Link
          href={safeReturnTo(from, `/supplier/${supplier.slug}`)}
          className="text-small text-slate-900 hover:underline"
        >
          {from ? tr.nav_back : tr.sp_back_panel}
        </Link>
        <div className="mb-6 mt-2">
          <div className="text-micro tracking-widest font-mono text-slate-700">{tr.sp_voices_label}</div>
          <h1 className="text-h2 sm:text-h1 font-semibold tracking-tight text-slate-900 mt-1">
            {supplier.name}
          </h1>
          <p className="text-small text-slate-600 mt-1.5">
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
