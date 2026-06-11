import Link from "next/link";
import { TopBar } from "../_components/top-bar";

export const metadata = {
  title: "Contact — Libretour",
  description: "How to reach Libretour for sales, support, privacy, and security matters.",
};

interface ContactCardProps {
  label: string;
  email: string;
  description: string;
}
function ContactCard({ label, email, description }: ContactCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 p-5 hover:border-emerald-300 transition">
      <div className="text-[11px] tracking-widest font-mono text-emerald-700/70 mb-1">
        {label}
      </div>
      <a
        href={`mailto:${email}`}
        className="text-[16px] font-semibold text-slate-900 hover:text-emerald-700 break-all"
      >
        {email}
      </a>
      <p className="text-[13.5px] text-slate-600 mt-2 leading-relaxed">{description}</p>
    </div>
  );
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased text-[16px]">
      <TopBar
        breadcrumb={
          <span className="flex items-center gap-2 min-w-0">
            <Link href="/" className="hover:text-white shrink-0">Home</Link>
            <span className="text-white/20 shrink-0">/</span>
            <span className="text-white">Contact</span>
          </span>
        }
      />

      <main className="px-5 sm:px-8 py-12 sm:py-16 max-w-3xl mx-auto">
        <div className="text-[11px] tracking-widest font-mono text-emerald-700/70 mb-2">
          CONTACT
        </div>
        <h1 className="text-[32px] sm:text-[40px] font-semibold tracking-tight text-slate-900">
          Talk to us
        </h1>
        <p className="text-[16px] text-slate-600 mt-4 leading-relaxed">
          We aim to acknowledge every enquiry within one Working Day. Please use the route
          below that best matches your reason for contacting us.
        </p>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ContactCard
            label="SALES & PARTNERSHIPS"
            email="hello@libretour.com"
            description="For tourism operators interested in publishing on Libretour, partnership enquiries, and general questions about the platform."
          />
          <ContactCard
            label="SUPPORT"
            email="support@libretour.com"
            description="Technical problems, account access issues, and questions about how to use a feature you already have access to."
          />
          <ContactCard
            label="PRIVACY"
            email="privacy@libretour.com"
            description="Access, correction, and deletion requests under the Privacy Act 2020, and any concerns about how we handle personal information."
          />
          <ContactCard
            label="SECURITY"
            email="security@libretour.com"
            description="Responsible disclosure of security vulnerabilities. We acknowledge reports within one Working Day and do not pursue good-faith researchers."
          />
          <ContactCard
            label="LEGAL"
            email="legal@libretour.com"
            description="Contractual, intellectual-property, and other formal legal matters. Please do not send service of process to other addresses."
          />
          <ContactCard
            label="ABUSE"
            email="abuse@libretour.com"
            description="Reports of content or conduct that may breach our Acceptable Use Policy. Include the URL or in-platform location and a description."
          />
        </div>

        <section className="mt-12 pt-8 border-t border-slate-200">
          <h2 className="text-[18px] font-semibold text-slate-900 mb-2">Registered office</h2>
          <p className="text-[14px] text-slate-600 leading-relaxed">
            Libretour Limited
            <br />
            NZBN [TBD-NZBN]
            <br />
            [TBD-registered-address]
            <br />
            New Zealand
          </p>
        </section>
      </main>
    </div>
  );
}
