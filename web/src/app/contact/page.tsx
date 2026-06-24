import Link from "next/link";
import { TopBar } from "../_components/top-bar";
import { getLocale } from "@/lib/i18n";

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
      <div className="text-micro tracking-widest font-mono text-slate-700 mb-1">
        {label}
      </div>
      <a
        href={`mailto:${email}`}
        className="text-body font-semibold text-slate-900 hover:text-slate-900 break-all"
      >
        {email}
      </a>
      <p className="text-small text-slate-600 mt-2 leading-relaxed">{description}</p>
    </div>
  );
}

export default async function ContactPage() {
  const locale = await getLocale();
  const zh = locale === "zh-CN";
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased text-body">
      <TopBar
        breadcrumb={
          <span className="flex items-center gap-2 min-w-0">
            <Link href="/" className="hover:text-white shrink-0">{zh ? "首页" : "Home"}</Link>
            <span className="text-white/20 shrink-0">/</span>
            <span className="text-white">{zh ? "联系" : "Contact"}</span>
          </span>
        }
      />

      <main className="px-5 sm:px-8 py-12 sm:py-16 max-w-3xl mx-auto">
        <div className="text-micro tracking-widest font-mono text-slate-700 mb-2">
          {zh ? "联系" : "CONTACT"}
        </div>
        <h1 className="text-h1 sm:text-display font-semibold tracking-tight text-slate-900">
          {zh ? "与我们联系" : "Talk to us"}
        </h1>
        <p className="text-body text-slate-600 mt-4 leading-relaxed">
          {zh
            ? "我们力争在一个工作日内回复每一条咨询。请根据你的来意,选择下方最合适的联系渠道。"
            : "We aim to acknowledge every enquiry within one Working Day. Please use the route below that best matches your reason for contacting us."}
        </p>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ContactCard
            label={zh ? "销售与合作" : "SALES & PARTNERSHIPS"}
            email="hello@libretour.com"
            description={
              zh
                ? "面向有意在 Libretour 上发布课程的旅游产品供应商,以及各类合作洽谈和关于平台的一般咨询。"
                : "For tourism operators interested in publishing on Libretour, partnership enquiries, and general questions about the platform."
            }
          />
          <ContactCard
            label={zh ? "技术支持" : "SUPPORT"}
            email="support@libretour.com"
            description={
              zh
                ? "技术故障、账户访问问题,以及关于如何使用你已获得权限的功能的疑问。"
                : "Technical problems, account access issues, and questions about how to use a feature you already have access to."
            }
          />
          <ContactCard
            label={zh ? "隐私" : "PRIVACY"}
            email="privacy@libretour.com"
            description={
              zh
                ? "依据《2020 年隐私法》提出的访问、更正与删除请求,以及对我们处理个人信息方式的任何疑虑。"
                : "Access, correction, and deletion requests under the Privacy Act 2020, and any concerns about how we handle personal information."
            }
          />
          <ContactCard
            label={zh ? "安全" : "SECURITY"}
            email="security@libretour.com"
            description={
              zh
                ? "安全漏洞的负责任披露。我们会在一个工作日内回复报告,并承诺不会追究善意安全研究者的责任。"
                : "Responsible disclosure of security vulnerabilities. We acknowledge reports within one Working Day and do not pursue good-faith researchers."
            }
          />
          <ContactCard
            label={zh ? "法务" : "LEGAL"}
            email="legal@libretour.com"
            description={
              zh
                ? "合同、知识产权及其他正式法律事务。请勿将法律文书送达至其他地址。"
                : "Contractual, intellectual-property, and other formal legal matters. Please do not send service of process to other addresses."
            }
          />
          <ContactCard
            label={zh ? "违规举报" : "ABUSE"}
            email="abuse@libretour.com"
            description={
              zh
                ? "举报可能违反我们《可接受使用政策》的内容或行为。请附上相关 URL 或平台内位置,并简要说明情况。"
                : "Reports of content or conduct that may breach our Acceptable Use Policy. Include the URL or in-platform location and a description."
            }
          />
        </div>

        <section className="mt-12 pt-8 border-t border-slate-200">
          <h2 className="text-title font-semibold text-slate-900 mb-2">{zh ? "注册办公地址" : "Registered office"}</h2>
          <p className="text-small text-slate-600 leading-relaxed">
            Libretour Limited
            <br />
            NZBN [TBD-NZBN]
            <br />
            [TBD-registered-address]
            <br />
            {zh ? "新西兰" : "New Zealand"}
          </p>
        </section>
      </main>
    </div>
  );
}
