import Link from "next/link";
import { TopBar } from "./_components/top-bar";
import { AskAI } from "./_components/ask-ai";
import { HeroSlideshow } from "./_components/hero-slideshow";
import { getLocale, t } from "@/lib/i18n";
import { getOnboardingState } from "@/lib/onboarding";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Libretour homepage — newzealand.com-inspired editorial landing.
 *
 * Deep-green chrome (shared TopBar) → full-bleed 3-slide photo hero with the
 * live AI ask bar → "About Libretour" brand story (cream) → three big
 * alternating feature rows → deep-green CTA → footer. Uses Hanken Grotesk
 * (--font-hanken, a free stand-in for Tourism NZ's custom type) for the
 * editorial voice; the shared chrome keeps Geist.
 *
 * Bilingual via an inline `zh` switch (same pattern as /about) since the copy is
 * long-form marketing prose; short shared chrome strings still come from t().
 */

// Hotlinked Pexels NZ landscapes (free commercial use). TODO: download into R2 /
// public with srcset + lazy-loading before scaling traffic.
const HERO_SLIDES = [
  "https://images.pexels.com/photos/11032559/pexels-photo-11032559.jpeg?auto=compress&cs=tinysrgb&w=1920",
  "https://images.pexels.com/photos/9485548/pexels-photo-9485548.jpeg?auto=compress&cs=tinysrgb&w=1920",
  "https://images.pexels.com/photos/1118861/pexels-photo-1118861.jpeg?auto=compress&cs=tinysrgb&w=1920",
];

const FEATURE_IMAGES = [
  "https://images.pexels.com/photos/9485548/pexels-photo-9485548.jpeg?auto=compress&cs=tinysrgb&w=900",
  "https://images.pexels.com/photos/11032559/pexels-photo-11032559.jpeg?auto=compress&cs=tinysrgb&w=900",
  "https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=900",
];

export default async function Home() {
  // Signed-in but not yet onboarded → finish registration first. Returns null
  // for signed-out visitors, so the public landing is unaffected.
  const ob = await getOnboardingState();
  if (ob && !ob.onboarded) redirect("/onboarding");

  const [locale, tr] = await Promise.all([getLocale(), t()]);
  const zh = locale === "zh-CN";

  type Check = string | { text: string; tag: string };
  interface Feature {
    num: string;
    title: string;
    lead: string;
    checks: Check[];
    pills?: { label: string; on: boolean }[];
  }
  const features: Feature[] = [
    {
      num: zh ? "01 — 语言" : "01 — Language",
      title: zh ? "用母语学习" : "Learn in your mother tongue",
      lead: zh
        ? "打破语言壁垒。新西兰供应商的产品知识被结构化、并完整本地化为你的母语,随时随地、按自己的节奏学习。"
        : "Break down language barriers. Access comprehensive, structured product knowledge from New Zealand operators, fully localised into your native spoken language — at your own pace, anywhere.",
      checks: zh
        ? [
            "课程提供中文、日语、泰语、印地语等多种语言",
            "供应商内容由专业团队翻译并本地化",
            "完全自定进度 —— 无固定时间,无需教室",
          ]
        : [
            "Courses in Mandarin, Japanese, Thai, Hindi and more",
            "Operator content professionally translated and localised",
            "Self-paced — no fixed schedule or classroom required",
          ],
      pills: [
        { label: "中文", on: true },
        { label: "日本語", on: true },
        { label: "ภาษาไทย", on: true },
        { label: "हिन्दी", on: true },
        { label: "한국어", on: false },
        { label: zh ? "+ 更多" : "+ more", on: false },
      ],
    },
    {
      num: zh ? "02 — AI 助手" : "02 — AI Assistant",
      title: zh ? "你的 7×24 小时 AI 旅游助手" : "Your 24/7 AI travel assistant",
      lead: zh
        ? "绝不让客户久等。AI 助手全天候在线,用任意语言实时回答复杂问题 —— 答案均基于已验证的供应商内容,让你专业可信。"
        : "Never leave a customer waiting. Our AI assistant is always online to answer complex, real-time questions in any language — grounded in verified operator content, so you look like an expert.",
      checks: zh
        ? [
            "答案基于已验证的供应商内容 —— 而非凭空臆测",
            "用你客户的语言即时作答",
            "深夜、周末、公共假期 —— 始终在线",
          ]
        : [
            "Answers grounded in verified operator content — not guesses",
            "Responds in your client's language, instantly",
            "Available midnight, weekends, public holidays — always on",
          ],
    },
    {
      num: zh ? "03 — 资质徽章" : "03 — Credentials",
      title: zh ? "赢得徽章,建立信任" : "Earn badges, build trust",
      lead: zh
        ? "在竞争中脱颖而出。完成培训模块即可获得可验证的数字徽章,分享给客户以建立信任、累积积分,并解锁即将推出的专属奖励。"
        : "Stand out from the competition. Complete training modules to earn verifiable digital badges you can share with clients to build trust, accumulate points, and unlock exclusive upcoming rewards.",
      checks: zh
        ? [
            "可验证的数字徽章,可分享给每一位客户",
            "每完成一个模块和测评都能累积积分",
            { text: "专属奖品与奖励", tag: zh ? "即将推出" : "Upcoming" },
          ]
        : [
            "Verified digital badges you can share with every client",
            "Earn points with every completed module and assessment",
            { text: "Exclusive prizes and rewards", tag: "Upcoming" },
          ],
    },
  ];

  return (
    <div
      className="min-h-screen bg-white text-[#152821] antialiased text-[17px]"
      style={{ fontFamily: "var(--font-hanken), ui-sans-serif, system-ui, sans-serif" }}
    >
      <TopBar />

      {/* HERO — 3-slide background + live AI ask bar */}
      <HeroSlideshow images={HERO_SLIDES}>
        <div className="max-w-[760px] text-white">
          <span className="block text-[12px] font-bold tracking-[0.18em] uppercase text-[#9be6bf] mb-4">
            {zh ? "B2B 旅游培训平台" : "B2B Tourism Training Platform"}
          </span>
          <h1 className="font-extrabold leading-[1.04] tracking-[-0.02em] text-[clamp(40px,6.4vw,80px)] [text-shadow:0_2px_40px_rgba(0,0,0,0.3)]">
            {zh ? (
              <>
                掌握新西兰旅游 —— 用<em className="not-italic text-[#9be6bf]">你的语言。</em>
              </>
            ) : (
              <>
                Master New Zealand tourism — in{" "}
                <em className="not-italic text-[#9be6bf]">your language.</em>
              </>
            )}
          </h1>
          <p className="mt-5 text-[clamp(16px,1.5vw,21px)] leading-[1.6] text-white/90 max-w-[600px]">
            {zh
              ? "结构化的供应商知识、7×24 小时 AI 助手,以及可验证的徽章 —— 这个培训平台,帮助全球旅游代理自信地销售新西兰。"
              : "Structured operator knowledge, a 24/7 AI assistant, and verifiable badges. The training platform that helps global travel agents sell New Zealand with confidence."}
          </p>
          <div className="mt-8 max-w-2xl">
            <AskAI
              variant="hero"
              placeholder={
                zh
                  ? "随便问,或搜索供应商、课程、目的地…"
                  : "Ask anything, or search operators, courses, destinations…"
              }
              examples={[]}
              askLabel={tr.hero_ask_button}
              thinkingText={tr.ai_thinking_inline}
              noAnswerWarning={tr.ai_no_answer_inline}
            />
          </div>
        </div>
      </HeroSlideshow>

      {/* ABOUT — brand story (cream) */}
      <section className="bg-[#f6f3ec] py-[88px] sm:py-[110px]">
        <div className="max-w-[880px] mx-auto px-6 sm:px-8 text-center">
          <span className="block text-[12px] font-bold tracking-[0.18em] uppercase text-[#1f7a4e] mb-5">
            {zh ? "我们的故事" : "Our story"}
          </span>
          <div className="w-[54px] h-[3px] bg-[#1f7a4e] rounded mx-auto mb-7" />
          <h2 className="font-extrabold tracking-[-0.02em] text-[clamp(28px,3.6vw,46px)] mb-7">
            {zh ? "关于 Libretour" : "About Libretour"}
          </h2>
          <div className="space-y-4 text-[clamp(17px,1.6vw,22px)] leading-[1.75] text-[#4f6b60]">
            {zh ? (
              <>
                <p>我们为这个平台取名 Libretour,是希望名字本身就讲出我们的故事。</p>
                <p>
                  它始于{" "}
                  <span className="font-extrabold text-[#0e3b2c]">Libre</span>(自由)—— 挣脱千篇一律的常规行程,倡导真正多元、不受拘束的体验。
                </p>
                <p>
                  也取意于{" "}
                  <span className="font-extrabold text-[#0e3b2c]">Libretto</span>(歌剧脚本)—— 我们的 B2B 培训如同精心谱写的剧本,值得你像品味艺术品一样细读与精通。
                </p>
                <p>
                  当你念出声,还能听到{" "}
                  <span className="font-extrabold text-[#0e3b2c]">Libido</span>(原始生命力)的回响 —— 正是这股对生活与探索的本能热情,点燃你客户的远行渴望,也成就你在这个行业的成功。
                </p>
              </>
            ) : (
              <>
                <p>When we created Libretour, we wanted a name that truly tells our story.</p>
                <p>
                  It starts with <span className="font-extrabold text-[#0e3b2c]">Libre</span> — the
                  freedom to break away from conventional, cookie-cutter itineraries and champion
                  truly diverse, unrestricted experiences.
                </p>
                <p>
                  But it is also inspired by{" "}
                  <span className="font-extrabold text-[#0e3b2c]">Libretto</span>, the masterful
                  script of an opera, because our B2B training is meticulously crafted for you to
                  savor and master like a work of art.
                </p>
                <p>
                  Say it aloud, and you will even hear the echo of{" "}
                  <span className="font-extrabold text-[#0e3b2c]">Libido</span> — that primal,
                  driving energy for life and discovery. It is the exact passion that fuels your
                  clients&apos; wanderlust and your own success in this industry.
                </p>
              </>
            )}
          </div>
          <div className="mt-7 text-[22px] font-extrabold text-[#0e3b2c]">
            {zh ? "欢迎来到 Libretour。" : "Welcome to Libretour."}
          </div>
        </div>
      </section>

      {/* FEATURES — big alternating rows */}
      <section className="py-[80px] sm:py-[104px]">
        <div className="max-w-[1300px] mx-auto px-6 sm:px-8">
          <div className="max-w-[680px] mx-auto text-center mb-12 sm:mb-14">
            <span className="block text-[12px] font-bold tracking-[0.18em] uppercase text-[#1f7a4e] mb-3.5">
              {zh ? "代理商为何选择 Libretour" : "Why agents choose Libretour"}
            </span>
            <h2 className="font-extrabold tracking-[-0.02em] text-[clamp(28px,3.6vw,46px)] leading-[1.08]">
              {zh ? "自信销售,所需的一切都在这里" : "Everything you need to sell with confidence"}
            </h2>
          </div>

          <div className="space-y-20 sm:space-y-24">
            {features.map((f, idx) => {
              const flip = idx % 2 === 1;
              return (
                <div
                  key={f.num}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-[72px] items-center"
                >
                  <div className={flip ? "lg:order-2" : ""}>
                    <div className="flex items-center gap-2.5 text-[13px] font-extrabold tracking-[0.14em] uppercase text-[#1f7a4e] mb-4">
                      <span className="w-[30px] h-[2px] bg-[#1f7a4e]" />
                      {f.num}
                    </div>
                    <h3 className="font-extrabold tracking-[-0.01em] text-[clamp(24px,2.8vw,38px)] leading-[1.1] mb-4">
                      {f.title}
                    </h3>
                    <p className="text-[18px] leading-[1.7] text-[#4f6b60] mb-6">{f.lead}</p>
                    <div className="flex flex-col gap-3">
                      {f.checks.map((c, ci) => {
                        const text = typeof c === "string" ? c : c.text;
                        const tag = typeof c === "string" ? null : c.tag;
                        return (
                          <div key={ci} className="flex gap-3 items-start text-[16px] leading-[1.5]">
                            <span className="w-6 h-6 rounded-full bg-[#dff1e6] text-[#17643f] flex items-center justify-center shrink-0 mt-px text-[13px] font-extrabold">
                              ✓
                            </span>
                            <span>
                              {text}
                              {tag ? (
                                <span className="inline-flex items-center ml-2 align-middle text-[11px] font-bold text-[#9a6312] bg-[#f6ecd6] border border-[#ecd9ad] rounded-full px-2.5 py-0.5">
                                  {tag}
                                </span>
                              ) : null}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    {f.pills ? (
                      <div className="flex flex-wrap gap-2.5 mt-6">
                        {f.pills.map((p) => (
                          <span
                            key={p.label}
                            className={`text-[14px] rounded-full px-4 py-1.5 font-semibold border ${
                              p.on
                                ? "bg-[#dff1e6] border-[#bfe3cc] text-[#17643f]"
                                : "border-[#e4e8e2] text-[#4f6b60]"
                            }`}
                          >
                            {p.label}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div
                    className={`rounded-[18px] overflow-hidden bg-cover bg-center aspect-[5/4] ${
                      flip ? "lg:order-1" : ""
                    }`}
                    style={{ backgroundImage: `url('${FEATURE_IMAGES[idx]}')` }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA — deep green band */}
      <section className="bg-[#0e3b2c] text-white text-center py-[80px] sm:py-24">
        <div className="max-w-[1300px] mx-auto px-6 sm:px-8">
          <h2 className="font-extrabold tracking-[-0.02em] text-[clamp(28px,3.6vw,48px)] mb-3.5">
            {zh ? (
              <>
                准备好成为<em className="not-italic text-[#9be6bf]">认证专家</em>了吗?
              </>
            ) : (
              <>
                Ready to become a{" "}
                <em className="not-italic text-[#9be6bf]">certified specialist?</em>
              </>
            )}
          </h2>
          <p className="text-white/80 text-[18px] mb-7">
            {zh
              ? "加入亚洲各地的旅游代理,他们已在通过 Libretour 赢得徽章、增长订单。"
              : "Join travel agents across Asia already earning badges and growing their bookings."}
          </p>
          <Link
            href="/learn"
            className="inline-flex items-center gap-2 rounded-full bg-white text-[#0e3b2c] font-bold text-[15px] px-[34px] py-[15px] hover:bg-[#eef4ef]"
          >
            {zh ? "免费开始学习 →" : "Start learning for free →"}
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0a2c20] text-white/70 px-6 sm:px-8 py-12">
        <div className="max-w-[1300px] mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8 text-[13.5px]">
          <div className="col-span-2 sm:col-span-1">
            <div className="text-[19px] font-extrabold text-white mb-2">Libretour</div>
            <p className="text-white/55 text-[13px] leading-relaxed">
              {zh ? "新西兰旅游 B2B 培训与认证平台。" : "B2B training & certification for NZ tourism."}
            </p>
          </div>
          <div>
            <div className="text-[11px] tracking-widest uppercase text-[#7fd8a8]/80 mb-2.5">
              {tr.fo_platform}
            </div>
            <ul className="space-y-2 text-white/70">
              <li><Link href="/explore" className="hover:text-white">{tr.nav_explore}</Link></li>
              <li><Link href="/products" className="hover:text-white">{tr.nav_operators}</Link></li>
              <li><Link href="/badges" className="hover:text-white">{tr.nav_badges}</Link></li>
              <li><Link href="/about" className="hover:text-white">{tr.fo_about}</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-[11px] tracking-widest uppercase text-[#7fd8a8]/80 mb-2.5">
              {tr.fo_legal}
            </div>
            <ul className="space-y-2 text-white/70">
              <li><Link href="/legal/terms" className="hover:text-white">{tr.fo_terms}</Link></li>
              <li><Link href="/legal/privacy" className="hover:text-white">{tr.fo_privacy}</Link></li>
              <li><Link href="/legal/acceptable-use" className="hover:text-white">{tr.fo_acceptable}</Link></li>
              <li><Link href="/legal/cookies" className="hover:text-white">{tr.fo_cookies}</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-[11px] tracking-widest uppercase text-[#7fd8a8]/80 mb-2.5">
              {tr.fo_contact_head}
            </div>
            <ul className="space-y-2 text-white/70">
              <li><a href="mailto:kiaora@libretour.com" className="hover:text-white">kiaora@libretour.com</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-[1300px] mx-auto mt-10 pt-5 border-t border-white/10 text-[12px] text-white/40">
          © {new Date().getFullYear()} Libretour Limited
        </div>
      </footer>
    </div>
  );
}
