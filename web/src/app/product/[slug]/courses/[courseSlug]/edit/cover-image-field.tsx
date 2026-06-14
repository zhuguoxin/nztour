"use client";

import { useState, useTransition } from "react";
import { useTr } from "@/lib/i18n-provider";

/**
 * Cover image control for a course. The course cover can be EITHER:
 *   • an emoji (typed into the small input), or
 *   • an uploaded image (PNG/JPEG/WebP), which takes precedence.
 *
 * The emoji input carries name="emoji" and submits with the surrounding
 * course-details form. The image upload is a separate fetch to
 * /api/course-cover (which clears the emoji server-side on success).
 * "Remove image" reverts to the emoji.
 */
export function CoverImageField({
  courseId,
  operatorSlug,
  courseSlug,
  emoji,
  hasCover,
}: {
  courseId: string;
  operatorSlug: string;
  courseSlug: string;
  emoji: string | null;
  hasCover: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [emojiVal, setEmojiVal] = useState(emoji ?? "");
  const tr = useTr();

  function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("operator_slug", operatorSlug);
    fd.append("course_slug", courseSlug);
    startTransition(async () => {
      const r = await fetch("/api/course-cover", { method: "POST", body: fd });
      if (r.ok) window.location.reload();
      else {
        const msg = await r.text().catch(() => tr.ui_upload_failed);
        alert(msg.slice(0, 300));
      }
    });
    e.target.value = "";
  }

  function removeCover() {
    startTransition(async () => {
      const fd = new FormData();
      fd.append("operator_slug", operatorSlug);
      fd.append("course_slug", courseSlug);
      const r = await fetch("/api/course-cover?remove=1", { method: "POST", body: fd });
      if (r.ok) window.location.reload();
    });
  }

  return (
    <div>
      <div className="text-[12px] font-semibold text-[#e6f5ec] mb-1.5">{tr.ci_cover_image}</div>
      <div className="flex items-center gap-3">
        {/* Preview tile */}
        <div className="w-14 h-14 rounded-lg bg-[#04241e] border border-white/[.10] flex items-center justify-center text-[26px] overflow-hidden shrink-0">
          {hasCover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/course-cover?id=${courseId}`}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            emojiVal || "📚"
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Emoji input — disabled visually when a cover image is set */}
          <input
            name="emoji"
            value={emojiVal}
            onChange={(e) => setEmojiVal(e.target.value)}
            maxLength={4}
            placeholder={tr.ci_emoji_ph}
            disabled={hasCover}
            className="w-full bg-[#04241e] border border-white/[.10] rounded-md px-3 py-1.5 text-[18px] text-white outline-none focus:border-emerald-400/60 disabled:opacity-40"
          />
          <div className="flex items-center gap-2">
            <label className="cursor-pointer">
              <span className="px-2.5 py-1 rounded-md bg-white/[.06] border border-white/[.10] text-[#d8f0e1] text-[11.5px] hover:bg-white/[.10]">
                {pending ? tr.ci_uploading : hasCover ? tr.ci_replace_image : tr.ci_upload_image}
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={pending}
                onChange={upload}
                className="hidden"
              />
            </label>
            {hasCover ? (
              <button
                type="button"
                onClick={removeCover}
                disabled={pending}
                className="text-[11px] text-rose-300/80 hover:underline"
              >
                {tr.ci_use_emoji}
              </button>
            ) : null}
          </div>
        </div>
      </div>
      <div className="text-[10.5px] text-[#5d9279] mt-1">
        {tr.ci_hint}
      </div>
    </div>
  );
}
