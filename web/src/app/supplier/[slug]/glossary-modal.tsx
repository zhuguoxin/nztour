"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/app/_components/modal";
import { GlossaryPanel } from "@/app/_components/glossary-panel";
import { listSupplierGlossary } from "./actions";
import { TRANSLATE_LANGS } from "@/lib/translate";
import type { GlossaryRow } from "@/lib/glossary";
import { useTr } from "@/lib/i18n-provider";

/**
 * Opens the supplier translation glossary in-place. Lazily loads entries on
 * open; re-fetches (remount) after each mutation; closing refreshes the host.
 */
export function GlossaryModal({
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
  const [entries, setEntries] = useState<GlossaryRow[] | null>(null);
  const [ver, setVer] = useState(0);

  async function load() {
    const r = await listSupplierGlossary(supplierSlug);
    setEntries(r.ok ? r.entries ?? [] : []);
    setVer((v) => v + 1);
  }

  function openModal() {
    setEntries(null);
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
      <Modal open={open} onClose={close} title={tr.sp_p_nav_glossary} maxWidth="max-w-3xl">
        {entries === null ? (
          <div className="text-[13px] text-slate-400 text-center py-10">{tr.mp_loading}</div>
        ) : (
          <GlossaryPanel
            key={ver}
            scope="supplier"
            slug={supplierSlug}
            entries={entries}
            languages={TRANSLATE_LANGS}
            onChanged={load}
          />
        )}
      </Modal>
    </>
  );
}
