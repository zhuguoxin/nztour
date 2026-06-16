import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { TopBar } from "../_components/top-bar";
import { db } from "@/lib/db";
import { t } from "@/lib/i18n";
import { getOnboardingState } from "@/lib/onboarding";
import { LearnerForm } from "./learner-form";
import { CustomerForm } from "./customer-form";
import { RoleChooser } from "./role-chooser";

export const dynamic = "force-dynamic";

/**
 * Post-auth router + onboarding form host.
 *   - signed out      → /sign-in
 *   - already onboarded → routed to their home by user_type
 *   - new user        → renders the customer/learner form per ?as=, or a role
 *                       chooser when no role was carried through sign-up.
 */
export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ as?: string }>;
}) {
  const { as } = await searchParams;
  const state = await getOnboardingState();
  if (!state) redirect("/sign-in");

  if (state.onboarded) {
    if (state.userType === "supplier_manager") {
      const sup = await db()
        .prepare(
          `SELECT s.slug FROM supplier_memberships m JOIN suppliers s ON s.id = m.supplier_id
           WHERE m.user_id = ? ORDER BY s.created_at LIMIT 1`,
        )
        .bind(state.userId)
        .first<{ slug: string }>();
      redirect(sup ? `/supplier/${sup.slug}` : "/supplier");
    }
    redirect("/learn");
  }

  const u = await currentUser();
  const email = u?.emailAddresses?.[0]?.emailAddress ?? "";
  const defaultFirst = u?.firstName ?? "";
  const defaultLast = u?.lastName ?? "";
  const tr = await t();

  const role = as === "customer" ? "customer" : as === "user" ? "user" : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <TopBar />
      <main className="px-5 sm:px-8 py-10 max-w-3xl mx-auto">
        {role === "customer" ? (
          <CustomerForm email={email} defaultFirst={defaultFirst} defaultLast={defaultLast} />
        ) : role === "user" ? (
          <LearnerForm email={email} defaultFirst={defaultFirst} defaultLast={defaultLast} />
        ) : (
          <RoleChooser title={tr.ob_choose_title} blurb={tr.ob_choose_blurb} />
        )}
      </main>
    </div>
  );
}
