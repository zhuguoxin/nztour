import Link from "next/link";
import { TopBar } from "../../_components/top-bar";
import { requireAdmin } from "@/lib/roles";
import { db } from "@/lib/db";
import { t } from "@/lib/i18n";
import { PlatformMediaLibrary } from "./platform-media-library";

export const dynamic = "force-dynamic";

export default async function AdminMediaPage() {
  try {
    await requireAdmin();
  } catch {
    return <Forbidden />;
  }

  const { results: suppliers = [] } = await db()
    .prepare(`SELECT slug, name FROM suppliers ORDER BY name`)
    .all<{ slug: string; name: string }>();
  const tr = await t();

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased text-body">
      <TopBar />
      <main className="px-5 sm:px-8 py-8 max-w-6xl mx-auto">
        <Link href="/admin" className="text-small text-slate-900 hover:underline">{tr.admin_back}</Link>
        <h1 className="text-h2 sm:text-h1 font-semibold text-slate-900 mt-2">{tr.admin_media_title}</h1>
        <p className="text-small text-slate-600 mt-1 mb-5">{tr.admin_media_sub}</p>
        <PlatformMediaLibrary suppliers={suppliers} />
      </main>
    </div>
  );
}

async function Forbidden() {
  const tr = await t();
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-micro font-mono text-rose-700 mb-2">403</div>
        <h1 className="text-h2 font-semibold text-slate-900">{tr.admin_403_title}</h1>
        <Link href="/" className="mt-4 inline-block text-small text-slate-900 hover:underline">
          {tr.op_d_403_home}
        </Link>
      </div>
    </div>
  );
}
