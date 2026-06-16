"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { ensureUser } from "@/lib/progress";
import { shortId, slugify, uniqueSlug } from "@/lib/ids";
import { RTO_SET } from "@/lib/rto";

function str(form: FormData, key: string, max: number): string | null {
  const v = String(form.get(key) ?? "").trim().slice(0, max);
  return v || null;
}

/** Resolve current Clerk user id + canonical (lowercased) email. */
async function currentIdentity(): Promise<{ userId: string; email: string }> {
  const { userId } = await auth();
  if (!userId) throw new Error("unauthorised");
  const u = await currentUser();
  const email = u?.emailAddresses?.[0]?.emailAddress?.toLowerCase();
  if (!email) throw new Error("no_email");
  return { userId, email };
}

/**
 * Learner path — writes the full profile, marks the user onboarded as a
 * 'learner', then lands them on /learn. The privacy/terms checkbox is required
 * and re-validated here (never trust the client).
 */
export async function completeLearnerOnboarding(form: FormData): Promise<void> {
  const { userId, email } = await currentIdentity();

  const first = str(form, "first_name", 80);
  const middle = str(form, "middle_name", 80);
  const last = str(form, "last_name", 80);
  const company = str(form, "company_name", 200);
  const jobTitle = str(form, "job_title", 120);
  const city = str(form, "city", 120);
  const country = str(form, "country", 80);
  const bizProfile = str(form, "business_profile", 120);
  const marketing = form.get("marketing_opt_in") ? 1 : 0;
  if (!form.get("terms_accepted")) throw new Error("terms_required");
  if (!first || !last) throw new Error("name_required");

  const fullName = [first, middle, last].filter(Boolean).join(" ");
  await ensureUser({ id: userId, email, name: fullName });

  await db()
    .prepare(
      `UPDATE users SET
         first_name = ?, middle_name = ?, last_name = ?, name = ?,
         company_name = ?, agency_name = COALESCE(?, agency_name),
         job_title = ?, city = ?, country = ?, business_profile = ?,
         marketing_opt_in = ?, terms_accepted_at = unixepoch(),
         user_type = 'learner', onboarding_completed_at = unixepoch()
       WHERE id = ?`,
    )
    .bind(first, middle, last, fullName, company, company, jobTitle, city, country, bizProfile, marketing, userId)
    .run();

  redirect("/learn");
}

/**
 * Customer (supplier onboarding) path — writes profile + user_type, creates a
 * PENDING supplier with the chosen RTOs and makes the user its owner. Requires
 * platform-admin approval to go active. Re-submitting reuses the existing
 * pending supplier rather than creating duplicates.
 */
export async function completeCustomerOnboarding(form: FormData): Promise<void> {
  const { userId, email } = await currentIdentity();

  const company = str(form, "company_name", 200);
  const first = str(form, "first_name", 80);
  const middle = str(form, "middle_name", 80);
  const last = str(form, "last_name", 80);
  if (!company) throw new Error("company_required");
  if (!first || !last) throw new Error("name_required");

  // RTO multi-select → validate against the canonical set, store as JSON.
  const rtos = form.getAll("rto").map(String).filter((r) => RTO_SET.has(r));
  const rtoJson = JSON.stringify(rtos);
  const fullName = [first, middle, last].filter(Boolean).join(" ");

  await ensureUser({ id: userId, email, name: fullName });
  await db()
    .prepare(
      `UPDATE users SET
         first_name = ?, middle_name = ?, last_name = ?, name = ?,
         company_name = ?, agency_name = COALESCE(?, agency_name),
         user_type = 'supplier_manager', onboarding_completed_at = unixepoch()
       WHERE id = ?`,
    )
    .bind(first, middle, last, fullName, company, company, userId)
    .run();

  // Reuse an existing pending supplier this user owns (resubmit), else create.
  const existing = await db()
    .prepare(
      `SELECT s.id, s.slug FROM suppliers s
       JOIN supplier_memberships m ON m.supplier_id = s.id
       WHERE m.user_id = ? AND m.role = 'owner' AND s.status = 'pending'
       LIMIT 1`,
    )
    .bind(userId)
    .first<{ id: string; slug: string }>();

  let slug: string;
  if (existing) {
    slug = existing.slug;
    await db()
      .prepare(`UPDATE suppliers SET name = ?, rto_json = ?, contact_email = ?, poc_name = ?, poc_email = ? WHERE id = ?`)
      .bind(company, rtoJson, email, fullName, email, existing.id)
      .run();
  } else {
    const supplierId = shortId("sup");
    slug = await uniqueSlug("suppliers", slugify(company));
    await db()
      .prepare(
        `INSERT INTO suppliers (id, slug, name, country, status, contact_email, poc_name, poc_email, rto_json, plan_tier)
         VALUES (?, ?, ?, 'NZ', 'pending', ?, ?, ?, ?, 'free')`,
      )
      .bind(supplierId, slug, company, email, fullName, email, rtoJson)
      .run();
    await db()
      .prepare(
        `INSERT INTO supplier_memberships (user_id, supplier_id, role)
         VALUES (?, ?, 'owner')
         ON CONFLICT(user_id, supplier_id) DO UPDATE SET role = 'owner'`,
      )
      .bind(userId, supplierId)
      .run();
  }

  revalidatePath("/admin");
  redirect(`/supplier/${slug}`);
}
