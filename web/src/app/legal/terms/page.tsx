import { LegalLayout, LegalSection, LegalList, Term, type LegalDocMeta } from "../_components/legal-layout";

export const metadata = {
  title: "Terms of Service — Libretour",
  description:
    "Legal terms governing the use of the Libretour platform by tourism suppliers and travel agents in New Zealand.",
};

const META: LegalDocMeta = {
  title: "Terms of Service",
  effectiveDate: "1 January 2026",
  lastUpdated: "1 January 2026",
  version: "v1.0",
  activeSlug: "terms",
  toc: [
    { id: "s1", label: "1. Definitions" },
    { id: "s2", label: "2. Acceptance" },
    { id: "s3", label: "3. Eligibility & accounts" },
    { id: "s4", label: "4. Supplier obligations" },
    { id: "s5", label: "5. Learner use" },
    { id: "s6", label: "6. AI-generated content" },
    { id: "s7", label: "7. Voice cloning" },
    { id: "s8", label: "8. Fees & subscriptions" },
    { id: "s9", label: "9. Cancellation & refunds" },
    { id: "s10", label: "10. Intellectual property" },
    { id: "s11", label: "11. Acceptable use" },
    { id: "s12", label: "12. Suspension & termination" },
    { id: "s13", label: "13. Disclaimers" },
    { id: "s14", label: "14. Limitation of liability" },
    { id: "s15", label: "15. Indemnity" },
    { id: "s16", label: "16. Consumer protection" },
    { id: "s17", label: "17. Force majeure" },
    { id: "s18", label: "18. Governing law" },
    { id: "s19", label: "19. Disputes" },
    { id: "s20", label: "20. General" },
  ],
};

