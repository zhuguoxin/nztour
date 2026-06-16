import { redirect } from "next/navigation";
import Link from "next/link";
import { TopBar } from "../_components/top-bar";
import { PageBreadcrumb } from "../_components/page-breadcrumb";
import { getCurrentRole } from "@/lib/roles";
import { db } from "@/lib/db";
import { t, fmt } from "@/lib/i18n";
import { requireOnboarded } from "@/lib/onboarding";

export const dynamic = "force-dynamic";

interface SupRow {
  id: string;
  slug: string;
  name: string;
  legal_name: string | null;
  country: string;
  hq_city: string | null;
  product_count: number;
  course_count: number;
}

/**
 * /supplier index — supplier (holding entity) picker.
 *
 *   - signed out                     → /sign-in
 *   - 0 supplier-memberships, !admin → "no access" panel
 *   - 1 supplier-membership, !admin  → straight to /supplier/<slug>
 *   - admin                          → grid of ALL active suppliers
 *   - 2+ supplier-memberships        → grid of the user's suppliers
 *
 * Supplier ≠ product. A supplier OWNS one or more products. Single-product
 * suppliers (Hermitage etc.) still appear here so the model is uniform; the
 * dashboard auto-folds the layer when product_count = 1.
 */
export default async function SupplierIndex() {
  await requireOnboarded();
  const [role, tr] = await Promise.all([getCurrentRole(), t()]);
  if (!role.userId) redirect("/sign-in");

  if (role.suppliers.length === 1 && !role.isAdmin) {
    redirect(`/supplier/${role.suppliers[0].supplier_slug}`);
  }

  let cards: Array<SupRow & { role: string }> = [];
  if (role.isAdmin) {
    const { results } = await db()
      .prepare(
        `SELECT s.id, s.slug, s.name, s.legal_name, s.country, s.hq_city,
                (SELECT COUNT(*) FROM operators o WHERE o.supplier_id = s.id AND o.status='active') AS product_count,
                (SELECT COUNT(*) FROM courses c
                   JOIN operators o ON o.id = c.operator_id
                   WHERE o.supplier_id = s.id AND c.status='published') AS course_count
         FROM suppliers s
         WHERE s.status='active'
         ORDER BY product_count DESC, s.name`,
      )
      .all<SupRow>();
    cards = (results ?? []).map((r) => ({ ...r, role: "platform-admin" }));
  } else if (role.suppliers.length > 0) {
    const placeholders = role.suppliers.map(() => "?").join(",");
    const { results } = await db()
      .prepare(
        `SELECT s.id, s.slug, s.name, s.legal_name, s.country, s.hq_city,
                (SELECT COUNT(*) FROM operators o WHERE o.supplier_id = s.id AND o.status='active') AS product_count,
                (SELECT COUNT(*) FROM courses c
                   JOIN operators o ON o.id = c.operator_id
                   WHERE o.supplier_id = s.id AND c.status='published') AS course_count
         FROM suppliers s
         WHERE s.id IN (${placeholders})
         ORDER BY s.name`,
      )
      .bind(...role.suppliers.map((s) => s.supplier_id))
      .all<SupRow>();
    const roleById = new Map(role.suppliers.map((s) => [s.supplier_id, s.role]));
    cards = (results ?? []).map((r) => ({ ...r, role: roleById.get(r.id) ?? "manager" }));
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased text-[16px]">
      <TopBar />
      <main className="px-5 sm:px-8 py-10 max-w-5xl mx-auto">
        <PageBreadcrumb
          className="mb-2"
          items={[
            { href: "/", label: tr.nav_home },
            { label: role.isAdmin ? tr.sup_picker_title_admin : tr.sup_picker_title_user },
          ]}
        />
        <div className="text-[11px] tracking-widest font-mono text-emerald-700/70">
          {tr.sup_picker_label}
        </div>
        <h1 className="text-[26px] sm:text-[30px] font-semibold text-slate-900 mt-1">
          {role.isAdmin ? tr.sup_picker_title_admin : tr.sup_picker_title_user}
        </h1>
        <p className="text-[13.5px] text-slate-600 mt-1.5">
          {cards.length === 0
            ? tr.sup_picker_empty_blurb
            : role.isAdmin
              ? fmt(tr.sup_picker_admin_blurb, { n: cards.length })
              : fmt(tr.sup_picker_user_blurb, { n: cards.length })}
        </p>

        {cards.length === 0 ? (
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-6">
            <div className="text-[14px] text-slate-900 font-semibold">{tr.sup_picker_none_title}</div>
            <p className="mt-2 text-[13.5px] text-slate-600">{tr.sup_picker_none_body}</p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((s) => (
              <Link
                key={s.id}
                href={`/supplier/${s.slug}`}
                className="rounded-2xl border border-slate-200 bg-white overflow-hidden hover:border-emerald-300 hover:shadow-[0_8px_32px_rgba(15,23,42,0.08)] transition"
              >
                <div className="h-20 bg-[linear-gradient(135deg,#04241e_0%,#0a3a2f_100%)] flex items-end p-3">
                  <div className="text-[11px] font-mono text-emerald-200/80 uppercase tracking-wider">
                    {s.country}
                    {s.hq_city ? ` · ${s.hq_city}` : ""}
                  </div>
                </div>
                <div className="p-4">
                  <div className="font-semibold text-[15px] text-slate-900">{s.name}</div>
                  {s.legal_name && s.legal_name !== s.name ? (
                    <div className="text-[11.5px] text-slate-500 mt-0.5 truncate">{s.legal_name}</div>
                  ) : null}
                  <div className="flex items-center gap-2 mt-2 text-[12px] text-slate-500">
                    <span>{fmt(tr.sup_picker_card_products, { n: s.product_count })}</span>
                    <span className="text-slate-300">·</span>
                    <span>{fmt(tr.sup_picker_card_published, { n: s.course_count })}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-mono uppercase text-[10px] text-slate-500">{s.role}</span>
                    <span className="text-[12px] text-emerald-700">{tr.sup_picker_card_cta}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
