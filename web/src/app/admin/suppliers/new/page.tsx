import Link from "next/link";
import { TopBar } from "../../../_components/top-bar";
import { requireAdmin } from "@/lib/roles";
import { db } from "@/lib/db";
import { t } from "@/lib/i18n";
import { createSupplier } from "../../actions";

export const dynamic = "force-dynamic";

const field =
  "w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-[13.5px] text-slate-900 outline-none focus:border-emerald-500";
const lbl = "block text-[12px] font-medium text-slate-600 mb-1";

export default async function NewSupplierPage() {
  try {
    await requireAdmin();
  } catch {
    return <Forbidden />;
  }

  const { results: users = [] } = await db()
    .prepare(`SELECT id, email, name FROM users ORDER BY created_at DESC LIMIT 200`)
    .all<{ id: string; email: string; name: string | null }>();
  const tr = await t();

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased text-[16px]">
      <TopBar />
      <main className="px-5 sm:px-8 py-8 max-w-xl mx-auto">
        <Link href="/admin" className="text-[13px] text-emerald-700 hover:underline">{tr.admin_back}</Link>
        <h1 className="text-[24px] sm:text-[28px] font-semibold text-slate-900 mt-2 mb-5">
          {tr.admin_new_supplier}
        </h1>

        <form action={createSupplier} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
          <label className="block">
            <span className={lbl}>{tr.admin_f_name} *</span>
            <input name="name" required maxLength={200} className={field} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className={lbl}>{tr.admin_f_slug}</span>
              <input name="slug" maxLength={50} className={field} />
            </label>
            <label className="block">
              <span className={lbl}>{tr.admin_sup_plan}</span>
              <select name="plan_tier" defaultValue="free" className={field}>
                <option value="free">free</option>
                <option value="starter">starter</option>
                <option value="pro">pro</option>
                <option value="enterprise">enterprise</option>
              </select>
            </label>
          </div>
          <label className="block">
            <span className={lbl}>{tr.admin_sup_legal}</span>
            <input name="legal_name" maxLength={200} className={field} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className={lbl}>{tr.admin_sup_website}</span>
              <input name="website" type="url" placeholder="https://" maxLength={400} className={field} />
            </label>
            <label className="block">
              <span className={lbl}>{tr.admin_sup_country}</span>
              <input name="country" defaultValue="NZ" maxLength={60} className={field} />
            </label>
          </div>
          <label className="block">
            <span className={lbl}>{tr.admin_sup_email}</span>
            <input name="contact_email" type="email" maxLength={200} className={field} />
          </label>

          <label className="block border-t border-slate-200 pt-4">
            <span className={lbl}>{tr.admin_sup_manager}</span>
            <select name="manager_user_id" defaultValue="" className={field}>
              <option value="">{tr.admin_manager_none}</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name ? `${u.name} (${u.email})` : u.email}</option>
              ))}
            </select>
            <span className="block text-[11.5px] text-slate-400 mt-1">{tr.admin_manager_hint}</span>
          </label>

          <div className="pt-1">
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-emerald-600 text-white font-semibold text-[13.5px] hover:bg-emerald-700"
            >
              {tr.admin_create}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

async function Forbidden() {
  const tr = await t();
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-[11px] font-mono text-rose-700 mb-2">403</div>
        <h1 className="text-[22px] font-semibold text-slate-900">{tr.admin_403_title}</h1>
        <Link href="/" className="mt-4 inline-block text-[14px] text-emerald-700 hover:underline">
          {tr.op_d_403_home}
        </Link>
      </div>
    </div>
  );
}
