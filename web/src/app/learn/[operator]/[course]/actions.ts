"use server";

import { auth } from "@clerk/nextjs/server";
import { markModuleComplete, maybeAwardBadge } from "@/lib/progress";
import { revalidatePath } from "next/cache";

/**
 * Mark current module complete and possibly issue a badge if this was the
 * last module. Returns the badge verify code so the client can show a toast.
 */
export async function completeModuleAction(input: {
  moduleId: string;
  courseId: string;
  dwellSeconds: number;
}): Promise<{ verifyCode?: string }> {
  const { userId } = await auth();
  if (!userId) throw new Error("unauthenticated");

  await markModuleComplete(userId, input.moduleId, input.dwellSeconds);
  const badge = await maybeAwardBadge(userId, input.courseId);

  // Refresh the course page so progress + sidebar dot states re-render.
  revalidatePath(`/learn/[operator]/[course]`, "page");

  return { verifyCode: badge.verifyCode };
}
