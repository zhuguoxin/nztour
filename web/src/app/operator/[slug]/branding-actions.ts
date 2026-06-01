"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOperatorMembership } from "@/lib/roles";

const HEX = /^#[0-9a-fA-F]{6}$/;

function normaliseHex(input: unknown): string | null {
  const s = String(input ?? "").trim();
  if (!s) return null;
  // Accept both #abc and #aabbcc forms; normalise to #aabbcc.
  if (/^#[0-9a-fA-F]{3}$/.test(s)) {
    const h = s.slice(1);
    return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`;
  }
  if (HEX.test(s)) return s.toLowerCase();
  return null;
}

export async function updateOperatorTheme(form: FormData) {
  const slug = String(form.get("operator_slug") ?? "");
  const access = await requireOperatorMembership(slug);

  const bg = normaliseHex(form.get("theme_bg"));
  const accent = normaliseHex(form.get("theme_accent"));
  const ink = normaliseHex(form.get("theme_ink"));

  await db()
    .prepare(
      `UPDATE operators
         SET theme_bg = ?, theme_accent = ?, theme_ink = ?
       WHERE id = ?`,
    )
    .bind(bg, accent, ink, access.operatorId)
    .run();

  // Every surface that reads operator.theme_*.
  revalidatePath(`/operator/${slug}`);
  revalidatePath(`/learn/${slug}`, "layout");
}

export async function resetOperatorTheme(form: FormData) {
  const slug = String(form.get("operator_slug") ?? "");
  const access = await requireOperatorMembership(slug);
  await db()
    .prepare(
      `UPDATE operators
         SET theme_bg = NULL, theme_accent = NULL, theme_ink = NULL, theme_logo_r2_key = NULL
       WHERE id = ?`,
    )
    .bind(access.operatorId)
    .run();
  revalidatePath(`/operator/${slug}`);
  revalidatePath(`/learn/${slug}`, "layout");
}
