"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/app/_components/modal";
import { VoicesPanel, type VoiceRow } from "./voices-panel";
import { listSupplierVoices } from "./actions";
import { useTr } from "@/lib/i18n-provider";

/**
 * Opens the supplier voices manager in-place, so the experience is identical
 * wherever it's launched from (supplier panel, course editor, product
 * dashboard). Lazily fetches the voice list on open; re-fetches after each
 * mutation (no navigation). Closing refreshes the host page so voice selectors
 * pick up newly-cloned voices.
 */
export function VoicesModal({
  supplierSlug,
  className,
  children,
}: {
  supplierSlug: string;
  className?: string;
  children: React.ReactNode;
}) {
  const tr = useTr();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [voices, setVoices] = useState<VoiceRow[] | null>(null);
  const [hasXIKey, setHasXIKey] = useState(false);
  // Bump on every (re)load so the panel remounts fresh after a mutation —
  // resetting any open edit/record form, exactly like the old full reload did.
  const [ver, setVer] = useState(0);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    const r = await listSupplierVoices(supplierSlug);
    if (r.ok) {
      setErr(null);
      setVoices(r.voices ?? []);
      setHasXIKey(!!r.hasXIKey);
    } else {
      setErr(
        r.error === "forbidden" || r.error === "unauthorised"
          ? tr.err_no_permission
          : r.error ?? tr.err_load_failed,
      );
    }
    setVer((v) => v + 1);
  }

  function openModal() {
    setVoices(null);
    setErr(null);
    setOpen(true);
    void load();
  }

  function close() {
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button type="button" className={className} onClick={openModal}>
        {children}
      </button>
      <Modal open={open} onClose={close} title={tr.sp_p_nav_voices} maxWidth="max-w-2xl">
        {err ? (
          <div className="text-[13px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-3 text-center">{err}</div>
        ) : voices === null ? (
          <div className="text-[13px] text-slate-400 text-center py-10">{tr.mp_loading}</div>
        ) : (
          <VoicesPanel key={ver} supplierSlug={supplierSlug} voices={voices} hasXIKey={hasXIKey} onChanged={load} />
        )}
      </Modal>
    </>
  );
}
