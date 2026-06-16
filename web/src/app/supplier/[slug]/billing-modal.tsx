"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/app/_components/modal";
import { BillingForm } from "./billing/billing-form";
import { getSupplierBilling } from "./actions";
import { useTr } from "@/lib/i18n-provider";

/** Opens supplier billing in-place. Lazily loads the current values on open. */
export function BillingModal({
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
  const [data, setData] = useState<{ billing_email: string | null; plan_tier: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function openModal() {
    setData(null);
    setErr(null);
    setOpen(true);
    void (async () => {
      const r = await getSupplierBilling(supplierSlug);
      if (r.ok) setData({ billing_email: r.billing_email ?? null, plan_tier: r.plan_tier ?? "free" });
      else
        setErr(
          r.error === "forbidden" || r.error === "unauthorised"
            ? tr.err_no_permission
            : r.error ?? tr.err_load_failed,
        );
    })();
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
      <Modal open={open} onClose={close} title={tr.sp_hub_billing_card} maxWidth="max-w-md">
        {err ? (
          <div className="text-[13px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-3 text-center">{err}</div>
        ) : data === null ? (
          <div className="text-[13px] text-slate-400 text-center py-10">{tr.mp_loading}</div>
        ) : (
          <BillingForm supplierSlug={supplierSlug} billingEmail={data.billing_email} planTier={data.plan_tier} />
        )}
      </Modal>
    </>
  );
}
