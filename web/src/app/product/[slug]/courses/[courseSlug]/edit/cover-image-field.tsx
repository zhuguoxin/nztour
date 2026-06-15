"use client";

import { useState } from "react";
import { useTr } from "@/lib/i18n-provider";
import { MediaPicker } from "@/app/_components/media-picker";

/**
 * Cover image control for a course. The cover can be EITHER:
 *   • an emoji (typed into the small input), or
 *   • an image picked from the supplier media library (takes precedence).
 *
 * The emoji input carries name="emoji" and submits with the surrounding
 * course-details form. The image is chosen via the shared MediaPicker (course
 * target), which writes courses.cover_r2_key. "Remove" reverts to the emoji.
 */
export function CoverImageField({
  courseId,
  operatorSlug,
  supplierSlug,
  courseSlug,
  emoji,
  hasCover,
}: {
  courseId: string;
  operatorSlug: string;
  supplierSlug: string | null;
  courseSlug: string;
  emoji: string | null;
  hasCover: boolean;
}) {
  const [emojiVal, setEmojiVal] = useState(emoji ?? "");
  const tr = useTr();

  return (
    <div>
      <div className="text-[12px] font-semibold text-[#e6f5ec] mb-1.5">{tr.ci_cover_image}</div>

      {supplierSlug ? (
        <MediaPicker
          supplierSlug={supplierSlug}
          target={{ target: "course", operatorSlug, courseId }}
          currentUrl={hasCover ? `/api/course-cover?id=${courseId}` : null}
          aspect="video"
          theme="dark"
          className="mb-2.5"
        />
      ) : null}

      <div className="text-[11px] font-medium text-[#a7d4b6] mb-1">{tr.ci_emoji_ph}</div>
      <input
        name="emoji"
        value={emojiVal}
        onChange={(e) => setEmojiVal(e.target.value)}
        maxLength={4}
        placeholder={tr.ci_emoji_ph}
        disabled={hasCover}
        className="w-full bg-[#04241e] border border-white/[.10] rounded-md px-3 py-1.5 text-[18px] text-white outline-none focus:border-emerald-400/60 disabled:opacity-40"
      />
      <div className="text-[10.5px] text-[#5d9279] mt-1">{tr.ci_hint}</div>
    </div>
  );
}
