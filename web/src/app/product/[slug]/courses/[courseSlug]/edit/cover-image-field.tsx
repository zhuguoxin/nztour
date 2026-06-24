"use client";

import { useTr } from "@/lib/i18n-provider";
import { mediaUrl } from "@/lib/media";
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
  coverR2Key,
}: {
  courseId: string;
  operatorSlug: string;
  supplierSlug: string | null;
  hasCover: boolean;
  coverR2Key: string | null;
}) {
  const tr = useTr();

  if (!supplierSlug) {
    return <div className="text-caption text-slate-400">{tr.ci_no_supplier}</div>;
  }

  return (
    <MediaPicker
      supplierSlug={supplierSlug}
      target={{ target: "course", operatorSlug, courseId }}
      currentUrl={coverR2Key ? mediaUrl(coverR2Key) : null}
      aspect="video"
      theme="light"
    />
  );
}
