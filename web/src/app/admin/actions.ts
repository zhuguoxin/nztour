"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/roles";

export async function grantMembership(form: FormData) {
  await requireAdmin();
  const userId = String(form.get("user_id") ?? "");
  const operatorId = String(form.get("operator_id") ?? "");
  const role = String(form.get("role") ?? "admin");
  if (!userId || !operatorId) throw new Error("missing fields");
  if (!["admin", "editor"].includes(role)) throw new Error("invalid role");
  await db()
    .prepare(
      `INSERT INTO operator_memberships (user_id, operator_id, role)
       VALUES (?, ?, ?)
       ON CONFLICT(user_id, operator_id) DO UPDATE SET role = excluded.role`,
    )
    .bind(userId, operatorId, role)
    .run();
  revalidatePath("/admin");
}

export async function revokeMembership(form: FormData) {
  await requireAdmin();
  const userId = String(form.get("user_id") ?? "");
  const operatorId = String(form.get("operator_id") ?? "");
  if (!userId || !operatorId) throw new Error("missing fields");
  await db()
    .prepare(`DELETE FROM operator_memberships WHERE user_id = ? AND operator_id = ?`)
    .bind(userId, operatorId)
    .run();
  revalidatePath("/admin");
}
