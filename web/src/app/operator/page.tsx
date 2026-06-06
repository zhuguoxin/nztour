import { redirect } from "next/navigation";
import Link from "next/link";
import { TopBar } from "../_components/top-bar";
import { getCurrentRole } from "@/lib/roles";
import { db } from "@/lib/db";
import { t, fmt } from "@/lib/i18n";

export const dynamic = "force-dynamic";

interface OpRow {
  id: string;
  slug: string;
  name: string;
  display_name: string | null;
  country: string;
  cover_color: string | null;
  course_count: number;
}

/**
 * /operator index.
 *
 *   - signed out                → /sign-in
 *   - 1 membership, non-admin   → straight to that operator's dashboard
 *   - admin                     → grid of ALL active operators (admins can
 *                                 manage anything)
 *   - 2+ memberships            → grid of just those operators
 *   - 0 memberships, non-admin  → "no access" panel
 */
export default async function OperatorIndex() {
  const [role, tr] = await Promise.all([getCurrentRole(), t()]);
  if (!role.userId) redirect("/sign-in");

  if (role.operators.length === 1 && !role.isAdmin) {
    redirect(`/operator/${role.operators[0].operator_slug}`);
  }

  // Build the operator list to show:
  //   admins: every active operator (with course count for sorting)
  //   others: their explicit memberships
  let cards: Array<OpRow & { role: string }> = [];
  if (role.isAdmin) {
    const { results } = await db()
      .prepare(
        `SELECT o.id, o.slug, o.name, o.display_name, o.country, o.cover_color,
                (SELECT COUNT(*) FROM courses c WHERE c.operator_id = o.id AND c.status='published') AS course_count
         FROM operators o
         WHERE o.status='active'
         ORDER BY course_count DESC, o.name`,
      )
      .all<OpRow>();
    cards = (results ?? []).map((r) => ({ ...r, role: "platform-admin" }));
  } else {
    // Hydrate basic operator fields for each membership.
    if (role.operators.length > 0) {
      const placeholders = role.operators.map(() => "?").join(",");
      const { results } = await db()
        .prepare(
          `SELECT o.id, o.slug, o.name, o.display_name, o.country, o.cover_color,
                  (SELECT COUNT(*) FROM courses c WHERE c.operator_id = o.id AND c.status='published') AS course_count
           FROM operators o
           WHERE o.id IN (${placeholders})
           ORDER BY o.name`,
        )
        .bind(...role.operators.map((o) => o.operator_id))
        .all<OpRow>();
      const opById = new Map(role.operators.map((o) => [o.operator_id, o.role]));
      cards = (results ?? []).map((r) => ({ ...r, role: opById.get(r.id) ?? "admin" }));
    }
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased text-[16px]">
      <TopBar />
      <main className="px-5 sm:px-8 py-10 max-w-5xl mx-auto">
        <div className="text-[11px] tracking-widest font-mono text-emerald-700/70">
          {tr.op_picker_label}
        </div>
        <h1 className="text-[26px] sm:text-[30px] font-semibold text-slate-900 mt-1">
          {role.isAdmin ? tr.op_picker_title_admin : tr.op_picker_title_user}
        </h1>
        <p className="text-[13.5px] text-slate-600 mt-1.5">
          {cards.length === 0
            ? tr.op_picker_empty_blurb
            : role.isAdmin
              ? fmt(tr.op_picker_admin_blurb, { n: cards.length })
              : fmt(
                  cards.length === 1 ? tr.op_picker_user_blurb_one : tr.op_picker_user_blurb_many,
                  { n: cards.length },
                )}
        </p>

        {cards.length === 0 ? (
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-6">
            <div className="text-[14px] text-slate-900 font-semibold">{tr.op_picker_none_title}</div>
            <p className="mt-2 text-[13.5px] text-slate-600">{tr.op_picker_none_body}</p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((o) => (
              <Link
                key={o.id}
                href={`/operator/${o.slug}`}
                className="rounded-2xl border border-slate-200 bg-white overflow-hidden hover:border-emerald-300 hover:shadow-[0_8px_32px_rgba(15,23,42,0.08)] transition"
              >
                <div
                  className="h-20"
                  style={{
                    background: o.cover_color ?? "linear-gradient(135deg,#1e293b 0%,#334155 100%)",
                  }}
                />
                <div className="p-4">
                  <div className="font-semibold text-[15px] text-slate-900">{o.display_name ?? o.name}</div>
                  <div className="flex items-center gap-2 mt-1.5 text-[12px] text-slate-500">
                    <span>{fmt(tr.op_picker_card_published, { n: o.course_count })}</span>
                    <span className="text-slate-300">·</span>
                    <span className="font-mono uppercase text-[10px]">{o.role}</span>
                  </div>
                  <div className="text-[12px] text-emerald-700 mt-3">{tr.op_picker_card_cta}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
