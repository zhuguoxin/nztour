"use client";

import { useEffect, useState } from "react";
import { useTr } from "@/lib/i18n-provider";
import { listAllMedia, listPlatformMedia, type MediaAsset, type PlatformMediaAsset } from "@/app/_actions/media";

/**
 * Admin media management:
 *   • Platform public assets — owned by no supplier; any supplier/product can
 *     use them. Upload / browse / delete here.
 *   • All supplier media — aggregated, read-only browse across suppliers, plus
 *     upload to a chosen supplier's library.
 */
export function PlatformMediaLibrary({ suppliers }: { suppliers: { slug: string; name: string }[] }) {
  const tr = useTr();

  // Platform assets
  const [platform, setPlatform] = useState<MediaAsset[] | null>(null);
  const [pUploading, setPUploading] = useState(false);

  // Supplier (aggregated) media
  const [assets, setAssets] = useState<PlatformMediaAsset[] | null>(null);
  const [q, setQ] = useState("");
  const [uploadSupplier, setUploadSupplier] = useState(suppliers[0]?.slug ?? "");
  const [uploading, setUploading] = useState(false);

  const [err, setErr] = useState<string | null>(null);

  async function loadPlatform() {
    const r = await listPlatformMedia();
    setPlatform(r.ok ? r.assets ?? [] : []);
  }
  async function loadSuppliers(query: string) {
    const r = await listAllMedia(query);
    if (r.ok) setAssets(r.assets ?? []);
    else { setAssets([]); setErr(r.error ?? tr.mp_failed); }
  }

  useEffect(() => {
    void loadPlatform();
    void loadSuppliers("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function uploadPlatform(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr(null);
    setPUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    (async () => {
      try {
        const r = await fetch("/api/platform-media", { method: "POST", body: fd });
        if (!r.ok) setErr((await r.text().catch(() => "")).slice(0, 200) || tr.mp_failed);
        else { setPlatform(null); await loadPlatform(); }
      } finally {
        setPUploading(false);
      }
    })();
  }

  function deletePlatform(id: string) {
    setErr(null);
    const fd = new FormData();
    fd.append("id", id);
    (async () => {
      const r = await fetch("/api/platform-media?remove=1", { method: "POST", body: fd });
      if (!r.ok) setErr(tr.mp_failed);
      else { setPlatform(null); await loadPlatform(); }
    })();
  }

  function uploadSupplierMedia(e: React.ChangeEvent<HTMLInputElement>) {
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
        if (!r.ok) setErr((await r.text().catch(() => "")).slice(0, 200) || tr.mp_failed);
        else { setQ(""); setAssets(null); await loadSuppliers(""); }
      } finally {
        setUploading(false);
      }
    })();
  }

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    setAssets(null);
    void loadSuppliers(q);
  }

  const field =
    "bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-[12.5px] text-slate-900 outline-none focus:border-emerald-500";

  return (
    <div className="space-y-8">
      {err ? (
        <div className="text-[13px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{err}</div>
      ) : null}

      {/* Platform public assets */}
      <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <header className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="font-semibold text-[14px] text-slate-900">{tr.admin_media_platform_title}</div>
            <div className="text-[12px] text-slate-500 mt-0.5">{tr.admin_media_platform_sub}</div>
          </div>
          <label className="px-3 py-1.5 rounded-md bg-emerald-600 text-white text-[12.5px] font-semibold hover:bg-emerald-700 cursor-pointer shrink-0">
            {pUploading ? tr.mp_uploading : `+ ${tr.mp_upload}`}
            <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" disabled={pUploading} onChange={uploadPlatform} className="hidden" />
          </label>
        </header>
        <div className="p-5">
          {platform === null ? (
            <div className="text-[13px] text-slate-400 text-center py-10">{tr.mp_loading}</div>
          ) : platform.length === 0 ? (
            <div className="text-[13px] text-slate-400 text-center py-10">{tr.admin_media_platform_empty}</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {platform.map((a) => (
                <div key={a.id} className="group relative rounded-lg border border-slate-200 overflow-hidden">
                  <div className="aspect-video bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/api/platform-media?id=${a.id}`} alt={a.filename ?? ""} loading="lazy" className="w-full h-full object-cover" />
                  </div>
                  <button
                    type="button"
                    onClick={() => deletePlatform(a.id)}
                    title={tr.mp_remove}
                    className="absolute top-1 right-1 w-6 h-6 rounded-md bg-white/90 border border-slate-200 text-rose-600 text-[12px] opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
                  >
                    ✕
                  </button>
                  {a.filename ? (
                    <div className="px-2 py-1 text-[10.5px] text-slate-400 truncate" title={a.filename}>{a.filename}</div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* All supplier media (aggregated, browse) */}
      <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <header className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3 flex-wrap">
          <div className="font-semibold text-[14px] text-slate-900">{tr.admin_media_suppliers_title}</div>
          <div className="flex items-center gap-2 flex-wrap">
            <form onSubmit={onSearch} className="flex items-center gap-1.5">
              <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={tr.admin_media_search_ph} className={field + " w-56"} />
              <button type="submit" className="px-2.5 py-1.5 rounded-md border border-slate-300 text-slate-700 text-[12.5px] hover:bg-slate-50">🔍</button>
            </form>
            <span className="text-[12px] text-slate-500">{tr.admin_media_upload_to}</span>
            <select value={uploadSupplier} onChange={(e) => setUploadSupplier(e.target.value)} className={field}>
              {suppliers.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
            </select>
            <label className="px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 text-[12.5px] hover:bg-slate-50 cursor-pointer">
              {uploading ? tr.mp_uploading : `+ ${tr.mp_upload}`}
              <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" disabled={uploading || !uploadSupplier} onChange={uploadSupplierMedia} className="hidden" />
            </label>
          </div>
        </header>
        <div className="p-5">
          {assets === null ? (
            <div className="text-[13px] text-slate-400 text-center py-10">{tr.mp_loading}</div>
          ) : assets.length === 0 ? (
            <div className="text-[13px] text-slate-400 text-center py-10">{tr.admin_media_empty}</div>
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
                    {a.filename ? <div className="text-[10.5px] text-slate-400 truncate" title={a.filename}>{a.filename}</div> : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
