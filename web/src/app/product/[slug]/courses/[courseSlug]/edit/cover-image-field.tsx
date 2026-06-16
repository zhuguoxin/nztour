"use client";

import { useTr } from "@/lib/i18n-provider";
import { MediaPicker } from "@/app/_components/media-picker";

/**
 * Cover image control for a course. The cover is an image picked from the
 * supplier media library (or uploaded), persisted via the shared MediaPicker
 * (course target → courses.cover_r2_key). No emoji fallback.
 */
export function CoverImageField({
  courseId,
  operatorSlug,
  supplierSlug,
  hasCover,
}: {
  courseId: string;
  operatorSlug: string;
  supplierSlug: string | null;
  hasCover: boolean;
}) {
  const tr = useTr();

  if (!supplierSlug) {
    return <div className="text-[11.5px] text-slate-400">{tr.ci_no_supplier}</div>;
  }

  return (
    <MediaPicker
      supplierSlug={supplierSlug}
      target={{ target: "course", operatorSlug, courseId }}
      currentUrl={hasCover ? `/api/course-cover?id=${courseId}` : null}
      aspect="video"
      theme="light"
    />
  );
}
