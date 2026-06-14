"use client";

import { useTransition } from "react";

/**
 * Operator logo uploader. Posts a PNG/SVG/JPEG/WebP to /api/operator-logo,
 * which writes it to R2 and stores theme_logo_r2_key. On success the page
 * reloads so the new logo shows in the preview + on /learn.
 *
 * The logo is shown small on a swatch matching the operator's page bg so
 * the operator can sanity-check contrast (a white logo on a dark theme,
 * etc.).
 */
export function LogoUploader({
  operatorSlug,
  hasLogo,
  themeBg,
}: {
  operatorSlug: string;
  hasLogo: boolean;
  themeBg: string;
}) {
  const [pending, startTransition] = useTransition();

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("operator_slug", operatorSlug);
    startTransition(async () => {
      const r = await fetch("/api/operator-logo", { method: "POST", body: fd });
      if (r.ok) window.location.reload();
      else {
        const msg = await r.text().catch(() => "Upload failed");
        alert(msg.slice(0, 300));
      }
    });
    e.target.value = "";
  }

  function removeLogo() {
    startTransition(async () => {
      const fd = new FormData();
      fd.append("operator_slug", operatorSlug);
      const r = await fetch("/api/operator-logo?remove=1", { method: "POST", body: fd });
      if (r.ok) window.location.reload();
    });
  }

  return (
    <div className="flex items-center gap-3">
      {hasLogo ? (
        <span
          className="inline-flex items-center justify-center h-10 px-3 rounded-md border border-white/[.10]"
          style={{ background: themeBg }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/operator-logo?slug=${encodeURIComponent(operatorSlug)}`}
            alt="Operator logo"
            className="max-h-7 max-w-[140px] object-contain"
          />
        </span>
      ) : (
        <span className="text-[12px] text-[#86b69a]">No logo yet</span>
      )}
      <label className="cursor-pointer">
        <span className="px-3 py-1.5 rounded-md bg-white/[.06] border border-white/[.10] text-[#d8f0e1] text-[12px] hover:bg-white/[.10]">
          {pending ? "Uploading…" : hasLogo ? "Replace logo" : "Upload logo"}
        </span>
        <input
          type="file"
          accept="image/png,image/svg+xml,image/jpeg,image/webp"
          disabled={pending}
          onChange={onFileChange}
          className="hidden"
        />
      </label>
      {hasLogo ? (
        <button
          type="button"
          onClick={removeLogo}
          disabled={pending}
          className="text-[11px] text-rose-300/80 hover:underline"
        >
          remove
        </button>
      ) : null}
      <span className="text-[10.5px] text-[#5d9279]">PNG / SVG · transparent · ≤ 1 MB</span>
    </div>
  );
}
