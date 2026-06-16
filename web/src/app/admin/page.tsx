import Link from "next/link";
import { TopBar } from "../_components/top-bar";
import { getCurrentRole, requireAdmin } from "@/lib/roles";
import { db } from "@/lib/db";
import {
  grantSupplierMembership,
  revokeSupplierMembership,
  approveSupplier,
  rejectSupplier,
} from "./actions";
import { PageBreadcrumb } from "../_components/page-breadcrumb";
import { t, fmt } from "@/lib/i18n";

export const dynamic = "force-dynamic";

// Width-less base for inline rows where flex/explicit widths control sizing.
const fieldBase =
  "bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-[12.5px] text-slate-900 outline-none focus:border-emerald-500";
const grantBtn =
  "px-3.5 py-1.5 rounded-md bg-emerald-600 text-white font-semibold text-[12.5px] hover:bg-emerald-700 shrink-0 whitespace-nowrap";

interface SupplierRow {
  id: string;
  slug: string;
  name: string;
  plan_tier: string;
  cover_r2_key: string | null;
  product_count: number;
}
interface UserRow {
  id: string;
  email: string;
  name: string | null;
  agency_name: string | null;
  created_at: number;
}
interface SupMem {
  user_id: string;
  supplier_id: string;
  role: string;
  supplier_name: string;
}
interface PendingRow {
  id: string;
  slug: string;
  name: string;
  rto_json: string;
  contact_email: string | null;
  poc_name: string | null;
  created_at: number;
  owner_email: string | null;
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  try {
    await requireAdmin();
  } catch {
    return <Forbidden />;
  }

  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const [role, tr] = await Promise.all([getCurrentRole(), t()]);

  const supBase = `SELECT s.id, s.slug, s.name, s.plan_tier, s.cover_r2_key,
                (SELECT COUNT(*) FROM operators o WHERE o.supplier_id = s.id) AS product_count
         FROM suppliers s`;
  const supStmt = query
    ? db()
        .prepare(`${supBase} WHERE s.name LIKE ? OR s.slug LIKE ? ORDER BY s.name`)
        .bind(`%${query}%`, `%${query}%`)
    : db().prepare(`${supBase} ORDER BY s.name`);

  const [supsRes, usersRes, supMemsRes, opCountRes, pendingRes] = await Promise.all([
    supStmt.all<SupplierRow>(),
    db()
      .prepare(
        `SELECT id, email, name, agency_name, created_at FROM users ORDER BY created_at DESC LIMIT 100`,
      )
      .all<UserRow>(),
    db()
      .prepare(
        `SELECT sm.user_id, sm.supplier_id, sm.role, s.name AS supplier_name
         FROM supplier_memberships sm JOIN suppliers s ON s.id = sm.supplier_id
         ORDER BY s.name`,
      )
      .all<SupMem>(),
    db().prepare(`SELECT COUNT(*) AS n FROM operators`).first<{ n: number }>(),
    db()
      .prepare(
        `SELECT s.id, s.slug, s.name, s.rto_json, s.contact_email, s.poc_name, s.created_at,
                (SELECT u.email FROM supplier_memberships m JOIN users u ON u.id = m.user_id
                 WHERE m.supplier_id = s.id AND m.role = 'owner' LIMIT 1) AS owner_email
         FROM suppliers s WHERE s.status = 'pending' ORDER BY s.created_at DESC`,
      )
      .all<PendingRow>(),
  ]);

  const suppliers = supsRes.results ?? [];
  const users = usersRes.results ?? [];
  const supMems = supMemsRes.results ?? [];
  const productCount = opCountRes?.n ?? 0;
  const pending = pendingRes.results ?? [];

  const memsBySupplier = new Map<string, SupMem[]>();
  const memsByUser = new Map<string, SupMem[]>();
  for (const m of supMems) {
    (memsBySupplier.get(m.supplier_id) ?? memsBySupplier.set(m.supplier_id, []).get(m.supplier_id)!).push(m);
    (memsByUser.get(m.user_id) ?? memsByUser.set(m.user_id, []).get(m.user_id)!).push(m);
  }
  const userById = new Map(users.map((u) => [u.id, u]));

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased text-[16px]">
      <TopBar />

      <main className="px-5 sm:px-8 py-8 max-w-6xl mx-auto">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <PageBreadcrumb
              className="mb-1.5"
              items={[{ href: "/", label: tr.nav_home }, { label: tr.admin_breadcrumb }]}
            />
            <div className="text-[11px] tracking-widest font-mono text-lime-700/70">{tr.admin_chrome_label}</div>
            <h1 className="text-[26px] sm:text-[30px] font-semibold text-slate-900 mt-1">{tr.admin_title}</h1>
            <p className="text-[13.5px] text-slate-600 mt-1.5">{tr.admin_blurb}</p>
          </div>
          <Link
            href="/admin/media"
            className="px-3 py-2 rounded-md border border-slate-300 text-slate-700 text-[13px] hover:bg-slate-50 shrink-0"
          >
            🖼 {tr.admin_media_library}
          </Link>
        </div>

