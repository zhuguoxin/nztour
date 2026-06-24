"use client";

import { useEffect, useState, useTransition } from "react";
import { mediaUrl } from "@/lib/media";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useTr } from "@/lib/i18n-provider";
import { listSupplierMedia, listPlatformMedia, setCoverFromMedia, type MediaAsset } from "../_actions/media";

type Target =
  | { target: "supplier"; supplierSlug: string }
  | { target: "product"; operatorSlug: string }
  | { target: "course"; operatorSlug: string; courseId: string }
  | { target: "block"; operatorSlug: string; blockId: string };

/**
 * Reusable image picker backed by the supplier media library.
 *
 * Shows the current selection (preview) with Choose/Change + Remove controls.
 * The modal lists the supplier's library and lets the user upload a new image
 * (which is added to the library and selected). Persistence + auth go through
 * setCoverFromMedia(target) so every cover/image field shares one path.
 */
export function MediaPicker({
  supplierSlug,
  target,
  currentUrl,
  aspect = "video",
  theme = "light",
  className = "",
}: {
  supplierSlug: string;
  target: Target;
  currentUrl: string | null;
  /** Preview box shape. */
  aspect?: "video" | "square" | "wide";
  theme?: "light" | "dark";
  className?: string;
}) {
  const tr = useTr();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState<string | null>(currentUrl);
  const [pending, start] = useTransition();

  const dark = theme === "dark";
  const aspectCls = aspect === "square" ? "aspect-square" : aspect === "wide" ? "aspect-[3/1]" : "aspect-video";

  function persist(r2Key: string | null, nextUrl: string | null) {
    start(async () => {
      const res = await setCoverFromMedia({ ...target, r2Key });
      if (res.ok) {
        setUrl(nextUrl);
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <div className={className}>
      <div
        className={`relative ${aspectCls} rounded-lg overflow-hidden border ${
          dark ? "border-white/10 bg-[#04241e]" : "border-slate-200 bg-slate-100"
        }`}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className={`w-full h-full flex items-center justify-center text-caption ${dark ? "text-[#86b69a]" : "text-slate-400"}`}>
            {tr.mp_choose}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 mt-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={pending}
          className={`px-2.5 py-1 rounded-md text-caption border disabled:opacity-50 ${
            dark
              ? "bg-white/[.06] border-white/[.12] text-[#d8f0e1] hover:bg-white/[.10]"
              : "bg-white border-slate-300 text-slate-700 hover:bg-slate-100"
          }`}
        >
          {url ? tr.mp_change : tr.mp_choose}
        </button>
        {url ? (
          <button
            type="button"
            onClick={() => persist(null, null)}
            disabled={pending}
            className={`text-caption disabled:opacity-50 ${dark ? "text-rose-300 hover:underline" : "text-rose-600 hover:underline"}`}
          >
            {tr.mp_remove}
          </button>
        ) : null}
      </div>

      {open ? (
        <PickerModal
          supplierSlug={supplierSlug}
          onClose={() => setOpen(false)}
          onPick={(a) => persist(a.r2_key, a.url)}
        />
      ) : null}
    </div>
  );
}

function PickerModal({
  supplierSlug,
  onClose,
  onPick,
}: {
  supplierSlug: string;
  onClose: () => void;
  onPick: (a: { r2_key: string; url: string }) => void;
}) {
  const tr = useTr();
  const [assets, setAssets] = useState<MediaAsset[] | null>(null);
  const [platform, setPlatform] = useState<MediaAsset[] | null>(null);
  const [tab, setTab] = useState<"supplier" | "platform">("supplier");
  const [err, setErr] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Load the supplier library + the shared platform library on mount.
  useEffect(() => {
    let live = true;
    (async () => {
      const [sup, plat] = await Promise.all([listSupplierMedia(supplierSlug), listPlatformMedia()]);
      if (!live) return;
      if (sup.ok) setAssets(sup.assets ?? []);
      else {
        setAssets([]);
        setErr(
          sup.error === "forbidden" || sup.error === "unauthorised"
            ? tr.err_no_permission
            : sup.error ?? tr.mp_failed,
        );
      }
      setPlatform(plat.ok ? plat.assets ?? [] : []);
    })();
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supplierSlug]);

  // Portal to <body> so the overlay isn't trapped (clipped / painted under the
  // page) by a sticky rail or any ancestor that establishes a containing block.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const current = tab === "platform" ? platform : assets;
  const serveBase = tab === "platform" ? "/api/platform-media" : "/api/media";

  function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr(null);
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("supplier_slug", supplierSlug);
    (async () => {
      try {
        const r = await fetch("/api/media", { method: "POST", body: fd });
        if (!r.ok) {
          setErr((await r.text().catch(() => "")).slice(0, 200) || tr.mp_failed);
          return;
        }
        const a = (await r.json()) as { id: string; r2_key: string; url: string };
        // Newly uploaded image is selected immediately.
        onPick({ r2_key: a.r2_key, url: a.url });
      } finally {
        setUploading(false);
      }
    })();
  }

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[80vh] rounded-2xl bg-white text-slate-900 shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 px-5 py-3 border-b border-slate-200 flex-wrap">
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 text-caption">
            <button
              type="button"
              onClick={() => setTab("supplier")}
              className={`px-3 py-1 rounded-md font-medium ${tab === "supplier" ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
            >
              {tr.mp_tab_supplier}
            </button>
            <button
              type="button"
              onClick={() => setTab("platform")}
              className={`px-3 py-1 rounded-md font-medium ${tab === "platform" ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
            >
              {tr.mp_tab_platform}
            </button>
          </div>
          <div className="flex items-center gap-2">
            {tab === "supplier" ? (
              <label className="px-3 py-1.5 rounded-md bg-emerald-600 text-white text-small font-semibold hover:bg-emerald-700 cursor-pointer">
                {uploading ? tr.mp_uploading : `+ ${tr.mp_upload}`}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  disabled={uploading}
                  onChange={upload}
                  className="hidden"
                />
              </label>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1.5 rounded-md border border-slate-300 text-slate-600 text-small hover:bg-slate-100"
            >
              {tr.mp_close}
            </button>
          </div>
        </div>

        <div className="p-5 overflow-y-auto">
          {err ? (
            <div className="text-small text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 mb-3">
              {err}
            </div>
          ) : null}
          {current === null ? (
            <div className="text-small text-slate-400 text-center py-10">{tr.mp_loading}</div>
          ) : current.length === 0 ? (
            <div className="text-small text-slate-400 text-center py-10">
              {tab === "platform" ? tr.mp_platform_empty : tr.mp_empty}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {current.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => onPick({ r2_key: a.r2_key, url: mediaUrl(a.r2_key) })}
                  className="group relative aspect-video rounded-lg overflow-hidden border border-slate-200 hover:border-emerald-500 hover:ring-2 hover:ring-emerald-500/30"
                  title={a.filename ?? ""}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={mediaUrl(a.r2_key)} alt={a.filename ?? ""} className="w-full h-full object-cover" />
                  <span className="absolute inset-0 bg-emerald-600/0 group-hover:bg-emerald-600/10 transition" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
