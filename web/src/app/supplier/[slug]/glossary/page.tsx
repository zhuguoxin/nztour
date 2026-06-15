import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { TopBar } from "../../../_components/top-bar";
import { requireSupplierMembership } from "@/lib/roles";
import { db } from "@/lib/db";
import { t, fmt } from "@/lib/i18n";
import { GlossaryPanel } from "../../../_components/glossary-panel";
import { listGlossaryEntries } from "@/lib/glossary";
import { TRANSLATE_LANGS } from "@/lib/translate";

export const dynamic = "force-dynamic";

export default async function SupplierGlossaryPage({
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

  const tr = await t();

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased text-[16px]">
      <TopBar
        breadcrumb={
          <span className="flex items-center gap-2 min-w-0">
            <Link href="/" className="hover:text-white shrink-0">{tr.nav_home}</Link>
            <span className="text-white/20 shrink-0">/</span>
            <Link href={`/supplier/${slug}`} className="hover:text-white shrink-0">
              {fmt(tr.sp_breadcrumb, { name: supplier.name })}
            </Link>
            <span className="text-white/20 shrink-0">/</span>
            <span className="text-white truncate">{tr.sp_p_nav_glossary}</span>
          </span>
        }
      />
      <main className="px-5 sm:px-8 py-8 max-w-4xl mx-auto">
        <Link href={`/supplier/${slug}`} className="text-[13px] text-emerald-700 hover:underline">
          {tr.sp_back_panel}
        </Link>
        <h1 className="text-[24px] sm:text-[28px] font-semibold tracking-tight text-slate-900 mt-2 mb-5">
          {tr.sp_p_nav_glossary}
        </h1>
        <GlossaryPanel
          scope="supplier"
          slug={supplier.slug}
          entries={await listGlossaryEntries({ supplierId: supplier.id })}
          languages={TRANSLATE_LANGS}
        />
      </main>
    </div>
  );
}
