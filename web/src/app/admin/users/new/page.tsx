import Link from "next/link";
import { TopBar } from "../../../_components/top-bar";
import { requireAdmin } from "@/lib/roles";
import { db } from "@/lib/db";
import { t } from "@/lib/i18n";
import { createUser } from "../../actions";

export const dynamic = "force-dynamic";

const field =
  "w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-[13.5px] text-slate-900 outline-none focus:border-emerald-500";
const lbl = "block text-[12px] font-medium text-slate-600 mb-1";

export default async function NewUserPage() {
  try {
    await requireAdmin();
  } catch {
    return <Forbidden />;
  }

  const { results: suppliers = [] } = await db()
    .prepare(`SELECT id, name FROM suppliers ORDER BY name`)
    .all<{ id: string; name: string }>();
  const tr = await t();

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased text-[16px]">
      <TopBar
        breadcrumb={
          <span className="flex items-center gap-2">
            <Link href="/admin" className="hover:text-slate-900">{tr.admin_breadcrumb}</Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900">{tr.admin_new_user}</span>
          </span>
        }
      />
      <main className="px-5 sm:px-8 py-8 max-w-xl mx-auto">
        <Link href="/admin" className="text-[13px] text-emerald-700 hover:underline">{tr.admin_back}</Link>
        <h1 className="text-[24px] sm:text-[28px] font-semibold text-slate-900 mt-2 mb-5">
          {tr.admin_new_user}
        </h1>

        <form action={createUser} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
          <label className="block">
            <span className={lbl}>{tr.admin_user_email} *</span>
            <input name="email" type="email" required maxLength={200} className={field} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className={lbl}>{tr.admin_f_name}</span>
              <input name="name" maxLength={200} className={field} />
            </label>
            <label className="block">
              <span className={lbl}>{tr.admin_user_agency}</span>
              <input name="agency_name" maxLength={200} className={field} />
            </label>
          </div>

          <div className="border-t border-slate-200 pt-4 space-y-2">
            <span className={lbl}>{tr.admin_user_assign}</span>
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <select name="supplier_id" defaultValue="" className={field}>
                <option value="">{tr.admin_manager_none}</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <select name="role" defaultValue="manager" className={field}>
                <option value="manager">{tr.admin_role_manager}</option>
                <option value="owner">{tr.admin_role_owner}</option>
                <option value="viewer">{tr.admin_role_viewer}</option>
              </select>
            </div>
            <span className="block text-[11.5px] text-slate-400">{tr.admin_user_invite_note}</span>
          </div>

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
