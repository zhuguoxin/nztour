"use client";

import { useEffect, useState } from "react";
import { useTr } from "@/lib/i18n-provider";
import { listAllMedia, type PlatformMediaAsset } from "@/app/_actions/media";

/**
 * Platform media library — aggregated view of every supplier's media. Admin
 * only (the data action enforces it). Search across suppliers/filenames, and
 * upload to a chosen supplier's library.
 */
export function PlatformMediaLibrary({ suppliers }: { suppliers: { slug: string; name: string }[] }) {
  const tr = useTr();
  const [assets, setAssets] = useState<PlatformMediaAsset[] | null>(null);
  const [q, setQ] = useState("");
  const [uploadSupplier, setUploadSupplier] = useState(suppliers[0]?.slug ?? "");
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load(query: string) {
    const r = await listAllMedia(query);
    if (r.ok) setAssets(r.assets ?? []);
    else {
      setAssets([]);
      setErr(r.error ?? tr.mp_failed);
    }
  }

  useEffect(() => {
    void load("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    setAssets(null);
    void load(q);
  }

  function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !uploadSupplier) return;
    setErr(null);
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("supplier_slug", uploadSupplier);
    (async () => {
      try {
        const r = await fetch("/api/media", { method: "POST", body: fd });
        if (!r.ok) {
          setErr((await r.text().catch(() => "")).slice(0, 200) || tr.mp_failed);
          return;
        }
        setQ("");
        setAssets(null);
        await load("");
      } finally {
        setUploading(false);
      }
    })();
  }

  const field =
    "bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-[12.5px] text-slate-900 outline-none focus:border-emerald-500";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <form onSubmit={onSearch} className="flex items-center gap-1.5">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={tr.admin_media_search_ph}
            className={field + " w-64"}
          />
          <button type="submit" className="px-2.5 py-1.5 rounded-md border border-slate-300 text-slate-700 text-[12.5px] hover:bg-slate-50">
            🔍
          </button>
        </form>

        <div className="flex items-center gap-1.5">
          <span className="text-[12px] text-slate-500">{tr.admin_media_upload_to}</span>
          <select value={uploadSupplier} onChange={(e) => setUploadSupplier(e.target.value)} className={field}>
            {suppliers.map((s) => (
              <option key={s.slug} value={s.slug}>{s.name}</option>
            ))}
          </select>
          <label className="px-3 py-1.5 rounded-md bg-emerald-600 text-white text-[12.5px] font-semibold hover:bg-emerald-700 cursor-pointer">
            {uploading ? tr.mp_uploading : `+ ${tr.mp_upload}`}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              disabled={uploading || !uploadSupplier}
              onChange={upload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {err ? (
        <div className="text-[13px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{err}</div>
      ) : null}

      {assets === null ? (
        <div className="text-[13px] text-slate-400 text-center py-16">{tr.mp_loading}</div>
      ) : assets.length === 0 ? (
        <div className="text-[13px] text-slate-400 text-center py-16">{tr.admin_media_empty}</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {assets.map((a) => (
            <div key={a.id} className="rounded-lg border border-slate-200 overflow-hidden">
              <div className="aspect-video bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/media?id=${a.id}`} alt={a.filename ?? ""} loading="lazy" className="w-full h-full object-cover" />
              </div>
              <div className="px-2 py-1.5">
                <div className="text-[11.5px] text-slate-700 truncate" title={a.supplier_name}>{a.supplier_name}</div>
                {a.filename ? (
                  <div className="text-[10.5px] text-slate-400 truncate" title={a.filename}>{a.filename}</div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
