import Link from "next/link";
import { TopBar } from "../_components/top-bar";
import { getCurrentRole, requireAdmin } from "@/lib/roles";
import { db } from "@/lib/db";
import { grantMembership, revokeMembership } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  let userId: string;
  try {
    userId = await requireAdmin();
  } catch {
    return <Forbidden />;
  }
  void userId;

  const role = await getCurrentRole();

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
    <div className="min-h-screen bg-[#04241e] text-[#f0fdf4] font-sans antialiased text-[16px]">
      <TopBar
        breadcrumb={
          <span className="flex items-center gap-2">
            <Link href="/" className="hover:text-white">Home</Link>
            <span className="text-white/20">/</span>
            <span className="text-white">Platform admin</span>
          </span>
        }
      />

      <main className="px-5 sm:px-8 py-8 max-w-6xl mx-auto">
        <div className="text-[11px] tracking-widest font-mono text-lime-300/70">/ADMIN</div>
        <h1 className="text-[26px] sm:text-[30px] font-semibold text-white mt-1">
          Platform admin
        </h1>
        <p className="text-[13.5px] text-[#a7d4b6] mt-1.5">
          Manage users and grant operator memberships. Use sparingly — every action writes to D1.
        </p>

        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Stat label="Users" value={users.length.toString()} />
          <Stat label="Operators" value={operators.length.toString()} />
          <Stat label="Memberships" value={memberships.length.toString()} />
          <Stat label="You" value={role.isAdmin ? "✓ admin" : "—"} />
        </div>

        <section className="mt-8 rounded-2xl border border-white/[.08] bg-[#0a3a2f] overflow-hidden">
          <header className="px-5 py-4 border-b border-white/[.06]">
            <div className="font-semibold text-[14px] text-white">Users + memberships</div>
            <div className="text-[12px] text-[#86b69a] mt-0.5">
              Last 100 by signup time. Submit the form on any row to grant a new operator membership.
            </div>
          </header>
          <div>
            {users.length === 0 ? (
              <div className="px-5 py-8 text-center text-[13px] text-[#86b69a]">No users yet.</div>
            ) : (
              users.map((u) => {
                const userMems = membershipsByUser.get(u.id) ?? [];
                return (
                  <div
                    key={u.id}
                    className="px-5 py-4 border-t border-white/[.04] grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3 lg:items-center"
                  >
                    <div className="min-w-0">
                      <div className="text-[13.5px] text-white">
                        {u.name ?? u.email}{" "}
                        {u.name ? <span className="text-[#86b69a] text-[12px]">({u.email})</span> : null}
                      </div>
                      <div className="text-[11.5px] text-[#86b69a] font-mono mt-0.5 truncate">
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
                                className="px-2 py-0.5 rounded-full bg-emerald-400/10 border border-emerald-400/30 text-emerald-300 text-[11px] hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-300 transition"
                                title={`Revoke ${m.role} access to ${m.operator_name}`}
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
                        className="bg-[#062b22] border border-white/[.10] rounded-md px-2 py-1.5 text-[12.5px] text-white outline-none focus:border-emerald-400/50"
                      >
                        <option value="" disabled>
                          Grant operator…
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
                        className="bg-[#062b22] border border-white/[.10] rounded-md px-2 py-1.5 text-[12.5px] text-white outline-none focus:border-emerald-400/50"
                      >
                        <option value="admin">admin</option>
                        <option value="editor">editor</option>
                      </select>
                      <button
                        type="submit"
                        className="px-2.5 py-1.5 rounded-md bg-emerald-400 text-[#04241e] font-semibold text-[12.5px] hover:bg-emerald-300"
                      >
                        Grant
                      </button>
                    </form>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-white/[.08] bg-[#0a3a2f]">
          <header className="px-5 py-4 border-b border-white/[.06]">
            <div className="font-semibold text-[14px] text-white">Operators</div>
            <div className="text-[12px] text-[#86b69a] mt-0.5">
              Tap to open the console as admin.
            </div>
          </header>
          <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {operators.map((o) => (
              <Link
                key={o.id}
                href={`/operator/${o.slug}`}
                className="px-3 py-2.5 rounded-md border border-white/[.08] hover:border-emerald-400/40 text-[13px] text-white flex items-center justify-between"
              >
                <span>{o.name}</span>
                <span className="text-[11px] text-[#86b69a]">{o.status}</span>
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
    <div className="rounded-xl border border-white/[.08] bg-[#0a3a2f] p-4">
      <div className="text-[11px] tracking-widest font-mono text-[#86b69a]">{label.toUpperCase()}</div>
      <div className="text-[22px] font-semibold text-white mt-1 tabular-nums">{value}</div>
    </div>
  );
}

function Forbidden() {
  return (
    <div className="min-h-screen bg-[#04241e] text-[#f0fdf4] font-sans antialiased flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <div className="text-[11px] tracking-widest font-mono text-rose-300 mb-2">403</div>
        <h1 className="text-[24px] font-semibold text-white">Admin only</h1>
        <p className="mt-3 text-[14px] text-[#a7d4b6]">
          You're signed in but not a platform admin. If your email is on the allow-list, visit
          /learn first to trigger the bootstrap.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block px-4 py-2 rounded-md border border-white/[.10] text-[14px] text-[#d8f0e1] hover:bg-white/[.06]"
        >
          ← Home
        </Link>
      </div>
    </div>
  );
}
