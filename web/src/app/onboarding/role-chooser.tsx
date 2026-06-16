"use client";

import Link from "next/link";
import { useTr } from "@/lib/i18n-provider";

/**
 * Shown when a signed-in user reaches /onboarding without a role (?as=) — lets
 * them pick which kind of account to complete. Mirrors the /join cards but
 * stays inside onboarding (links carry ?as= back to this page).
 */
export function RoleChooser({ title, blurb }: { title: string; blurb: string }) {
  const tr = useTr();
  return (
    <div>
      <h1 className="text-[24px] sm:text-[28px] font-semibold tracking-tight">{title}</h1>
      <p className="text-[14px] text-slate-600 mt-1.5 mb-6">{blurb}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <RoleCard
          href="/onboarding?as=customer"
          title={tr.join_card_customer_title}
          desc={tr.join_card_customer_desc}
          cta={tr.join_card_customer_cta}
        />
        <RoleCard
          href="/onboarding?as=user"
          title={tr.join_card_user_title}
          desc={tr.join_card_user_desc}
          cta={tr.join_card_user_cta}
        />
      </div>
    </div>
  );
}

function RoleCard({ href, title, desc, cta }: { href: string; title: string; desc: string; cta: string }) {
  return (
    <Link
      href={href}
      className="block rounded-2xl border border-slate-200 bg-white p-5 hover:border-emerald-400 hover:shadow-sm transition"
    >
      <div className="font-semibold text-[16px] text-slate-900">{title}</div>
      <div className="text-[13px] text-slate-600 mt-1.5 leading-relaxed">{desc}</div>
      <div className="text-[13px] font-semibold text-emerald-700 mt-3">{cta} →</div>
    </Link>
  );
}
