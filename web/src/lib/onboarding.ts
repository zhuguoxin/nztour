import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { db } from "./db";
import { ensureUser } from "./progress";

export type UserType = "learner" | "supplier_manager";

export interface OnboardingState {
  userId: string;
  email: string;
  onboarded: boolean;
  userType: UserType | null;
}

function adminEmails(): string[] {
  try {
    const { env } = getCloudflareContext();
    return (env.ADMIN_EMAILS as string | undefined)?.split(",").map((s) => s.trim().toLowerCase()) ?? [];
  } catch {
    return [];
  }
}

/**
 * Read the current user's onboarding state. Calls ensureUser first so the D1
 * row exists (mirrors Clerk identity + reconciles email/id migrations), then
 * reads the gating columns. Does NOT redirect — callers decide.
 *
 * Platform admins (already in platform_admins OR listed in ADMIN_EMAILS) are
 * always reported as onboarded so they never get stuck behind the form.
 */
export async function getOnboardingState(): Promise<OnboardingState | null> {
  const { userId } = await auth();
  if (!userId) return null;
  const u = await currentUser();
  const email = u?.emailAddresses?.[0]?.emailAddress?.toLowerCase() ?? "";
  if (email) {
    await ensureUser({ id: userId, email, name: u?.fullName ?? null });
  }

  const row = await db()
    .prepare(`SELECT onboarding_completed_at, user_type FROM users WHERE id = ?`)
    .bind(userId)
    .first<{ onboarding_completed_at: number | null; user_type: string | null }>();

  const isAdmin =
    (email && adminEmails().includes(email)) ||
    !!(await db().prepare(`SELECT 1 AS x FROM platform_admins WHERE user_id = ?`).bind(userId).first<{ x: number }>());

  return {
    userId,
    email,
    onboarded: isAdmin || !!row?.onboarding_completed_at,
    userType: (row?.user_type as UserType | null) ?? null,
  };
}

/**
 * Page-level guard — put at the TOP of a protected page body (NOT middleware,
 * which runs on the edge and can't reliably reach D1).
 *   signed out      → /sign-in
 *   not onboarded   → /onboarding
 *   onboarded/admin → returns the state
 */
export async function requireOnboarded(): Promise<OnboardingState> {
  const s = await getOnboardingState();
  if (!s) redirect("/sign-in");
  if (!s.onboarded) redirect("/onboarding");
  return s;
}
