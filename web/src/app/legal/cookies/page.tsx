import { LegalLayout, LegalSection, LegalList, Term, type LegalDocMeta } from "../_components/legal-layout";
import { getLocale } from "@/lib/i18n";

export const metadata = {
  title: "Cookies Policy — Libretour",
  description: "Cookies and similar technologies used by the Libretour platform.",
};

export default async function CookiesPolicy() {
  const locale = await getLocale();
  const zh = locale === "zh-CN";

  const META: LegalDocMeta = {
    title: zh ? "Cookie 政策" : "Cookies Policy",
    effectiveDate: "1 January 2026",
    lastUpdated: "1 January 2026",
    version: "v1.0",
    activeSlug: "cookies",
    toc: [
      { id: "s1", label: zh ? "1. 概述" : "1. Overview" },
      { id: "s2", label: zh ? "2. 类别" : "2. Categories" },
      { id: "s3", label: zh ? "3. 我们设置的 Cookie" : "3. Cookies we set" },
      { id: "s4", label: zh ? "4. 第三方 Cookie" : "4. Third-party cookies" },
      { id: "s5", label: zh ? "5. 本地存储" : "5. Local storage" },
      { id: "s6", label: zh ? "6. 管理 Cookie" : "6. Managing cookies" },
      { id: "s7", label: zh ? "7. 变更" : "7. Changes" },
    ],
  };

  return (
    <LegalLayout meta={META}>
      <p>
        {zh ? (
          <>
            本 Cookie 政策说明 Libretour Limited（<Term>「Libretour」</Term>、<Term>「我们」</Term>、
            <Term>「我方」</Term>或<Term>「我们的」</Term>）在 Libretour 服务上所使用的 Cookie 及类似技术。
            本政策为我们隐私政策的补充。
          </>
        ) : (
          <>
            This Cookies Policy describes the cookies and similar technologies used by
            Libretour Limited (<Term>&ldquo;Libretour&rdquo;</Term>, <Term>&ldquo;we&rdquo;</Term>,
            <Term> &ldquo;us&rdquo;</Term>, or <Term>&ldquo;our&rdquo;</Term>) on the Libretour
            services. It supplements our Privacy Policy.
          </>
        )}
      </p>

      <LegalSection id="s1" number="1." title={zh ? "概述" : "Overview"}>
        <p>
          {zh ? (
            <>
              <Term>「Cookie」</Term>是您所访问的网站置于您设备上的小型文本文件。我们亦使用相关的浏览器技术
              （包括本地存储与会话存储）以实现类似目的。在本政策中，凡提及「Cookie」之处，均包括上述相关技术。
            </>
          ) : (
            <>
              A <Term>&ldquo;cookie&rdquo;</Term> is a small text file placed on your device by a
              website you visit. We also use related browser technologies (including local
              storage and session storage) for similar purposes. In this Policy, references to
              &ldquo;cookies&rdquo; include those related technologies.
            </>
          )}
        </p>
        <p>
          {zh
            ? "我们仅在为提供您所请求的服务而严格必要时，或在您已就分析类或功能类 Cookie 给予同意时，方使用 Cookie。我们不会将 Cookie 用于跨站广告或用户画像分析。"
            : "We use cookies only where they are strictly necessary to provide the Services you have requested, or where you have given consent for analytics or functionality cookies. We do not use cookies for cross-site advertising or profiling."}
        </p>
      </LegalSection>

      <LegalSection id="s2" number="2." title={zh ? "类别" : "Categories"}>
        <LegalList
          items={zh ? [
            <>
              <Term>严格必要的 Cookie</Term>是服务正常运行所必需的。其中包括用以维持您已认证会话的
              Cookie，以及记录您语言偏好的 Cookie。在不破坏服务的情况下，此类 Cookie 无法被停用。
            </>,
            <>
              <Term>功能类 Cookie</Term>记住您所作出的选择，以使服务在多次访问之间表现一致。
              我们目前仅使用一项功能类 Cookie，即语言偏好 Cookie。
            </>,
            <>
              <Term>分析类 Cookie</Term>帮助我们了解聚合后的使用模式，以便改进服务。我们目前并未设置
              任何分析类 Cookie。若我们引入此类 Cookie，将更新本政策，并（在法律要求时）事先征得您的同意。
            </>,
            <>
              Libretour 不设置<Term>广告类 Cookie</Term>。
            </>,
          ] : [
            <>
              <Term>Strictly necessary cookies</Term> are required for the Services to
              function. They include cookies that maintain your authenticated session and
              cookies that record your language preference. These cookies cannot be
              disabled without breaking the Services.
            </>,
            <>
              <Term>Functionality cookies</Term> remember choices you make so that the
              Services behave consistently across visits. We currently use only one
              functionality cookie, the language preference cookie.
            </>,
            <>
              <Term>Analytics cookies</Term> help us understand aggregated usage patterns
              so that we can improve the Services. We do not currently set any analytics
              cookies. If we introduce any, we will update this Policy and (where required)
              seek your prior consent.
            </>,
            <>
              <Term>Advertising cookies</Term> are not set by Libretour.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection id="s3" number="3." title={zh ? "我们设置的 Cookie" : "Cookies we set"}>
        <p>
          {zh
            ? "Libretour 从其自有域名（libretour.com、www.libretour.com）设置的 Cookie 如下："
            : "The cookies set by Libretour from its own domains (libretour.com, www.libretour.com) are as follows:"}
        </p>
        <div className="overflow-x-auto -mx-2 my-2">
          <table className="text-[12.5px] w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px]">
                <th className="py-2 pr-3 font-mono font-normal">{zh ? "名称" : "Name"}</th>
                <th className="py-2 pr-3 font-mono font-normal">{zh ? "类别" : "Category"}</th>
                <th className="py-2 pr-3 font-mono font-normal">{zh ? "用途" : "Purpose"}</th>
                <th className="py-2 pr-3 font-mono font-normal">{zh ? "有效期" : "Duration"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-2 pr-3 font-mono">locale</td>
                <td className="py-2 pr-3">{zh ? "功能类" : "Functionality"}</td>
                <td className="py-2 pr-3">{zh ? "存储您所选择的界面语言。" : "Stores your selected interface language."}</td>
                <td className="py-2 pr-3 font-mono">{zh ? "12 个月" : "12 months"}</td>
              </tr>
              <tr>
                <td className="py-2 pr-3 font-mono">__session</td>
                <td className="py-2 pr-3">{zh ? "严格必要" : "Strictly necessary"}</td>
                <td className="py-2 pr-3">{zh ? "维持您已认证的会话（由我们的认证服务提供商 Clerk 设置）。" : "Maintains your authenticated session (set by our authentication provider Clerk)."}</td>
                <td className="py-2 pr-3 font-mono">{zh ? "会话期 / 最长 7 天" : "Session / up to 7 days"}</td>
              </tr>
              <tr>
                <td className="py-2 pr-3 font-mono">__client_uat</td>
                <td className="py-2 pr-3">{zh ? "严格必要" : "Strictly necessary"}</td>
                <td className="py-2 pr-3">{zh ? "记录您上次认证的时间戳，用于会话续期（Clerk）。" : "Records the timestamp of your last authentication for session renewal (Clerk)."}</td>
                <td className="py-2 pr-3 font-mono">{zh ? "会话期" : "Session"}</td>
              </tr>
              <tr>
                <td className="py-2 pr-3 font-mono">__cf_bm</td>
                <td className="py-2 pr-3">{zh ? "严格必要" : "Strictly necessary"}</td>
                <td className="py-2 pr-3">{zh ? "由 Cloudflare 设置的机器人管理 Cookie;保护服务免受自动化滥用。" : "Bot-management cookie set by Cloudflare; protects the Services from automated abuse."}</td>
                <td className="py-2 pr-3 font-mono">{zh ? "30 分钟" : "30 minutes"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </LegalSection>

      <LegalSection id="s4" number="4." title={zh ? "第三方 Cookie" : "Third-party cookies"}>
        <p>
          {zh
            ? "我们域名上有少量 Cookie 由依合约行事的第三方设置，用以提供服务所严格必要的功能。这些第三方为："
            : "A small number of cookies are set on our domain by third parties acting under contract to provide functionality strictly necessary for the Services. These third parties are:"}
        </p>
        <LegalList
          items={zh ? [
            <>
              <Term>Clerk, Inc.</Term> — 设置 <code className="font-mono">__session</code>{" "}
              与 <code className="font-mono">__client_uat</code> Cookie，以提供我们的认证服务。
            </>,
            <>
              <Term>Cloudflare, Inc.</Term> — 设置 <code className="font-mono">__cf_bm</code>{" "}
              Cookie，以检测并缓解自动化滥用。
            </>,
          ] : [
            <>
              <Term>Clerk, Inc.</Term> — sets the <code className="font-mono">__session</code>{" "}
              and <code className="font-mono">__client_uat</code> cookies to provide our
              authentication service.
            </>,
            <>
              <Term>Cloudflare, Inc.</Term> — sets the <code className="font-mono">__cf_bm</code>{" "}
              cookie to detect and mitigate automated abuse.
            </>,
          ]}
        />
        <p>
          {zh
            ? "我们不嵌入第三方广告代码、社交媒体小工具或再营销像素。"
            : "We do not embed third-party advertising tags, social-media widgets, or remarketing pixels."}
        </p>
      </LegalSection>

      <LegalSection id="s5" number="5." title={zh ? "本地存储" : "Local storage"}>
        <p>
          {zh
            ? "我们使用浏览器本地存储来缓存界面状态（例如搜索查询的最新草稿），并保存用于学习停留时长门槛的短时进度计时器。除非您将本地存储中的数值作为正常请求的一部分提交，否则这些数值不会传输至我们的服务器。"
            : "We use browser local storage to cache UI state (such as the most recent draft of a search query) and to hold a short-lived progress timer for the learning dwell-time gate. Local storage values are not transmitted to our servers except where you submit them as part of a normal request."}
        </p>
      </LegalSection>

      <LegalSection id="s6" number="6." title={zh ? "管理 Cookie" : "Managing cookies"}>
        <p>
          {zh
            ? "大多数浏览器允许您通过其设置来控制 Cookie。拒绝严格必要的 Cookie 将导致服务无法运行。以下资源可帮助您在常见浏览器中管理 Cookie："
            : "Most browsers allow you to control cookies through their settings. Refusing strictly-necessary cookies will prevent the Services from functioning. The following resources may help you manage cookies in common browsers:"}
        </p>
        <LegalList
          items={[
            <>
              <a className="text-emerald-700 hover:underline" href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noreferrer">
                Google Chrome
              </a>;
            </>,
            <>
              <a className="text-emerald-700 hover:underline" href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noreferrer">
                Mozilla Firefox
              </a>;
            </>,
            <>
              <a className="text-emerald-700 hover:underline" href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noreferrer">
                Apple Safari
              </a>;
            </>,
            <>
              <a className="text-emerald-700 hover:underline" href="https://support.microsoft.com/en-us/windows/manage-cookies-in-microsoft-edge-view-allow-block-delete-and-use-168dab11-0753-043d-7c16-ede5947fc64d" target="_blank" rel="noreferrer">
                Microsoft Edge
              </a>.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection id="s7" number="7." title={zh ? "本政策的变更" : "Changes to this Policy"}>
        <p>
          {zh ? (
            <>
              若我们引入新的 Cookie 或变更现有 Cookie 的用途，我们将更新本政策。本政策顶部的
              「最近更新」日期反映最近一次的变更。
            </>
          ) : (
            <>
              We will update this Policy if we introduce new cookies or change the purpose of
              existing cookies. The &ldquo;Last updated&rdquo; date at the top of this Policy
              reflects the most recent change.
            </>
          )}
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
