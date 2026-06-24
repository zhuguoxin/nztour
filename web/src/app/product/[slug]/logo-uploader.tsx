"use client";

import { useTransition } from "react";
import { mediaUrl } from "@/lib/media";
import { useTr } from "@/lib/i18n-provider";

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
  logoR2Key,
}: {
  operatorSlug: string;
  hasLogo: boolean;
  themeBg: string;
  logoR2Key: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const tr = useTr();

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
        const msg = await r.text().catch(() => tr.br_logo_upload_failed);
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
          className="inline-flex items-center justify-center h-10 px-3 rounded-md border border-slate-300"
          style={{ background: themeBg }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoR2Key ? mediaUrl(logoR2Key) : ""}
            alt={tr.br_logo_alt}
            className="max-h-7 max-w-[140px] object-contain"
          />
        </span>
      ) : (
        <span className="text-caption text-slate-500">{tr.br_logo_none}</span>
      )}
      <label className="cursor-pointer">
        <span className="px-3 py-1.5 rounded-md bg-slate-100 border border-slate-300 text-slate-700 text-caption hover:bg-slate-200">
          {pending ? tr.br_logo_uploading : hasLogo ? tr.br_logo_replace : tr.br_logo_upload}
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
          className="text-micro text-rose-600/80 hover:underline"
        >
          {tr.br_logo_remove}
        </button>
      ) : null}
      <span className="text-micro text-slate-400">{tr.br_logo_hint}</span>
    </div>
  );
}
