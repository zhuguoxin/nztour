"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { SUPPORTED, type Locale } from "@/lib/i18n-shared";

export async function setLocale(locale: string) {
  if (!SUPPORTED.includes(locale as Locale)) return;
  const c = await cookies();
  c.set("locale", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: "lax",
  });
  // Refresh every server-rendered route so headers + body re-evaluate.
  revalidatePath("/", "layout");
}
