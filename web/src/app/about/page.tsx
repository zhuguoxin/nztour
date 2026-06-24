import Link from "next/link";
import { TopBar } from "../_components/top-bar";
import { getLocale } from "@/lib/i18n";

export const metadata = {
  title: "About — Libretour",
  description:
    "Libretour is a B2B training and certification platform for the New Zealand tourism industry.",
};

export default async function AboutPage() {
  const locale = await getLocale();
  const zh = locale === "zh-CN";
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased text-body">
      <TopBar
        breadcrumb={
          <span className="flex items-center gap-2 min-w-0">
            <Link href="/" className="hover:text-white shrink-0">{zh ? "首页" : "Home"}</Link>
            <span className="text-white/20 shrink-0">/</span>
            <span className="text-white">{zh ? "关于" : "About"}</span>
          </span>
        }
      />

      <main className="px-5 sm:px-8 py-12 sm:py-16 max-w-3xl mx-auto">
        <div className="text-micro tracking-widest font-mono text-slate-700 mb-2">
          {zh ? "关于" : "ABOUT"}
        </div>
        <h1 className="text-h1 sm:text-display font-semibold tracking-tight text-slate-900">
          {zh ? "培训行业伙伴,让销售更有底气。" : "Train the trade. Sell with confidence."}
        </h1>
        <p className="text-title text-slate-600 mt-4 leading-relaxed">
          {zh
            ? "Libretour 是一家新西兰公司,专为旅游行业打造 B2B 培训与认证平台。我们通过结构化的产品知识、可用任意语言答疑的 AI 助手,以及代理商可向客户展示的可验证数字徽章,把产品供应商与代理商紧密连接起来。"
            : "Libretour is a New Zealand company building a B2B training and certification platform for the tourism industry. We connect operators and travel agents through structured product knowledge, an AI assistant that answers questions in any language, and verifiable digital badges agents can share with their customers."}
        </p>

        <section className="mt-10 space-y-4">
          <h2 className="text-h3 font-semibold text-slate-900">{zh ? "我们的品牌" : "Our brand"}</h2>
          <p className="text-body text-slate-700 leading-relaxed">
            {zh ? (
              <>
                我们为这个平台取名 Libretour，是希望名字本身就讲出我们的故事。它始于{" "}
                <strong>Libre</strong>(自由)—— 挣脱千篇一律的常规行程，倡导真正多元、不受拘束的体验；
                也取意于 <strong>Libretto</strong>(歌剧脚本)—— 我们的 B2B
                培训如同精心谱写的剧本，值得你像品味艺术品一样细读与精通；当你念出声，还能听到{" "}
                <strong>Libido</strong>(原始生命力)的回响 —— 正是这股对生活与探索的本能热情，
                点燃你客户的远行渴望，也成就你在这个行业的成功。欢迎来到 Libretour。
              </>
            ) : (
              <>
                When we created Libretour, we wanted a name that truly tells our story. It starts
                with <strong>Libre</strong> — the freedom to break away from conventional,
                cookie-cutter itineraries and champion truly diverse, unrestricted experiences. But
                it is also inspired by <strong>Libretto</strong>, the masterful script of an opera,
                because our B2B training is meticulously crafted for you to savor and master like a
                work of art. Say it aloud, and you will even hear the echo of{" "}
                <strong>Libido</strong> — that primal, driving energy for life and discovery. It is
                the exact passion that fuels your clients&apos; wanderlust and your own success in
                this industry. Welcome to Libretour.
              </>
            )}
          </p>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="text-h3 font-semibold text-slate-900">{zh ? "我们为何存在" : "Why we exist"}</h2>
          <p className="text-body text-slate-700 leading-relaxed">
            {zh
              ? "新西兰的入境旅游,依赖着数量庞大的海外代理商——他们要销售自己从未亲身体验过的产品。如今他们的培训仍建立在 PDF 文档、踩线考察(FAM trip)和往来邮件之上。Libretour 用一个统一的平台取代这套零散的体系:供应商自行发布课程,代理商按自己的节奏完成学习,平台则以可验证的完成记录为各方守住可信度。"
              : "Inbound tourism into New Zealand depends on a long tail of overseas travel agents selling experiences they will never personally visit. Today their training is built on PDFs, FAM trips, and email chains. Libretour replaces that fragmented stack with a single platform where suppliers publish their own curriculum, agents work through it on their own schedule, and the platform keeps everyone honest with verifiable completion records."}
          </p>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="text-h3 font-semibold text-slate-900">{zh ? "我们的理念" : "What we believe"}</h2>
          <ul className="text-body text-slate-700 leading-relaxed space-y-2 list-disc ml-5">
            <li>
              {zh ? (
                <>
                  <strong>供应商掌握自己的话语权。</strong> 品牌、调性与内容都属于产品供应商——平台只做幕后支撑,绝不喧宾夺主。
                </>
              ) : (
                <>
                  <strong>Suppliers own their voice.</strong> Brand, tone, and content are the
                  operator&apos;s — the platform stays out of the way.
                </>
              )}
            </li>
            <li>
              {zh ? (
                <>
                  <strong>代理商也有自己的生活。</strong> 短小聚焦的章节、用 AI 解答各种细枝末节的问题、用可验证的徽章为付出的努力作证。
                </>
              ) : (
                <>
                  <strong>Agents have lives.</strong> Short, focused chapters; AI to answer
                  the long-tail questions; verifiable badges to show for the effort.
                </>
              )}
            </li>
            <li>
              {zh ? (
                <>
                  <strong>质量重于完成率。</strong> 一位真正读懂你产品的学员,胜过十位只是匆匆点完的人。
                </>
              ) : (
                <>
                  <strong>Quality over completion.</strong> A learner who genuinely understands
                  your product is worth more than ten who clicked through.
                </>
              )}
            </li>
            <li>
              {zh ? (
                <>
                  <strong>信任,在每一条记录中累积。</strong> 隐私、授权与数据主权至关重要,我们会公开说明如何处理你的数据。
                </>
              ) : (
                <>
                  <strong>Trust is earned with every record.</strong> Privacy, consent, and
                  data sovereignty matter, and we publish what we do with your data.
                </>
              )}
            </li>
          </ul>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="text-h3 font-semibold text-slate-900">{zh ? "公司信息" : "The company"}</h2>
          <p className="text-body text-slate-700 leading-relaxed">
            {zh ? (
              <>
                Libretour Limited 在新西兰注册,NZBN 为 [TBD-NZBN]。注册办公地址为 [TBD-registered-address]。我们在 Cloudflare 的全球边缘网络上运营本平台,并依据《2020 年隐私法》(Privacy Act 2020)存储学员数据。
              </>
            ) : (
              <>
                Libretour Limited is registered in New Zealand under NZBN [TBD-NZBN]. Our
                registered office is at [TBD-registered-address]. We operate the platform
                globally on Cloudflare&apos;s edge network and store learner data in accordance
                with the Privacy Act 2020.
              </>
            )}
          </p>
        </section>

        <section className="mt-10 flex flex-wrap items-center gap-3">
          <Link
            href="/contact"
            className="px-4 py-2.5 rounded-md bg-[#04241e] text-white font-semibold text-small hover:bg-[#0a3a2f]"
          >
            {zh ? "联系我们" : "Get in touch"}
          </Link>
          <Link
            href="/learn"
            className="px-4 py-2.5 rounded-md border border-slate-300 text-slate-700 font-medium text-small hover:bg-slate-50"
          >
            {zh ? "浏览培训课程 →" : "Browse training →"}
          </Link>
        </section>
      </main>
    </div>
  );
}
