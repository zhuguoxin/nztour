import { LegalLayout, LegalSection, LegalList, Term, type LegalDocMeta } from "../_components/legal-layout";

export const metadata = {
  title: "Acceptable Use Policy — Libretour",
  description:
    "Rules governing the content and conduct permitted on the Libretour platform.",
};

const META: LegalDocMeta = {
  title: "Acceptable Use Policy",
  effectiveDate: "1 January 2026",
  lastUpdated: "1 January 2026",
  version: "v1.0",
  activeSlug: "acceptable-use",
  toc: [
    { id: "s1", label: "1. Application" },
    { id: "s2", label: "2. Prohibited content" },
    { id: "s3", label: "3. Regulated industries" },
    { id: "s4", label: "4. Misleading claims" },
    { id: "s5", label: "5. Intellectual property" },
    { id: "s6", label: "6. Voice cloning consent" },
    { id: "s7", label: "7. AI assistant misuse" },
    { id: "s8", label: "8. Account and security abuse" },
    { id: "s9", label: "9. Reporting violations" },
    { id: "s10", label: "10. Enforcement" },
  ],
};

export default function AcceptableUsePolicy() {
  return (
    <LegalLayout meta={META}>
      <p>
        This Acceptable Use Policy (the <Term>&ldquo;Policy&rdquo;</Term>) sets out the rules that
        all Users of the Libretour services must comply with. It supplements the Terms of
        Service and is incorporated into the Terms of Service by reference. Capitalised
        terms not defined here have the meanings given in the Terms of Service.
      </p>

      <LegalSection id="s1" number="1." title="Application">
        <p>
          This Policy applies to all Customer Content, all AI assistant interactions, and
          all other conduct on the Services. Each Supplier is responsible for ensuring
          that its Customer Content and its personnel comply with this Policy, and each
          Learner is responsible for its own conduct.
        </p>
      </LegalSection>

      <LegalSection id="s2" number="2." title="Prohibited content">
        <p>
          You must not upload, transmit, publish, link to, or otherwise make available
          through the Services any content that:
        </p>
        <LegalList
          items={[
            <>is unlawful, defamatory, threatening, harassing, obscene, sexually
              explicit, or that would constitute a harmful digital communication under
              the Harmful Digital Communications Act 2015;</>,
            <>discriminates against, or incites hatred or violence against, any person or
              group on the basis of a prohibited ground under the Human Rights Act 1993;</>,
            <>contains malware, viruses, ransomware, worms, time bombs, Trojan horses, or
              any other malicious code;</>,
            <>is designed to phish, harvest credentials, or otherwise deceive a User as to
              the origin or purpose of the content;</>,
            <>encourages or enables criminal activity, fraud, or the evasion of taxes or
              regulatory obligations; or</>,
            <>is the personal information of another individual where the User does not
              have authority to disclose that information.</>,
          ]}
        />
      </LegalSection>

      <LegalSection id="s3" number="3." title="Regulated industries">
        <p>
          The Services are intended for tourism-industry training. You must not use the
          Services to promote, market, or advertise products or activities for which a
          licence is required and not held, or which are subject to category-specific
          marketing restrictions under New Zealand law. By way of example and without
          limitation, this includes:
        </p>
        <LegalList
          items={[
            <>gambling and gaming services regulated by the Gambling Act 2003;</>,
            <>the supply of alcohol regulated by the Sale and Supply of Alcohol Act 2012;</>,
            <>the supply of psychoactive substances regulated by the Psychoactive
              Substances Act 2013;</>,
            <>tobacco and vaping products regulated by the Smokefree Environments and
              Regulated Products Act 1990;</>,
            <>financial products and services regulated by the Financial Markets Conduct
              Act 2013;</>,
            <>therapeutic or health-related claims regulated by the Medicines Act 1981 or
              the Therapeutic Products Act 2023.</>,
          ]}
        />
        <p>
          Where a Supplier&apos;s lawful operations include any of the foregoing categories
          (for example, a hotel operator with a licensed bar), the Supplier must scope its
          Customer Content to general operational training and may not use the Services
          for promotional purposes within those categories.
        </p>
      </LegalSection>

      <LegalSection id="s4" number="4." title="Misleading and unsubstantiated claims">
        <p>
          You must not make any representation in Customer Content that is, or is likely
          to be, misleading or deceptive within the meaning of section 9 of the Fair
          Trading Act 1986. In particular, you must not make:
        </p>
        <LegalList
          items={[
            <>unsubstantiated claims about price, availability, scarcity, characteristics,
              suitability, performance, quality, or safety of a product;</>,
            <>environmental or sustainability claims that are not supported by reasonable
              evidence at the time the claim is made;</>,
            <>claims of endorsement, sponsorship, or approval that have not been given by
              the named party; or</>,
            <>claims about the conditions, restrictions, or refund terms applicable to a
              product that conflict with the terms actually offered to the consumer.</>,
          ]}
        />
      </LegalSection>

      <LegalSection id="s5" number="5." title="Intellectual property">
        <p>
          You must not upload Customer Content that infringes any third party&apos;s
          copyright, trademark, registered design, or other intellectual property right,
          including:
        </p>
        <LegalList
          items={[
            <>images, photographs, or video footage that you do not own and for which you
              do not have a licence;</>,
            <>music, sound effects, or scripts that are subject to third-party copyright;</>,
            <>logos, brand names, or distinctive marks of third parties (including those
              of competitors or partner operators) without express written permission;</>,
            <>content extracted from publications protected by copyright, beyond what is
              permitted as fair dealing under the Copyright Act 1994.</>,
          ]}
        />
      </LegalSection>

      <LegalSection id="s6" number="6." title="Voice cloning consent">
        <p>
          Voice cloning may only be used where the Supplier holds the prior informed
          written consent of the Voice Donor, as described in section 7 of the Terms of
          Service. In addition, the Supplier:
        </p>
        <LegalList
          items={[
            <>must keep the original consent document (or a digital equivalent) for the
              duration of the use of the cloned voice and for not less than seven (7)
              years thereafter;</>,
            <>must not use a cloned voice to imitate any individual other than the Voice
              Donor or to attribute statements to any individual that they did not
              authorise;</>,
            <>must not use a cloned voice in any manner that would constitute a deceptive
              representation under the Fair Trading Act 1986; and</>,
            <>must comply with any reasonable instruction from Libretour to remove or
              substitute audio generated from a cloned voice where a credible consent
              dispute has been raised.</>,
          ]}
        />
      </LegalSection>

      <LegalSection id="s7" number="7." title="AI assistant misuse">
        <p>You must not use the in-platform AI assistant to:</p>
        <LegalList
          items={[
            <>attempt to extract verbatim copies of supplier-private content beyond what
              the assistant is configured to disclose;</>,
            <>generate content that would otherwise breach this Policy if uploaded
              directly;</>,
            <>circumvent learning, quiz, or chapter gating mechanisms intended to
              establish the Learner&apos;s competence;</>,
            <>generate political, religious, or partisan campaigning content unrelated to
              the tourism training purpose of the Services; or</>,
            <>conduct automated bulk querying with the intent of harvesting model
              responses for re-publication, model training, or competitive analysis.</>,
          ]}
        />
      </LegalSection>

      <LegalSection id="s8" number="8." title="Account, network, and security abuse">
        <p>You must not, and must not attempt to:</p>
        <LegalList
          items={[
            <>share, sell, or transfer your account credentials, or maintain multiple
              accounts to circumvent quotas;</>,
            <>scrape, crawl, harvest, or index the Services through automated means
              outside of a published API;</>,
            <>probe, scan, or test the vulnerability of the Services without express
              written authorisation from Libretour, except as part of a published
              responsible-disclosure programme;</>,
            <>interfere with, overload, or impair the operation of the Services or any
              other User&apos;s use of them;</>,
            <>reverse-engineer, decompile, or attempt to extract the source code of any
              part of the Services, except to the extent expressly permitted by law; or</>,
            <>introduce content into the Services that is designed to manipulate or
              destabilise our AI systems (including via prompt-injection techniques).</>,
          ]}
        />
      </LegalSection>

      <LegalSection id="s9" number="9." title="Reporting violations">
        <p>
          If you become aware of any conduct or content that you believe breaches this
          Policy, please report it to abuse@libretour.com. Reports should include the URL
          or in-platform location of the content, a description of the alleged breach, and
          the reporter&apos;s contact details. We will acknowledge each report within five
          (5) Working Days.
        </p>
      </LegalSection>

      <LegalSection id="s10" number="10." title="Enforcement">
        <p>
          Where Libretour reasonably believes that a User has breached this Policy,
          Libretour may, in its discretion and proportionate to the seriousness of the
          breach:
        </p>
        <LegalList
          items={[
            <>issue a written warning;</>,
            <>remove or disable access to the offending content;</>,
            <>suspend the User&apos;s account for a period not exceeding sixty (60) days;</>,
            <>terminate the User&apos;s account and Subscription in accordance with the
              Terms of Service;</>,
            <>retain logs and metadata for the purpose of investigation or to assist law
              enforcement; or</>,
            <>refer the matter to the New Zealand Police, the Office of the Privacy
              Commissioner, or any other competent regulator.</>,
          ]}
        />
      </LegalSection>
    </LegalLayout>
  );
}
