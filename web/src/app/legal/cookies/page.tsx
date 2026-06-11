import { LegalLayout, LegalSection, LegalList, Term, type LegalDocMeta } from "../_components/legal-layout";

export const metadata = {
  title: "Cookies Policy — Libretour",
  description: "Cookies and similar technologies used by the Libretour platform.",
};

const META: LegalDocMeta = {
  title: "Cookies Policy",
  effectiveDate: "1 January 2026",
  lastUpdated: "1 January 2026",
  version: "v1.0",
  activeSlug: "cookies",
  toc: [
    { id: "s1", label: "1. Overview" },
    { id: "s2", label: "2. Categories" },
    { id: "s3", label: "3. Cookies we set" },
    { id: "s4", label: "4. Third-party cookies" },
    { id: "s5", label: "5. Local storage" },
    { id: "s6", label: "6. Managing cookies" },
    { id: "s7", label: "7. Changes" },
  ],
};

export default function CookiesPolicy() {
  return (
    <LegalLayout meta={META}>
      <p>
        This Cookies Policy describes the cookies and similar technologies used by
        Libretour Limited (<Term>&ldquo;Libretour&rdquo;</Term>, <Term>&ldquo;we&rdquo;</Term>,
        <Term> &ldquo;us&rdquo;</Term>, or <Term>&ldquo;our&rdquo;</Term>) on the Libretour
        services. It supplements our Privacy Policy.
      </p>

      <LegalSection id="s1" number="1." title="Overview">
        <p>
          A <Term>&ldquo;cookie&rdquo;</Term> is a small text file placed on your device by a
          website you visit. We also use related browser technologies (including local
          storage and session storage) for similar purposes. In this Policy, references to
          &ldquo;cookies&rdquo; include those related technologies.
        </p>
        <p>
          We use cookies only where they are strictly necessary to provide the Services
          you have requested, or where you have given consent for analytics or
          functionality cookies. We do not use cookies for cross-site advertising or
          profiling.
        </p>
      </LegalSection>

      <LegalSection id="s2" number="2." title="Categories">
        <LegalList
          items={[
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

      <LegalSection id="s3" number="3." title="Cookies we set">
        <p>
          The cookies set by Libretour from its own domains (libretour.com,
          www.libretour.com) are as follows:
        </p>
        <div className="overflow-x-auto -mx-2 my-2">
          <table className="text-[12.5px] w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px]">
                <th className="py-2 pr-3 font-mono font-normal">Name</th>
                <th className="py-2 pr-3 font-mono font-normal">Category</th>
                <th className="py-2 pr-3 font-mono font-normal">Purpose</th>
                <th className="py-2 pr-3 font-mono font-normal">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-2 pr-3 font-mono">locale</td>
                <td className="py-2 pr-3">Functionality</td>
                <td className="py-2 pr-3">Stores your selected interface language.</td>
                <td className="py-2 pr-3 font-mono">12 months</td>
              </tr>
              <tr>
                <td className="py-2 pr-3 font-mono">__session</td>
                <td className="py-2 pr-3">Strictly necessary</td>
                <td className="py-2 pr-3">Maintains your authenticated session (set by our authentication provider Clerk).</td>
                <td className="py-2 pr-3 font-mono">Session / up to 7 days</td>
              </tr>
              <tr>
                <td className="py-2 pr-3 font-mono">__client_uat</td>
                <td className="py-2 pr-3">Strictly necessary</td>
                <td className="py-2 pr-3">Records the timestamp of your last authentication for session renewal (Clerk).</td>
                <td className="py-2 pr-3 font-mono">Session</td>
              </tr>
              <tr>
                <td className="py-2 pr-3 font-mono">__cf_bm</td>
                <td className="py-2 pr-3">Strictly necessary</td>
                <td className="py-2 pr-3">Bot-management cookie set by Cloudflare; protects the Services from automated abuse.</td>
                <td className="py-2 pr-3 font-mono">30 minutes</td>
              </tr>
            </tbody>
          </table>
        </div>
      </LegalSection>

      <LegalSection id="s4" number="4." title="Third-party cookies">
        <p>
          A small number of cookies are set on our domain by third parties acting under
          contract to provide functionality strictly necessary for the Services. These
          third parties are:
        </p>
        <LegalList
          items={[
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
          We do not embed third-party advertising tags, social-media widgets, or
          remarketing pixels.
        </p>
      </LegalSection>

      <LegalSection id="s5" number="5." title="Local storage">
        <p>
          We use browser local storage to cache UI state (such as the most recent draft of
          a search query) and to hold a short-lived progress timer for the learning
          dwell-time gate. Local storage values are not transmitted to our servers except
          where you submit them as part of a normal request.
        </p>
      </LegalSection>

      <LegalSection id="s6" number="6." title="Managing cookies">
        <p>
          Most browsers allow you to control cookies through their settings. Refusing
          strictly-necessary cookies will prevent the Services from functioning. The
          following resources may help you manage cookies in common browsers:
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

      <LegalSection id="s7" number="7." title="Changes to this Policy">
        <p>
          We will update this Policy if we introduce new cookies or change the purpose of
          existing cookies. The &ldquo;Last updated&rdquo; date at the top of this Policy
          reflects the most recent change.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