export default function TermsOfService() {
  return (
    <LegalLayout meta={META}>
      <p>
        These Terms of Service (the <Term>&ldquo;Terms&rdquo;</Term>) constitute a legally
        binding agreement between Libretour Limited (NZBN [TBD-NZBN]), a New Zealand company
        having its registered office at [TBD-registered-address] (<Term>&ldquo;Libretour&rdquo;</Term>,
        <Term> &ldquo;we&rdquo;</Term>, <Term>&ldquo;us&rdquo;</Term>, or
        <Term> &ldquo;our&rdquo;</Term>), and each person or organisation that accesses or uses
        the Libretour services described below (<Term>&ldquo;you&rdquo;</Term> or the
        <Term> &ldquo;User&rdquo;</Term>).
      </p>
      <p>
        Please read these Terms carefully. By creating an account, by accessing the
        Services, or by clicking &ldquo;I agree&rdquo; (or similar acceptance language), you agree
        to be bound by these Terms, by the Acceptable Use Policy, and by the Privacy
        Policy, each as amended from time to time.
      </p>

      <LegalSection id="s1" number="1." title="Definitions">
        <p>In these Terms, unless the context otherwise requires:</p>
        <LegalList
          items={[
            <>
              <Term>&ldquo;Services&rdquo;</Term> means the Libretour website at
              www.libretour.com, the Libretour software-as-a-service platform, any
              application programming interfaces, browser extensions, embedded widgets,
              and all related online and offline services made available by Libretour.
            </>,
            <>
              <Term>&ldquo;Supplier&rdquo;</Term> means a tourism business or holding entity
              (including each of its authorised personnel) that has subscribed to the
              Services for the purpose of authoring and publishing training material
              about its products.
            </>,
            <>
              <Term>&ldquo;Learner&rdquo;</Term> means an individual travel agent or other
              professional user who has registered for an account to enrol in and complete
              Supplier-published training and to interact with the Services.
            </>,
            <>
              <Term>&ldquo;Customer Content&rdquo;</Term> means all content, data, text,
              images, audio, video, documents, and other material that a Supplier or a
              Learner uploads, transmits, generates, or makes available through the
              Services.
            </>,
            <>
              <Term>&ldquo;Libretour Content&rdquo;</Term> means the Services and all
              software, designs, trademarks, methodology, documentation, training
              templates, default voices, and other material owned by or licensed to
              Libretour.
            </>,
            <>
              <Term>&ldquo;Subscription&rdquo;</Term> means a paid plan to access designated
              features of the Services, as ordered through the Services or a separately
              signed order form.
            </>,
            <>
              <Term>&ldquo;Working Day&rdquo;</Term> has the meaning given to it in section 5
              of the Interpretation Act 1999 (New Zealand).
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection id="s2" number="2." title="Acceptance and changes">
        <p>
          By accessing or using the Services you represent that you have read, understood,
          and agreed to these Terms. If you are entering into these Terms on behalf of an
          organisation, you represent and warrant that you have authority to bind that
          organisation, and references to &ldquo;you&rdquo; will include that organisation.
        </p>
        <p>
          We may amend these Terms from time to time. Material changes will be notified to
          account holders by email and posted on the Services at least ten (10) Working
          Days before they take effect. Continued use of the Services after the effective
          date of an amendment constitutes acceptance of the amended Terms.
        </p>
      </LegalSection>

      <LegalSection id="s3" number="3." title="Eligibility, accounts, and security">
        <p>
          The Services are intended for use by Suppliers in the tourism industry and by
          professional travel agents. By creating an account you represent that:
        </p>
        <LegalList
          items={[
            <>you are at least sixteen (16) years of age;</>,
            <>the registration information you provide is accurate, complete, and current;</>,
            <>you are not barred from using the Services under New Zealand law or any
              other applicable jurisdiction; and</>,
            <>if you are accessing the Services as an employee or contractor of a
              Supplier, you have authority to do so.</>,
          ]}
        />
        <p>
          You are responsible for keeping your account credentials confidential and for all
          activity that occurs under your account. You must notify us immediately at
          security@libretour.com on becoming aware of any unauthorised access or other
          security incident.
        </p>
      </LegalSection>

      <LegalSection id="s4" number="4." title="Supplier obligations">
        <p>Each Supplier agrees, in addition to its other obligations under these Terms:</p>
        <LegalList
          items={[
            <>to upload only Customer Content that the Supplier is authorised to share,
              including (where applicable) all necessary licences from rights holders;</>,
            <>not to upload Customer Content that misrepresents the Supplier&apos;s
              products, conditions of sale, refund terms, or safety information, in
              breach of the Fair Trading Act 1986;</>,
            <>to obtain and retain evidence of consent from each individual whose voice,
              likeness, name, or other personal information appears in Customer Content,
              including each Voice Donor referred to in section 7;</>,
            <>to grant Libretour a worldwide, non-exclusive, royalty-free licence to host,
              reproduce, translate, synthesise, transmit, and display Customer Content
              solely to provide the Services to the Supplier and its Learners;</>,
            <>to designate an account administrator who is the Supplier&apos;s primary
              contact for billing, security, and privacy matters; and</>,
            <>to comply with the Acceptable Use Policy.</>,
          ]}
        />
      </LegalSection>

      <LegalSection id="s5" number="5." title="Learner use">
        <p>Each Learner agrees:</p>
        <LegalList
          items={[
            <>to use the Services solely for the Learner&apos;s own professional training
              and certification purposes;</>,
            <>not to share account credentials with any other person, including
              colleagues at the same agency;</>,
            <>not to download, scrape, mirror, or otherwise reproduce Supplier training
              material outside the Services, except as expressly permitted by the relevant
              Supplier;</>,
            <>to provide truthful answers to quizzes and other assessments; and</>,
            <>not to use the AI assistant in any manner described as prohibited in the
              Acceptable Use Policy, including any attempt to extract private content or
              circumvent training gates.</>,
          ]}
        />
      </LegalSection>

      <LegalSection id="s6" number="6." title="AI-generated content">
        <p>
          The Services include features that use large language models, machine
          translation, and text-to-speech synthesis to generate or transform content,
          including AI-generated quiz questions, translations of Customer Content into
          additional languages, AI-generated narration, and answers produced by the
          in-platform AI assistant (collectively, <Term>&ldquo;AI Output&rdquo;</Term>).
        </p>
        <p>You acknowledge and agree that:</p>
        <LegalList
          items={[
            <>AI Output is generated by statistical models and may be inaccurate,
              incomplete, biased, or otherwise unsuitable for your purposes;</>,
            <>before publishing or commercially relying on AI Output, you will review it
              for accuracy, appropriateness, and compliance with applicable laws;</>,
            <>to the maximum extent permitted by law, Libretour disclaims all warranties
              with respect to AI Output, including any warranty of accuracy, fitness for
              purpose, or non-infringement;</>,
            <>where AI Output is derived from Customer Content, the Supplier retains
              ownership of, and responsibility for, the resulting derivative work; and</>,
            <>Libretour may impose reasonable usage quotas, rate limits, or character caps
              on AI-driven features and reserves the right to change those limits with
              notice.</>,
          ]}
        />
      </LegalSection>

      <LegalSection id="s7" number="7." title="Voice cloning and synthetic voices">
        <p>
          Where a Supplier uses the voice-cloning functionality of the Services, the
          Supplier:
        </p>
        <LegalList
          items={[
            <>warrants that it has obtained the prior informed written consent of the
              individual whose voice is being cloned (the <Term>&ldquo;Voice Donor&rdquo;</Term>)
              to record, clone, and commercially use the resulting synthetic voice in
              training material distributed via the Services;</>,
            <>warrants that the Voice Donor is at least eighteen (18) years of age;</>,
            <>will produce evidence of the Voice Donor&apos;s consent to Libretour on
              reasonable request;</>,
            <>will, on revocation of consent by the Voice Donor, cease use of the
              resulting synthetic voice and notify Libretour without undue delay; and</>,
            <>will indemnify Libretour for any third-party claim arising out of unauthorised
              use of any Voice Donor&apos;s voice or likeness through the Services.</>,
          ]}
        />
        <p>
          Libretour reserves the right to remove voice profiles or audio outputs in the
          event of a credible consent dispute and to require a Supplier to substantiate its
          consent record before re-enabling the affected feature.
        </p>
      </LegalSection>

      <LegalSection id="s8" number="8." title="Fees, subscriptions, and taxes">
        <p>
          Fees for paid Subscriptions are set out on the Services or in an order form. All
          fees are exclusive of New Zealand Goods and Services Tax (GST) and any
          equivalent indirect taxes in your jurisdiction, which (where applicable) will be
          added to your invoice.
        </p>
        <p>
          Subscriptions renew automatically at the end of each subscription term unless
          cancelled in accordance with section 9. Free-tier features are provided
          gratuitously and may be modified, limited, or withdrawn at any time.
        </p>
      </LegalSection>

      <LegalSection id="s9" number="9." title="Cancellation and refunds">
        <p>
          You may cancel your Subscription at any time through the billing settings within
          the Services. Cancellation takes effect at the end of the then-current
          subscription term; you are not entitled to a pro-rata refund for any unused
          portion of that term, except as required by the Consumer Guarantees Act 1993 or
          other applicable law.
        </p>
        <p>
          If the Services materially fail to comply with a guarantee under the Consumer
          Guarantees Act 1993 (where that Act applies), you may be entitled to a remedy in
          accordance with that Act, including a refund where the failure is of a
          substantial character.
        </p>
      </LegalSection>

      <LegalSection id="s10" number="10." title="Intellectual property">
        <p>
          As between the parties, the Supplier (or, where appropriate, the Learner) retains
          all right, title, and interest in and to the Customer Content it provides. The
          Supplier grants Libretour the licence described in section 4 for the purpose of
          operating the Services.
        </p>
        <p>
          Libretour retains all right, title, and interest in and to the Libretour Content
          and to all improvements, modifications, and derivative works, other than
          Customer Content. Nothing in these Terms grants you any right or licence in the
          Libretour Content other than the limited right to access and use it as part of
          the Services.
        </p>
        <p>
          If you submit feedback, suggestions, or feature requests to Libretour, you grant
          Libretour a perpetual, worldwide, royalty-free, sublicensable licence to use that
          feedback for any purpose without restriction.
        </p>
      </LegalSection>

      <LegalSection id="s11" number="11." title="Acceptable use">
        <p>
          Your use of the Services is subject to the Acceptable Use Policy, which is
          incorporated into these Terms by reference. Without limiting the generality of
          that policy, you must not, and must not permit any third party to:
        </p>
        <LegalList
          items={[
            <>use the Services in breach of any New Zealand or other applicable law,
              including the Fair Trading Act 1986, the Consumer Guarantees Act 1993, the
              Unsolicited Electronic Messages Act 2007, and the Harmful Digital
              Communications Act 2015;</>,
            <>promote or facilitate gambling, the sale of regulated substances, or any
              activity for which a licence is required and not held;</>,
            <>upload material that infringes the intellectual property rights of any
              third party;</>,
            <>attempt to reverse-engineer, decompile, or extract the source code of the
              Services, except to the extent expressly permitted by law;</>,
            <>access the Services through automated means in a manner that imposes an
              unreasonable load on our infrastructure; or</>,
            <>misuse, attack, or attempt to circumvent any security feature of the
              Services.</>,
          ]}
        />
      </LegalSection>

      <LegalSection id="s12" number="12." title="Suspension and termination">
        <p>
          Libretour may suspend or terminate your access to the Services, in whole or in
          part, with or without notice, where Libretour reasonably believes that:
        </p>
        <LegalList
          items={[
            <>you have breached these Terms, the Acceptable Use Policy, or any applicable
              law;</>,
            <>continued provision of the Services to you would expose Libretour, another
              user, or a third party to material legal or security risk;</>,
            <>required payment for a Subscription is overdue by more than fourteen (14)
              days; or</>,
            <>required by court order or other lawful direction.</>,
          ]}
        />
        <p>
          On termination, the Supplier may within thirty (30) days request export of its
          Customer Content in a commonly used machine-readable format. After that period,
          Libretour may delete Customer Content in accordance with its retention schedule.
        </p>
      </LegalSection>

      <LegalSection id="s13" number="13." title="Disclaimers">
        <p>
          To the maximum extent permitted by law, the Services are provided
          &ldquo;as is&rdquo; and &ldquo;as available&rdquo;, without warranty of any kind,
          whether express, implied, statutory, or otherwise, including warranties of
          merchantability, fitness for a particular purpose, non-infringement, accuracy,
          completeness, or uninterrupted operation.
        </p>
        <p>
          Libretour does not warrant that the Services will be free of errors, that AI
          Output will be accurate, that Customer Content will be preserved against
          accidental loss, or that any defect will be corrected within any particular
          timeframe.
        </p>
      </LegalSection>

      <LegalSection id="s14" number="14." title="Limitation of liability">
        <p>
          To the maximum extent permitted by law, neither party will be liable to the
          other for any indirect, incidental, special, consequential, exemplary, or
          punitive damages, or for any loss of profits, loss of revenue, loss of goodwill,
          loss of business opportunity, or loss or corruption of data, in each case
          arising out of or in connection with these Terms, even if advised of the
          possibility of such damages.
        </p>
        <p>
          Subject to the foregoing, each party&apos;s aggregate liability arising out of
          or in connection with these Terms in any twelve-month period is limited to the
          greater of:
        </p>
        <LegalList
          items={[
            <>the fees paid by the Supplier to Libretour for the Services in the
              twelve (12) months immediately preceding the event giving rise to the claim;
              or</>,
            <>NZD $1,000.</>,
          ]}
        />
        <p>
          Nothing in these Terms excludes or limits liability for fraud, fraudulent
          misrepresentation, death or personal injury caused by negligence, or any other
          liability that cannot lawfully be excluded.
        </p>
      </LegalSection>

      <LegalSection id="s15" number="15." title="Indemnity">
        <p>
          The Supplier will indemnify, defend, and hold harmless Libretour and its
          officers, employees, contractors, and agents from and against any third-party
          claim, loss, damage, liability, cost, or expense (including reasonable legal
          fees) arising out of or relating to:
        </p>
        <LegalList
          items={[
            <>any Customer Content uploaded or transmitted via the Services by the
              Supplier;</>,
            <>any breach by the Supplier of these Terms or of any applicable law; or</>,
            <>any use of voice cloning that is alleged to be unauthorised by the Voice
              Donor.</>,
          ]}
        />
      </LegalSection>

      <LegalSection id="s16" number="16." title="Consumer protection">
        <p>
          Where you are acquiring the Services in trade for the purposes of a business,
          you and Libretour agree to contract out of the provisions of the Consumer
          Guarantees Act 1993 and Part 2 of the Fair Trading Act 1986 to the maximum
          extent permitted by section 43(2) of the Consumer Guarantees Act 1993 and
          section 5D of the Fair Trading Act 1986. Both parties confirm that this
          contracting-out is fair and reasonable in the circumstances and was the subject
          of genuine consideration.
        </p>
        <p>
          Nothing in these Terms excludes or limits any non-excludable consumer guarantee,
          right, or remedy that you may have where you are acquiring the Services other
          than in trade.
        </p>
      </LegalSection>

      <LegalSection id="s17" number="17." title="Force majeure">
        <p>
          Neither party will be liable for any failure or delay in performance (other than
          a payment obligation) caused by circumstances beyond its reasonable control,
          including without limitation acts of God, natural disaster, pandemic, war,
          terrorism, civil disturbance, government action, network or utility failure, or
          failure of a third-party service provider, provided that the affected party
          takes reasonable steps to mitigate the effects.
        </p>
      </LegalSection>

      <LegalSection id="s18" number="18." title="Governing law">
        <p>
          These Terms are governed by, and will be construed in accordance with, the laws
          of New Zealand. The parties submit to the non-exclusive jurisdiction of the
          courts of New Zealand.
        </p>
      </LegalSection>

      <LegalSection id="s19" number="19." title="Disputes">
        <p>
          Before commencing any court proceeding, the parties will attempt in good faith
          to resolve any dispute by direct negotiation, escalating to senior management of
          each party within ten (10) Working Days of written notice of the dispute. If a
          dispute is not resolved within thirty (30) Working Days after escalation, either
          party may commence proceedings or, with the other party&apos;s consent, refer the
          dispute to mediation under the Resolution Institute Mediation Rules.
        </p>
      </LegalSection>

      <LegalSection id="s20" number="20." title="General">
        <p>
          <Term>Assignment</Term>: you may not assign your rights or obligations under
          these Terms without our prior written consent. We may assign these Terms in
          connection with a merger, acquisition, or sale of substantially all our assets,
          on notice to you.
        </p>
        <p>
          <Term>Notices</Term>: notices to Libretour must be sent in writing to
          legal@libretour.com and to our registered office. Notices to you will be sent to
          the email address associated with your account.
        </p>
        <p>
          <Term>Severability</Term>: if any provision of these Terms is held invalid or
          unenforceable, the remaining provisions will continue in full force and effect.
        </p>
        <p>
          <Term>Waiver</Term>: failure to enforce any provision of these Terms will not
          constitute a waiver of that provision.
        </p>
        <p>
          <Term>Entire agreement</Term>: these Terms, together with the Privacy Policy,
          Acceptable Use Policy, Cookies Policy, and any order form, constitute the entire
          agreement between the parties with respect to the Services and supersede any
          prior agreement on that subject.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
