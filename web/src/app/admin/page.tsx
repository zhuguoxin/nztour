import Link from "next/link";
import { TopBar } from "../_components/top-bar";
import { getCurrentRole, requireAdmin } from "@/lib/roles";
import { db } from "@/lib/db";
import { grantMembership, revokeMembership } from "./actions";
import { t, fmt } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  let userId: string;
  try {
    userId = await requireAdmin();
  } catch {
    return <Forbidden />;
  }
  void userId;

  const [role, tr] = await Promise.all([getCurrentRole(), t()]);

  // List operators (id, slug, name) + every user with current memberships count
  const [opsRes, usersRes, membersRes] = await Promise.all([
    db()
      .prepare(`SELECT id, slug, name, status FROM operators ORDER BY name`)
      .all<{ id: string; slug: string; name: string; status: string }>(),
    db()
      .prepare(
        `SELECT id, email, name, agency_name, created_at FROM users ORDER BY created_at DESC LIMIT 100`,
      )
      .all<{ id: string; email: string; name: string | null; agency_name: string | null; created_at: number }>(),
    db()
      .prepare(
        `SELECT om.user_id, om.operator_id, om.role, o.name AS operator_name, o.slug AS operator_slug
         FROM operator_memberships om
         JOIN operators o ON o.id = om.operator_id
         ORDER BY o.name`,
      )
      .all<{ user_id: string; operator_id: string; role: string; operator_name: string; operator_slug: string }>(),
  ]);

  const operators = opsRes.results ?? [];
  const users = usersRes.results ?? [];
  const memberships = membersRes.results ?? [];

  // Group memberships by user
  const membershipsByUser = new Map<string, typeof memberships>();
  for (const m of memberships) {
    if (!membershipsByUser.has(m.user_id)) membershipsByUser.set(m.user_id, []);
    membershipsByUser.get(m.user_id)!.push(m);
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased text-[16px]">
      <TopBar
        breadcrumb={
          <span className="flex items-center gap-2">
            <Link href="/" className="hover:text-slate-900">{tr.nav_home}</Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900">{tr.admin_breadcrumb}</span>
          </span>
        }
      />

      <main className="px-5 sm:px-8 py-8 max-w-6xl mx-auto">
        <div className="text-[11px] tracking-widest font-mono text-lime-700/70">
          {tr.admin_chrome_label}
        </div>
        <h1 className="text-[26px] sm:text-[30px] font-semibold text-slate-900 mt-1">
          {tr.admin_title}
        </h1>
        <p className="text-[13.5px] text-slate-600 mt-1.5">{tr.admin_blurb}</p>

        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Stat label={tr.admin_stat_users} value={users.length.toString()} />
          <Stat label={tr.admin_stat_operators} value={operators.length.toString()} />
          <Stat label={tr.admin_stat_memberships} value={memberships.length.toString()} />
          <Stat label={tr.admin_stat_you} value={role.isAdmin ? tr.admin_you_admin : "—"} />
        </div>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <header className="px-5 py-4 border-b border-slate-200">
            <div className="font-semibold text-[14px] text-slate-900">{tr.admin_users_title}</div>
            <div className="text-[12px] text-slate-500 mt-0.5">{tr.admin_users_sub}</div>
          </header>
          <div>
            {users.length === 0 ? (
              <div className="px-5 py-8 text-center text-[13px] text-slate-500">
                {tr.admin_users_empty}
              </div>
            ) : (
              users.map((u) => {
                const userMems = membershipsByUser.get(u.id) ?? [];
                return (
                  <div
                    key={u.id}
                    className="px-5 py-4 border-t border-slate-100 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3 lg:items-center"
                  >
                    <div className="min-w-0">
                      <div className="text-[13.5px] text-slate-900">
                        {u.name ?? u.email}{" "}
                        {u.name ? <span className="text-slate-500 text-[12px]">({u.email})</span> : null}
                      </div>
                      <div className="text-[11.5px] text-slate-400 font-mono mt-0.5 truncate">
                        {u.id}
                      </div>
                      {userMems.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          {userMems.map((m) => (
                            <form key={`${m.user_id}_${m.operator_id}`} action={revokeMembership}>
                              <input type="hidden" name="user_id" value={m.user_id} />
                              <input type="hidden" name="operator_id" value={m.operator_id} />
                              <button
                                type="submit"
                                className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 transition"
                                title={fmt(tr.admin_revoke_tooltip, {
                                  role: m.role,
                                  operator: m.operator_name,
                                })}
                              >
                                {m.operator_name} · {m.role} <span className="opacity-60">✕</span>
                              </button>
                            </form>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    {/* Grant form */}
                    <form
                      action={grantMembership}
                      className="flex items-center gap-1.5"
                    >
                      <input type="hidden" name="user_id" value={u.id} />
                      <select
                        name="operator_id"
                        defaultValue=""
                        className="bg-white border border-slate-300 rounded-md px-2 py-1.5 text-[12.5px] text-slate-900 outline-none focus:border-emerald-500"
                      >
                        <option value="" disabled>
                          {tr.admin_grant_placeholder}
                        </option>
                        {operators.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.name}
                          </option>
                        ))}
                      </select>
                      <select
                        name="role"
                        defaultValue="admin"
                        className="bg-white border border-slate-300 rounded-md px-2 py-1.5 text-[12.5px] text-slate-900 outline-none focus:border-emerald-500"
                      >
                        <option value="admin">{tr.admin_role_admin}</option>
                        <option value="editor">{tr.admin_role_editor}</option>
                      </select>
                      <button
                        type="submit"
                        className="px-2.5 py-1.5 rounded-md bg-emerald-600 text-white font-semibold text-[12.5px] hover:bg-emerald-700"
                      >
                        {tr.admin_grant_button}
                      </button>
                    </form>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white">
          <header className="px-5 py-4 border-b border-slate-200">
            <div className="font-semibold text-[14px] text-slate-900">{tr.admin_operators_title}</div>
            <div className="text-[12px] text-slate-500 mt-0.5">{tr.admin_operators_sub}</div>
          </header>
          <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {operators.map((o) => (
              <Link
                key={o.id}
                href={`/product/${o.slug}`}
                className="px-3 py-2.5 rounded-md border border-slate-200 hover:border-emerald-300 text-[13px] text-slate-900 flex items-center justify-between"
              >
                <span>{o.name}</span>
                <span className="text-[11px] text-slate-500">{o.status}</span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-[11px] tracking-widest font-mono text-slate-500">{label.toUpperCase()}</div>
      <div className="text-[22px] font-semibold text-slate-900 mt-1 tabular-nums">{value}</div>
    </div>
  );
}

async function Forbidden() {
  const tr = await t();
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <div className="text-[11px] tracking-widest font-mono text-rose-700 mb-2">403</div>
        <h1 className="text-[24px] font-semibold text-slate-900">{tr.admin_403_title}</h1>
        <p className="mt-3 text-[14px] text-slate-600">{tr.admin_403_body}</p>
        <Link
          href="/"
          className="mt-6 inline-block px-4 py-2 rounded-md border border-slate-300 text-[14px] text-slate-700 hover:bg-slate-50"
        >
          {tr.op_d_403_home}
        </Link>
      </div>
    </div>
  );
}
