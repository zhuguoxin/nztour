import { redirect } from "next/navigation";
import Link from "next/link";
import { TopBar } from "../_components/top-bar";
import { getCurrentRole } from "@/lib/roles";
import { db } from "@/lib/db";

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
  const role = await getCurrentRole();
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
    <div className="min-h-screen bg-[#04241e] text-[#f0fdf4] font-sans antialiased text-[16px]">
      <TopBar />
      <main className="px-5 sm:px-8 py-10 max-w-5xl mx-auto">
        <div className="text-[11px] tracking-widest font-mono text-emerald-300/70">/OPERATOR</div>
        <h1 className="text-[26px] sm:text-[30px] font-semibold text-white mt-1">
          {role.isAdmin ? "All operators" : "Your operators"}
        </h1>
        <p className="text-[13.5px] text-[#a7d4b6] mt-1.5">
          {cards.length === 0
            ? "Nothing to manage yet."
            : role.isAdmin
              ? `You can manage any of these ${cards.length} as platform admin.`
              : `You have ${cards.length} operator membership${cards.length === 1 ? "" : "s"}. Pick one to open the console.`}
        </p>

        {cards.length === 0 ? (
          <div className="mt-6 rounded-xl border border-white/[.08] bg-[#0a3a2f] p-6">
            <div className="text-[14px] text-white font-semibold">No operator memberships</div>
            <p className="mt-2 text-[13.5px] text-[#a7d4b6]">
              You're signed in as a learner. To manage an operator's content, ask the platform
              admin to add you to <code className="font-mono text-emerald-300">operator_memberships</code>.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((o) => (
              <Link
                key={o.id}
                href={`/operator/${o.slug}`}
                className="rounded-2xl border border-white/[.08] bg-[#0a3a2f] overflow-hidden hover:border-emerald-400/40 hover:shadow-[0_8px_32px_rgba(52,211,153,0.10)] transition"
              >
                <div
                  className="h-20"
                  style={{
                    background: o.cover_color ?? "linear-gradient(135deg,#1e293b 0%,#334155 100%)",
                  }}
                />
                <div className="p-4">
                  <div className="font-semibold text-[15px] text-white">{o.display_name ?? o.name}</div>
                  <div className="flex items-center gap-2 mt-1.5 text-[12px] text-[#86b69a]">
                    <span>{o.course_count} published</span>
                    <span className="text-white/20">·</span>
                    <span className="font-mono uppercase text-[10px]">{o.role}</span>
                  </div>
                  <div className="text-[12px] text-emerald-300 mt-3">Open console →</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
