"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useTr } from "@/lib/i18n-provider";
import { updateSupplierBilling } from "../actions";

const input =
  "w-full bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-[14px] text-slate-900 outline-none focus:border-emerald-500";

export function BillingForm({
  supplierSlug,
  billingEmail,
  planTier,
}: {
  supplierSlug: string;
  billingEmail: string | null;
  planTier: string;
}) {
  const tr = useTr();
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    async (_prev: { ok: boolean; error?: string } | null, fd: FormData) => {
      const res = await updateSupplierBilling(fd);
      if (res.ok) router.refresh();
      return res;
    },
    null,
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 max-w-md space-y-4">
      <div>
        <div className="text-[11.5px] font-medium text-slate-600 mb-1">{tr.bill_plan_label}</div>
        <div className="inline-block px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[12px] font-mono uppercase">
          {planTier}
        </div>
        <div className="text-[12px] text-slate-500 mt-1.5">{tr.bill_plan_note}</div>
      </div>

      <form action={formAction} className="space-y-2">
        <input type="hidden" name="supplier_slug" value={supplierSlug} />
        <label className="block">
          <span className="text-[11.5px] font-medium text-slate-600 mb-1 block">{tr.bill_email_label}</span>
          <input name="billing_email" type="email" defaultValue={billingEmail ?? ""} maxLength={200} className={input} />
        </label>
        <div className="flex items-center gap-2 pt-1">
          <button
            type="submit"
            disabled={pending}
            className="px-3.5 py-1.5 rounded-md bg-emerald-600 text-white font-semibold text-[13px] hover:bg-emerald-700 disabled:opacity-50"
          >
            {pending ? tr.sp_p_saving : tr.sp_p_save}
          </button>
          {state?.ok ? <span className="text-[12px] text-emerald-700">{tr.sp_p_saved}</span> : null}
          {state && !state.ok ? (
            <span className="text-[12px] text-rose-600">{state.error ?? tr.sp_p_save_failed}</span>
          ) : null}
        </div>
      </form>

      <div className="text-[12px] text-slate-500 border-t border-slate-200 pt-3">{tr.bill_invoices_soon}</div>
    </div>
  );
}
