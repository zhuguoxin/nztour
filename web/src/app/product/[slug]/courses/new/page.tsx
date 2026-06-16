import Link from "next/link";
import { notFound } from "next/navigation";
import { TopBar } from "../../../../_components/top-bar";
import { requireOperatorMembership } from "@/lib/roles";
import { db } from "@/lib/db";
import { t } from "@/lib/i18n";
import { NewCourseTabs } from "./new-course-tabs";

export const dynamic = "force-dynamic";

export default async function NewCoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    await requireOperatorMembership(slug);
  } catch {
    notFound();
  }
  const op = await db()
    .prepare(
      `SELECT o.name, s.slug AS supplier_slug
       FROM operators o LEFT JOIN suppliers s ON s.id = o.supplier_id
       WHERE o.slug = ?`,
    )
    .bind(slug)
    .first<{ name: string; supplier_slug: string | null }>();
  if (!op) notFound();

  const tr = await t();

  return (
    <div className="min-h-screen bg-[#04241e] text-[#f0fdf4] font-sans antialiased">
      <TopBar />
      <main className="px-5 sm:px-8 py-10 max-w-3xl mx-auto">
        <div className="text-[11px] tracking-widest font-mono text-emerald-300/70">
          {tr.nc_label}
        </div>
        <h1 className="text-[28px] sm:text-[32px] font-semibold tracking-tight text-white mt-1">
          {tr.nc_title}
        </h1>

        <NewCourseTabs operatorSlug={slug} />
      </main>
    </div>
  );
}
