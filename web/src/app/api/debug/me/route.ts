/**
 * Debug endpoint — returns the current request's auth + role state so we
 * can diagnose admin-pill / membership issues without server-side log
 * plumbing. Remove once the prod Clerk migration is settled.
 *
 * GET /api/debug/me
 *
 * Auth-gated: requires being signed in (otherwise the response just shows
 * "not signed in"). The endpoint is otherwise safe to leave in place
 * temporarily — it does not return secrets, only the user_id, the email
 * derived from currentUser(), and what's in D1 for that user_id.
 */
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const dynamic = "force-dynamic";

export async function GET() {
  const out: Record<string, unknown> = {};

  // 1. auth() — returns the userId from the validated session cookie
  let userId: string | null = null;
  try {
    const a = await auth();
    userId = a.userId ?? null;
    out.auth_ok = true;
    out.userId = userId;
  } catch (e) {
    out.auth_ok = false;
    out.auth_error = e instanceof Error ? `${e.message} | ${e.stack?.slice(0, 400)}` : String(e);
  }

  // 2. currentUser() — calls Clerk Backend API to get user profile.
  //    This is the call most likely to fail (sk_live mismatch, network, etc.)
  try {
    const u = await currentUser();
    out.currentUser_ok = true;
    out.currentUser_id = u?.id ?? null;
    out.currentUser_email = u?.emailAddresses?.[0]?.emailAddress ?? null;
    out.currentUser_name = u?.fullName ?? null;
  } catch (e) {
    out.currentUser_ok = false;
    out.currentUser_error = e instanceof Error ? `${e.message} | ${e.stack?.slice(0, 400)}` : String(e);
  }

  // 3. ADMIN_EMAILS env var — what bootstrap checks against
  try {
    const { env } = getCloudflareContext();
    out.admin_emails = (env.ADMIN_EMAILS as string | undefined) ?? null;
    out.has_clerk_secret = !!(env.CLERK_SECRET_KEY as unknown as string);
    out.clerk_secret_prefix = (env.CLERK_SECRET_KEY as unknown as string | undefined)?.slice(0, 8) ?? null;
  } catch (e) {
    out.env_error = e instanceof Error ? e.message : String(e);
  }

  // 4. D1 state for this user_id
  if (userId) {
    try {
      const userRow = await db()
        .prepare(`SELECT id, email, name, created_at FROM users WHERE id = ?`)
        .bind(userId)
        .first<{ id: string; email: string; name: string | null; created_at: number }>();
      const adminRow = await db()
        .prepare(`SELECT 1 AS x FROM platform_admins WHERE user_id = ?`)
        .bind(userId)
        .first<{ x: number }>();
      const supplierMemberships = await db()
        .prepare(`SELECT supplier_id, role FROM supplier_memberships WHERE user_id = ?`)
        .bind(userId)
        .all<{ supplier_id: string; role: string }>();
      const operatorMemberships = await db()
        .prepare(`SELECT operator_id, role FROM operator_memberships WHERE user_id = ?`)
        .bind(userId)
        .all<{ operator_id: string; role: string }>();
      out.d1_user_row = userRow;
      out.d1_is_admin = !!adminRow;
      out.d1_supplier_memberships = supplierMemberships.results ?? [];
      out.d1_operator_memberships = operatorMemberships.results ?? [];
    } catch (e) {
      out.d1_error = e instanceof Error ? e.message : String(e);
    }
  }

  return Response.json(out, { headers: { "cache-control": "no-store" } });
}
