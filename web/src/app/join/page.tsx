import Link from "next/link";
import { TopBar } from "../_components/top-bar";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

/**
 * Registration entry: pick the kind of account. Each card routes to Clerk
 * sign-up carrying ?as=, which sign-up forwards to /onboarding?as= after the
 * account is created.
 */
export default async function JoinPage() {
  const tr = await t();
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <TopBar />
      <main className="px-5 sm:px-8 py-12 max-w-3xl mx-auto">
        <h1 className="text-h2 sm:text-h1 font-semibold tracking-tight">{tr.join_title}</h1>
        <p className="text-small text-slate-600 mt-2 mb-7">{tr.join_blurb}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <JoinCard
            href="/sign-up?as=customer"
            title={tr.join_card_customer_title}
            desc={tr.join_card_customer_desc}
            cta={tr.join_card_customer_cta}
          />
          <JoinCard
            href="/sign-up?as=user"
            title={tr.join_card_user_title}
            desc={tr.join_card_user_desc}
            cta={tr.join_card_user_cta}
          />
        </div>
        <p className="text-caption text-slate-500 mt-6">
          {tr.join_have_account}{" "}
          <Link href="/sign-in" className="text-slate-900 hover:underline font-medium">
            {tr.join_sign_in}
          </Link>
        </p>
      </main>
    </div>
  );
}

function JoinCard({ href, title, desc, cta }: { href: string; title: string; desc: string; cta: string }) {
  return (
    <Link
      href={href}
      className="block rounded-2xl border border-slate-200 bg-white p-5 hover:border-emerald-400 hover:shadow-sm transition"
    >
      <div className="font-semibold text-body text-slate-900">{title}</div>
      <div className="text-small text-slate-600 mt-1.5 leading-relaxed">{desc}</div>
      <div className="text-small font-semibold text-slate-900 mt-3">{cta} →</div>
    </Link>
  );
}