        {/* 1. Stats */}
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Stat label={tr.admin_stat_suppliers} value={suppliers.length.toString()} />
          <Stat label={tr.admin_stat_operators} value={productCount.toString()} />
          <Stat label={tr.admin_stat_users} value={users.length.toString()} />
          <Stat label={tr.admin_stat_you} value={role.isAdmin ? tr.admin_you_admin : "—"} />
        </div>

        {/* 1.5 Pending supplier approvals (self-serve customer registrations) */}
        {pending.length > 0 ? (
          <section className="mt-8 rounded-2xl border border-amber-300 bg-amber-50/40 overflow-hidden">
            <header className="px-5 py-4 border-b border-amber-200">
              <div className="font-semibold text-[14px] text-slate-900">
                {tr.admin_pending_title} <span className="text-amber-700">({pending.length})</span>
              </div>
              <div className="text-[12px] text-slate-500 mt-0.5">{tr.admin_pending_sub}</div>
            </header>
            <div>
              {pending.map((p) => {
                let rtos: string[] = [];
                try {
                  const v = JSON.parse(p.rto_json || "[]");
                  if (Array.isArray(v)) rtos = v.filter((x): x is string => typeof x === "string");
                } catch {
                  /* ignore */
                }
                return (
                  <div
                    key={p.id}
                    className="px-5 py-4 border-t border-amber-200/70 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3 lg:items-center"
                  >
                    <div className="min-w-0">
                      <div className="text-[14px] font-medium text-slate-900">{p.name}</div>
                      <div className="text-[12px] text-slate-600 mt-0.5">
                        {p.poc_name ? `${p.poc_name} · ` : ""}
                        {p.owner_email ?? p.contact_email ?? "—"}
                      </div>
                      {rtos.length > 0 ? (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {rtos.map((r) => (
                            <span
                              key={r}
                              className="px-2 py-0.5 rounded-full bg-white border border-amber-200 text-amber-800 text-[11px]"
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[11.5px] text-slate-400 mt-1">{tr.admin_pending_no_rto}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <form action={approveSupplier}>
                        <input type="hidden" name="supplier_id" value={p.id} />
                        <button
                          type="submit"
                          className="px-3.5 py-1.5 rounded-md bg-emerald-600 text-white font-semibold text-[12.5px] hover:bg-emerald-700"
                        >
                          {tr.admin_pending_approve}
                        </button>
                      </form>
                      <form action={rejectSupplier}>
                        <input type="hidden" name="supplier_id" value={p.id} />
                        <button
                          type="submit"
                          className="px-3.5 py-1.5 rounded-md border border-slate-300 text-slate-600 text-[12.5px] hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700"
                        >
                          {tr.admin_pending_reject}
                        </button>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        {/* 2. Supplier management */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <header className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="font-semibold text-[14px] text-slate-900">{tr.admin_suppliers_title}</div>
              <div className="text-[12px] text-slate-500 mt-0.5">{tr.admin_suppliers_sub}</div>
            </div>
            <div className="flex items-center gap-2">
              <form method="get" className="flex items-center gap-1.5">
                <input
                  type="search"
                  name="q"
                  defaultValue={query}
                  placeholder={tr.admin_search_ph}
                  className="w-44 bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-[12.5px] text-slate-900 outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="px-2.5 py-1.5 rounded-md border border-slate-300 text-slate-700 text-[12.5px] hover:bg-slate-50"
                >
                  🔍
                </button>
              </form>
              <Link
                href="/admin/suppliers/new"
                className="px-3 py-1.5 rounded-md bg-emerald-600 text-white font-semibold text-[12.5px] hover:bg-emerald-700 shrink-0"
              >
                + {tr.admin_new_supplier}
              </Link>
            </div>
          </header>
          <div className="p-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
            {suppliers.length === 0 ? (
              <div className="col-span-full px-2 py-8 text-center text-[13px] text-slate-500">{tr.admin_suppliers_empty}</div>
            ) : (
              suppliers.map((s) => {
                const mgrs = memsBySupplier.get(s.id) ?? [];
                return (
                  <div key={s.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center gap-3">
                      {/* Supplier cover (read-only; set on the supplier's own profile) */}
                      <div className="w-16 h-11 rounded-md overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center text-slate-300 text-[16px]">
                        {s.cover_r2_key ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={`/api/supplier-cover?slug=${encodeURIComponent(s.slug)}`}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          "🏢"
                        )}
                      </div>
                      <div className="min-w-0 text-[13.5px] text-slate-900">
                        <Link href={`/supplier/${s.slug}`} className="font-medium hover:underline">{s.name}</Link>
                        <span className="text-slate-500 text-[12px] ml-1.5">
                          · {s.plan_tier} · {fmt(tr.admin_sup_products, { n: s.product_count })}
                        </span>
                      </div>
                    </div>
                    {mgrs.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {mgrs.map((m) => {
                          const u = userById.get(m.user_id);
                          return (
                            <form key={m.user_id} action={revokeSupplierMembership}>
                              <input type="hidden" name="user_id" value={m.user_id} />
                              <input type="hidden" name="supplier_id" value={s.id} />
                              <button
                                type="submit"
                                className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 transition"
                              >
                                {u?.email ?? m.user_id} · {m.role} <span className="opacity-60">✕</span>
                              </button>
                            </form>
                          );
                        })}
                      </div>
                    ) : null}
                    {/* Assign manager */}
                    <form action={grantSupplierMembership} className="mt-3 flex items-center gap-1.5">
                      <input type="hidden" name="supplier_id" value={s.id} />
                      <select name="user_id" defaultValue="" className={fieldBase + " flex-1 min-w-0"}>
                        <option value="" disabled>{tr.admin_pick_user}</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>{u.email}</option>
                        ))}
                      </select>
                      <select name="role" defaultValue="manager" className={fieldBase + " w-[5.5rem] shrink-0"}>
                        <option value="manager">{tr.admin_role_manager}</option>
                        <option value="owner">{tr.admin_role_owner}</option>
                        <option value="viewer">{tr.admin_role_viewer}</option>
                      </select>
                      <button type="submit" className={grantBtn}>{tr.admin_sup_grant}</button>
                    </form>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* 3. User management */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <header className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
            <div>
              <div className="font-semibold text-[14px] text-slate-900">{tr.admin_users_title}</div>
              <div className="text-[12px] text-slate-500 mt-0.5">{tr.admin_users_sub}</div>
            </div>
            <Link
              href="/admin/users/new"
              className="px-3 py-1.5 rounded-md bg-emerald-600 text-white font-semibold text-[12.5px] hover:bg-emerald-700 shrink-0"
            >
              + {tr.admin_new_user}
            </Link>
          </header>
          <div>
            {users.length === 0 ? (
              <div className="px-5 py-8 text-center text-[13px] text-slate-500">{tr.admin_users_empty}</div>
            ) : (
              users.map((u) => {
                const mems = memsByUser.get(u.id) ?? [];
                return (
                  <div
                    key={u.id}
                    className="px-5 py-4 border-t border-slate-100 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3 lg:items-center"
                  >
                    <div className="min-w-0">
                      <div className="text-[13.5px] text-slate-900 truncate">
                        {u.name ?? u.email}{" "}
                        {u.name ? <span className="text-slate-500 text-[12px]">({u.email})</span> : null}
                        {u.agency_name ? <span className="text-slate-400 text-[12px]"> · {u.agency_name}</span> : null}
                      </div>
                      <div className="text-[11.5px] text-slate-400 font-mono mt-0.5 truncate">{u.id}</div>
                      {mems.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {mems.map((m) => (
                            <form key={m.supplier_id} action={revokeSupplierMembership}>
                              <input type="hidden" name="user_id" value={u.id} />
                              <input type="hidden" name="supplier_id" value={m.supplier_id} />
                              <button
                                type="submit"
                                className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 transition"
                              >
                                {m.supplier_name} · {m.role} <span className="opacity-60">✕</span>
                              </button>
                            </form>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    {/* Assign to supplier */}
                    <form action={grantSupplierMembership} className="flex items-center gap-1.5 shrink-0">
                      <input type="hidden" name="user_id" value={u.id} />
                      <select name="supplier_id" defaultValue="" className={fieldBase + " w-[150px] shrink-0"}>
                        <option value="" disabled>{tr.admin_f_supplier}</option>
                        {suppliers.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                      <select name="role" defaultValue="manager" className={fieldBase + " w-[5.5rem] shrink-0"}>
                        <option value="manager">{tr.admin_role_manager}</option>
                        <option value="owner">{tr.admin_role_owner}</option>
                        <option value="viewer">{tr.admin_role_viewer}</option>
                      </select>
                      <button type="submit" className={grantBtn}>{tr.admin_sup_grant}</button>
                    </form>
                  </div>
                );
              })
            )}
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
