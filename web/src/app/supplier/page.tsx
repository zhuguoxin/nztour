import { redirect } from "next/navigation";
import { mediaUrl } from "@/lib/media";
import Link from "next/link";
import { TopBar } from "../_components/top-bar";
import { getCurrentRole } from "@/lib/roles";
import { db } from "@/lib/db";
import { t, fmt } from "@/lib/i18n";
import { requireOnboarded } from "@/lib/onboarding";
import { fallbackCover } from "@/lib/cover";

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
  /** Supplier's own uploaded cover (suppliers.cover_r2_key). */
  cover_r2_key: string | null;
  /** Fallback: a product's cover under this supplier. */
  op_cover_r2_key: string | null;
  op_cover_url: string | null;
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
                   WHERE o.supplier_id = s.id AND c.status='published') AS course_count,
                s.cover_r2_key,
                (SELECT o.cover_r2_key FROM operators o WHERE o.supplier_id = s.id AND o.status='active'
                   AND o.cover_r2_key IS NOT NULL ORDER BY o.created_at LIMIT 1) AS op_cover_r2_key,
                (SELECT o.cover_image_url FROM operators o WHERE o.supplier_id = s.id AND o.status='active'
                   AND o.cover_image_url IS NOT NULL ORDER BY o.created_at LIMIT 1) AS op_cover_url
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
                   WHERE o.supplier_id = s.id AND c.status='published') AS course_count,
                s.cover_r2_key,
                (SELECT o.cover_r2_key FROM operators o WHERE o.supplier_id = s.id AND o.status='active'
                   AND o.cover_r2_key IS NOT NULL ORDER BY o.created_at LIMIT 1) AS op_cover_r2_key,
                (SELECT o.cover_image_url FROM operators o WHERE o.supplier_id = s.id AND o.status='active'
                   AND o.cover_image_url IS NOT NULL ORDER BY o.created_at LIMIT 1) AS op_cover_url
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
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased text-body">
      <TopBar />
      <main className="px-5 sm:px-8 py-10 max-w-5xl mx-auto">
        <p className="text-small text-slate-600">
          {cards.length === 0
            ? tr.sup_picker_empty_blurb
            : role.isAdmin
              ? fmt(tr.sup_picker_admin_blurb, { n: cards.length })
              : fmt(tr.sup_picker_user_blurb, { n: cards.length })}
        </p>

        {cards.length === 0 ? (
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-6">
            <div className="text-small text-slate-900 font-semibold">{tr.sup_picker_none_title}</div>
            <p className="mt-2 text-small text-slate-600">{tr.sup_picker_none_body}</p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((s) => {
              const cover = s.cover_r2_key
                ? mediaUrl(s.cover_r2_key)
                : s.op_cover_r2_key
                  ? mediaUrl(s.op_cover_r2_key)
                  : (s.op_cover_url ?? fallbackCover(s.slug));
              return (
              <Link
                key={s.id}
                href={`/supplier/${s.slug}`}
                className="rounded-2xl border border-slate-200 bg-white overflow-hidden hover:border-emerald-300 hover:shadow-[0_8px_32px_rgba(15,23,42,0.08)] transition"
              >
                <div className="aspect-[16/9] relative overflow-hidden bg-[linear-gradient(135deg,#04241e_0%,#0a3a2f_100%)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={cover} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm text-micro font-medium text-white/90 border border-white/15">
                    {s.country}
                    {s.hq_city ? ` · ${s.hq_city}` : ""}
                  </div>
                </div>
                <div className="p-4">
                  <div className="font-semibold text-body text-slate-900">{s.name}</div>
                  {s.legal_name && s.legal_name !== s.name ? (
                    <div className="text-caption text-slate-500 mt-0.5 truncate">{s.legal_name}</div>
                  ) : null}
                  <div className="flex items-center gap-2 mt-2 text-caption text-slate-500">
                    <span>{fmt(tr.sup_picker_card_products, { n: s.product_count })}</span>
                    <span className="text-slate-300">·</span>
                    <span>{fmt(tr.sup_picker_card_published, { n: s.course_count })}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-mono uppercase text-micro text-slate-700">{s.role}</span>
                    <span className="text-caption text-slate-900">{tr.sup_picker_card_cta}</span>
                  </div>
                </div>
              </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
