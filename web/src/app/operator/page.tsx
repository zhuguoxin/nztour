import { redirect } from "next/navigation";
import Link from "next/link";
import { TopBar } from "../_components/top-bar";
import { getCurrentRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

/**
 * /operator index.
 *
 * If the user manages exactly one operator → auto-redirect to that dashboard.
 * If they manage several → list them.
 * If they manage none and are an admin → explain how to grant via /admin.
 * Otherwise → forbidden message.
 */
export default async function OperatorIndex() {
  const role = await getCurrentRole();
  if (!role.userId) redirect("/sign-in");

  if (role.operators.length === 1 && !role.isAdmin) {
    redirect(`/operator/${role.operators[0].operator_slug}`);
  }

  return (
    <div className="min-h-screen bg-[#04241e] text-[#f0fdf4] font-sans antialiased text-[16px]">
      <TopBar />
      <main className="px-5 sm:px-8 py-10 max-w-3xl mx-auto">
        <div className="text-[11px] tracking-widest font-mono text-emerald-300/70">/OPERATOR</div>
        <h1 className="text-[26px] sm:text-[30px] font-semibold text-white mt-1">
          Operator consoles
        </h1>
        {role.operators.length === 0 ? (
          <div className="mt-6 rounded-xl border border-white/[.08] bg-[#0a3a2f] p-6">
            <div className="text-[14px] text-white font-semibold">No operator memberships</div>
            <p className="mt-2 text-[13.5px] text-[#a7d4b6]">
              You're signed in as a learner. To manage an operator's content, ask the platform
              admin to add you to <code className="font-mono text-emerald-300">operator_memberships</code>.
            </p>
            {role.isAdmin ? (
              <Link
                href="/admin"
                className="mt-4 inline-block px-3.5 py-2 rounded-md bg-emerald-400 text-[#04241e] font-semibold text-[13px] hover:bg-emerald-300"
              >
                Grant yourself an operator role →
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {role.operators.map((o) => (
              <Link
                key={o.operator_id}
                href={`/operator/${o.operator_slug}`}
                className="rounded-xl border border-white/[.08] bg-[#0a3a2f] p-5 hover:border-emerald-400/40 transition"
              >
                <div className="text-[12px] text-[#86b69a]">Operator</div>
                <div className="text-[18px] font-semibold text-white mt-0.5">{o.operator_name}</div>
                <div className="text-[12px] text-emerald-300 mt-3">Open console →</div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
