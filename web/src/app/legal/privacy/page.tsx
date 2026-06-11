import { LegalLayout, LegalSection, LegalList, Term, type LegalDocMeta } from "../_components/legal-layout";

export const metadata = {
  title: "Privacy Policy — Libretour",
  description:
    "How Libretour collects, uses, stores, and discloses personal information under the New Zealand Privacy Act 2020.",
};

const META: LegalDocMeta = {
  title: "Privacy Policy",
  effectiveDate: "1 January 2026",
  lastUpdated: "1 January 2026",
  version: "v1.0",
  activeSlug: "privacy",
  toc: [
    { id: "s1", label: "1. Who we are" },
    { id: "s2", label: "2. Scope" },
    { id: "s3", label: "3. Personal information we collect" },
    { id: "s4", label: "4. Purposes of collection" },
    { id: "s5", label: "5. How we use information" },
    { id: "s6", label: "6. Disclosure" },
    { id: "s7", label: "7. Overseas storage and transfer" },
    { id: "s8", label: "8. AI processing" },
    { id: "s9", label: "9. Voice cloning" },
    { id: "s10", label: "10. Retention" },
    { id: "s11", label: "11. Security" },
    { id: "s12", label: "12. Your rights" },
    { id: "s13", label: "13. Cookies" },
    { id: "s14", label: "14. Children" },
    { id: "s15", label: "15. Complaints" },
    { id: "s16", label: "16. Contact" },
    { id: "s17", label: "17. Changes" },
  ],
};

