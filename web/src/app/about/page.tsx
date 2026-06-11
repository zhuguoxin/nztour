import Link from "next/link";
import { TopBar } from "../_components/top-bar";

export const metadata = {
  title: "About — Libretour",
  description:
    "Libretour is a B2B training and certification platform for the New Zealand tourism industry.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased text-[16px]">
      <TopBar
        breadcrumb={
          <span className="flex items-center gap-2 min-w-0">
            <Link href="/" className="hover:text-white shrink-0">Home</Link>
            <span className="text-white/20 shrink-0">/</span>
            <span className="text-white">About</span>
          </span>
        }
      />

      <main className="px-5 sm:px-8 py-12 sm:py-16 max-w-3xl mx-auto">
        <div className="text-[11px] tracking-widest font-mono text-emerald-700/70 mb-2">
          ABOUT
        </div>
        <h1 className="text-[32px] sm:text-[40px] font-semibold tracking-tight text-slate-900">
          Train the trade. Sell with confidence.
        </h1>
        <p className="text-[17px] text-slate-600 mt-4 leading-relaxed">
          Libretour is a New Zealand company building a B2B training and certification
          platform for the tourism industry. We connect operators and travel agents
          through structured product knowledge, an AI assistant that answers questions in
          any language, and verifiable digital badges agents can share with their
          customers.
        </p>

        <section className="mt-10 space-y-4">
          <h2 className="text-[20px] font-semibold text-slate-900">Why we exist</h2>
          <p className="text-[15px] text-slate-700 leading-relaxed">
            Inbound tourism into New Zealand depends on a long tail of overseas travel
            agents selling experiences they will never personally visit. Today their
            training is built on PDFs, FAM trips, and email chains. Libretour replaces
            that fragmented stack with a single platform where suppliers publish their own
            curriculum, agents work through it on their own schedule, and the platform
            keeps everyone honest with verifiable completion records.
          </p>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="text-[20px] font-semibold text-slate-900">What we believe</h2>
          <ul className="text-[15px] text-slate-700 leading-relaxed space-y-2 list-disc ml-5">
            <li>
              <strong>Suppliers own their voice.</strong> Brand, tone, and content are the
              operator&apos;s — the platform stays out of the way.
            </li>
            <li>
              <strong>Agents have lives.</strong> Short, focused chapters; AI to answer
              the long-tail questions; verifiable badges to show for the effort.
            </li>
            <li>
              <strong>Quality over completion.</strong> A learner who genuinely understands
              your product is worth more than ten who clicked through.
            </li>
            <li>
              <strong>Trust is earned with every record.</strong> Privacy, consent, and
              data sovereignty matter, and we publish what we do with your data.
            </li>
          </ul>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="text-[20px] font-semibold text-slate-900">The company</h2>
          <p className="text-[15px] text-slate-700 leading-relaxed">
            Libretour Limited is registered in New Zealand under NZBN [TBD-NZBN]. Our
            registered office is at [TBD-registered-address]. We operate the platform
            globally on Cloudflare&apos;s edge network and store learner data in accordance
            with the Privacy Act 2020.
          </p>
        </section>

        <section className="mt-10 flex flex-wrap items-center gap-3">
          <Link
            href="/contact"
            className="px-4 py-2.5 rounded-md bg-[#04241e] text-white font-semibold text-[14px] hover:bg-[#0a3a2f]"
          >
            Get in touch
          </Link>
          <Link
            href="/learn"
            className="px-4 py-2.5 rounded-md border border-slate-300 text-slate-700 font-medium text-[14px] hover:bg-slate-50"
          >
            Browse training →
          </Link>
        </section>
      </main>
    </div>
  );
}