export default function PrivacyPolicy() {
  return (
    <LegalLayout meta={META}>
      <p>
        This Privacy Policy (this <Term>&ldquo;Policy&rdquo;</Term>) explains how Libretour
        Limited (NZBN [TBD-NZBN]), a New Zealand company having its registered office at
        [TBD-registered-address] (<Term>&ldquo;Libretour&rdquo;</Term>, <Term>&ldquo;we&rdquo;</Term>,
        <Term> &ldquo;us&rdquo;</Term>, or <Term>&ldquo;our&rdquo;</Term>), collects, uses, stores,
        and discloses personal information when you access or use the Libretour website,
        services, applications, and related platforms (collectively, the
        <Term> &ldquo;Services&rdquo;</Term>).
      </p>
      <p>
        Libretour is a data controller (referred to in New Zealand as an
        <Term> &ldquo;agency&rdquo;</Term>) for the purposes of the Privacy Act 2020 (the
        <Term> &ldquo;Privacy Act&rdquo;</Term>) and is committed to compliance with the
        thirteen Information Privacy Principles (each, an <Term>&ldquo;IPP&rdquo;</Term>) set out
        in section 22 of the Privacy Act.
      </p>

      <LegalSection id="s1" number="1." title="Who we are">
        <p>
          Libretour operates a business-to-business training and certification platform for
          the New Zealand tourism industry. Tourism suppliers publish training material
          about their products on the platform; travel agents (<Term>&ldquo;Learners&rdquo;</Term>)
          register, complete the training, and receive verifiable digital badges. The
          platform also makes available an AI assistant that answers questions grounded in
          supplier-provided content.
        </p>
      </LegalSection>

      <LegalSection id="s2" number="2." title="Scope of this Policy">
        <p>
          This Policy applies to personal information collected by Libretour in connection
          with the Services. It does not apply to information collected by:
        </p>
        <LegalList
          items={[
            <>third parties operating their own websites or services to which the Services link;</>,
            <>tourism suppliers in their capacity as independent data controllers of their
              own learner records (each supplier maintains its own privacy practices);</>,
            <>Libretour&apos;s employment-related personal information, which is governed by
              separate workforce notices.</>,
          ]}
        />
      </LegalSection>

      <LegalSection id="s3" number="3." title="Personal information we collect (IPPs 1–4)">
        <p>
          Consistent with IPPs 1 to 4, Libretour collects only the personal information
          necessary for, and directly related to, the purposes described in section 4 of
          this Policy. We collect the following categories of personal information:
        </p>
        <LegalList
          items={[
            <>
              <Term>Account information</Term>: full name, work email address, employer or
              agency name, country, and (optionally) preferred display language. Account
              creation is intermediated by our authentication provider (Clerk, Inc.).
            </>,
            <>
              <Term>Authentication identifiers</Term>: a unique user identifier issued by
              Clerk and any single-sign-on identifiers you elect to associate with your
              account.
            </>,
            <>
              <Term>Learning activity</Term>: courses you enrol in, modules you complete,
              quiz responses, dwell time per chapter, language preferences, and digital
              badges awarded.
            </>,
            <>
              <Term>AI assistant interactions</Term>: the natural-language questions you
              submit to the in-platform AI assistant, the responses generated, citation
              metadata, and (for signed-in users) a per-question latency and source-kind
              audit log.
            </>,
            <>
              <Term>Voluntary feedback</Term>: star ratings and free-text feedback you
              choose to provide to suppliers about their training.
            </>,
            <>
              <Term>Voice samples</Term>: only where a supplier explicitly uploads an audio
              recording for voice cloning, the underlying audio file and any derived voice
              model identifier. See section 9.
            </>,
            <>
              <Term>Technical information</Term>: IP address, user-agent string, approximate
              geolocation (country/region), referring URL, and access timestamps, collected
              automatically when you access the Services.
            </>,
            <>
              <Term>Cookies and similar technologies</Term>: as described in section 13 of
              this Policy and in our Cookies Policy.
            </>,
          ]}
        />
        <p>
          We do not knowingly collect government-issued identifiers, financial-account
          details (other than where lawfully provided by your payment provider for
          subscription billing), or information classified as <em>sensitive information</em>
          {" "}under the Privacy Act unless you voluntarily provide it.
        </p>
      </LegalSection>

      <LegalSection id="s4" number="4." title="Purposes of collection (IPP 1)">
        <p>
          We collect personal information for the following lawful purposes connected with
          a function or activity of Libretour:
        </p>
        <LegalList
          items={[
            <>to create, secure, and operate your user account;</>,
            <>to deliver, personalise, and improve the Services, including learner
              progress tracking, badge issuance, and the AI assistant;</>,
            <>to provide aggregated and individual-level analytics to the tourism supplier
              whose training you have enrolled in;</>,
            <>to communicate with you about the Services, including transactional
              notifications, security alerts, and updates to this Policy;</>,
            <>to respond to your enquiries, support requests, and any rights requests under
              the Privacy Act;</>,
            <>to detect, prevent, and respond to fraud, abuse, security incidents, and
              breaches of our Terms of Service or Acceptable Use Policy;</>,
            <>to comply with our legal and regulatory obligations under New Zealand law;
              and</>,
            <>where you have given separate, informed consent, to use voice samples to
              create a synthetic voice model for narration of training content.</>,
          ]}
        />
      </LegalSection>

      <LegalSection id="s5" number="5." title="How we use personal information">
        <p>
          We use the personal information described above for the purposes set out in
          section 4. We do not sell personal information. We do not use personal
          information for behavioural advertising or for unrelated secondary purposes
          without first obtaining your authorisation as required by IPP 10.
        </p>
        <p>
          Where we use AI systems to process your data, we do so under arrangements
          described in section 8.
        </p>
      </LegalSection>

      <LegalSection id="s6" number="6." title="Disclosure to third parties (IPPs 10 & 11)">
        <p>
          We disclose personal information only where one or more of the grounds in IPP 11
          applies. The categories of recipient are:
        </p>
        <LegalList
          items={[
            <>
              <Term>Tourism suppliers</Term>: each supplier may access the names, email
              addresses, agency affiliations, course progress, badges, ratings, and AI
              question logs of Learners who have enrolled in that supplier&apos;s training.
              Suppliers are independent agencies under the Privacy Act and are responsible
              for their own subsequent handling.
            </>,
            <>
              <Term>Service providers</Term>: cloud infrastructure (Cloudflare, Inc.),
              authentication (Clerk, Inc.), large-language-model providers (Anthropic, PBC
              and, where applicable, OpenAI, OpCo, LLC), voice-synthesis providers
              (ElevenLabs, Inc. and others described in section 9), and email delivery
              (Resend, Inc.), each acting under written confidentiality and security
              obligations.
            </>,
            <>
              <Term>Search and citation providers</Term>: where the AI assistant is unable
              to answer from supplier-provided content, the assistant may forward the
              question text to a web-search provider (Tavily AI, Inc.) to retrieve public
              sources. Account-identifying information is not transmitted.
            </>,
            <>
              <Term>Professional advisers</Term>: our lawyers, accountants, insurers, and
              auditors, where strictly necessary.
            </>,
            <>
              <Term>Acquirers</Term>: in connection with any actual or contemplated merger,
              acquisition, financing, or reorganisation, subject to confidentiality
              obligations on the receiving party.
            </>,
            <>
              <Term>Regulators and authorities</Term>: where disclosure is required or
              authorised by New Zealand law, including without limitation requests by the
              Office of the Privacy Commissioner, the New Zealand Police, or a court of
              competent jurisdiction.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection id="s7" number="7." title="Overseas storage and cross-border transfer (IPP 12)">
        <p>
          The Services are operated using Cloudflare&apos;s global edge network. Personal
          information may be stored, processed, or routed through Cloudflare data centres
          located outside New Zealand, including in Australia, the United States, the
          European Union, and the United Kingdom. AI processing under section 8 takes place
          on infrastructure operated by Anthropic, PBC, principally in the United States.
        </p>
        <p>
          In accordance with IPP 12, we disclose personal information to a foreign person
          or entity only where:
        </p>
        <LegalList
          items={[
            <>the foreign person is subject to comparable privacy safeguards (whether
              under the law of their home jurisdiction or under binding contractual
              undertakings); or</>,
            <>you have been expressly informed and have authorised the disclosure.</>,
          ]}
        />
        <p>
          By using the Services, you acknowledge that overseas processing as described
          above is necessary for the Services to function and you authorise such
          processing.
        </p>
      </LegalSection>

      <LegalSection id="s8" number="8." title="AI processing">
        <p>
          The Services include an AI assistant powered by third-party large-language-model
          providers. When you submit a question to the assistant, the following data is
          transmitted to the model provider for the sole purpose of generating a response:
        </p>
        <LegalList
          items={[
            <>the question text;</>,
            <>the operator-published training content and supplementary materials relevant
              to your question;</>,
            <>at most, a short context window of your conversation with the assistant on
              the current page; and</>,
            <>no direct account identifier (your user identifier is not transmitted).</>,
          ]}
        />
        <p>
          We require model providers to process this data under enterprise terms that
          prohibit use of customer data for the training of generalised foundation models.
          Translation features and AI-generated quiz authoring follow the same prohibition.
          We do not warrant any particular accuracy, completeness, or fitness for any
          purpose of AI-generated responses; you must independently verify any information
          relied upon for commercial purposes.
        </p>
      </LegalSection>

      <LegalSection id="s9" number="9." title="Voice cloning and synthetic voices">
        <p>
          The Services optionally permit tourism suppliers to create a synthetic voice
          model from an uploaded audio sample of a human speaker (the
          <Term> &ldquo;Voice Donor&rdquo;</Term>). Voice models are generated by a
          third-party provider (currently ElevenLabs, Inc.) and the audio sample is
          retained for the purpose of regenerating or updating the model.
        </p>
        <p>
          A supplier may upload a voice sample only where:
        </p>
        <LegalList
          items={[
            <>the Voice Donor has provided informed, written consent to the recording, the
              cloning, and the subsequent commercial use of the resulting synthetic voice
              in supplier training materials distributed via the Services;</>,
            <>the supplier retains evidence of that consent and will produce it to
              Libretour on request; and</>,
            <>the Voice Donor is at least 18 years of age.</>,
          ]}
        />
        <p>
          On request by the Voice Donor or by the supplier, Libretour will delete the audio
          sample, instruct the synthetic-voice provider to delete the underlying voice
          model, and remove or replace audio generated from that model in published
          training material, in each case within thirty (30) days of the request.
        </p>
      </LegalSection>

      <LegalSection id="s10" number="10." title="Retention of personal information">
        <p>
          We retain personal information only for as long as is reasonably necessary for
          the purposes described in section 4, unless a longer retention period is
          required or permitted by law. Standard retention periods are:
        </p>
        <LegalList
          items={[
            <>account records: for the lifetime of the account, plus twelve (12) months
              after deletion to handle deletion reversals and security investigations;</>,
            <>learning activity, quiz attempts, and badge records: for the lifetime of the
              account, then retained in anonymised form for supplier analytics;</>,
            <>AI assistant logs: for twenty-four (24) months from the date of the
              conversation;</>,
            <>course feedback (ratings and free-text): for the lifetime of the course;</>,
            <>voice samples and voice models: until withdrawal of consent (see section 9)
              or termination of the supplier&apos;s subscription;</>,
            <>technical access logs: for ninety (90) days, after which they are
              aggregated.</>,
          ]}
        />
      </LegalSection>

      <LegalSection id="s11" number="11." title="Security safeguards (IPP 5)">
        <p>
          Libretour takes the reasonable security safeguards required by IPP 5 to protect
          personal information against loss, unauthorised access, use, modification, or
          disclosure. These safeguards include encryption in transit (TLS 1.2 or higher),
          encryption at rest, role-based access controls within the platform, periodic
          access reviews, and contractual security obligations on each of our service
          providers. No method of electronic transmission or storage is, however,
          completely secure, and Libretour cannot guarantee absolute security.
        </p>
        <p>
          Libretour maintains a notifiable-privacy-breach response process and will notify
          the Office of the Privacy Commissioner and affected individuals as required by
          sections 114 to 117 of the Privacy Act in the event of a notifiable privacy
          breach.
        </p>
      </LegalSection>

      <LegalSection id="s12" number="12." title="Your rights (IPPs 6 & 7)">
        <p>
          Under IPPs 6 and 7 of the Privacy Act you are entitled, at no charge, to:
        </p>
        <LegalList
          items={[
            <>request confirmation that we hold personal information about you;</>,
            <>request access to that information;</>,
            <>request correction of information that is inaccurate, incomplete, or
              misleading; and</>,
            <>attach a statement of correction sought but not made.</>,
          ]}
        />
        <p>
          We will respond to a verified rights request within twenty (20) working days, in
          accordance with section 41 of the Privacy Act. To exercise these rights, contact
          us using the details in section 16. We may require proof of identity before
          actioning a request.
        </p>
        <p>
          You may also at any time delete your account from within the Services. Account
          deletion triggers the retention process described in section 10. Some derived,
          aggregated, or anonymised data may continue to be retained where it is no longer
          personal information.
        </p>
      </LegalSection>

      <LegalSection id="s13" number="13." title="Cookies and similar technologies">
        <p>
          Libretour uses a small number of strictly necessary cookies (for authentication
          and language preference), together with limited first-party analytics cookies.
          Details, including the name and purpose of each cookie, are set out in our
          Cookies Policy. Where applicable law requires informed consent for non-essential
          cookies, we obtain that consent before setting them.
        </p>
      </LegalSection>

      <LegalSection id="s14" number="14." title="Children">
        <p>
          The Services are intended for use by professional travel agents and tourism
          suppliers and are not directed to children. We do not knowingly collect personal
          information from any individual under the age of sixteen (16). If we become aware
          that we have inadvertently collected personal information from a child under that
          age, we will delete it as soon as practicable.
        </p>
      </LegalSection>

      <LegalSection id="s15" number="15." title="Complaints">
        <p>
          If you believe that we have failed to comply with the Privacy Act or this Policy,
          please contact us first using the details in section 16. We take privacy
          complaints seriously and will investigate promptly.
        </p>
        <p>
          You also have the right to make a complaint directly to the Office of the
          Privacy Commissioner of New Zealand:
        </p>
        <LegalList
          items={[
            <>online: <a className="text-emerald-700 hover:underline" href="https://www.privacy.org.nz/your-rights/making-a-complaint/" target="_blank" rel="noreferrer">privacy.org.nz</a>;</>,
            <>by telephone: 0800 803 909;</>,
            <>by post: PO Box 10094, The Terrace, Wellington 6143.</>,
          ]}
        />
      </LegalSection>

      <LegalSection id="s16" number="16." title="Contact us">
        <p>
          Privacy questions, requests, and complaints should be directed to our Privacy
          Officer:
        </p>
        <LegalList
          items={[
            <>email: <a className="text-emerald-700 hover:underline" href="mailto:privacy@libretour.com">privacy@libretour.com</a>;</>,
            <>post: Privacy Officer, Libretour Limited, [TBD-registered-address], New
              Zealand.</>,
          ]}
        />
      </LegalSection>

      <LegalSection id="s17" number="17." title="Changes to this Policy">
        <p>
          We may amend this Policy from time to time. Material changes will be notified by
          email to all account holders and posted prominently on the Services at least ten
          (10) working days before they take effect. Continued use of the Services after
          the effective date of an amendment constitutes acceptance of the amended Policy.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
