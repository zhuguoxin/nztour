import { LegalLayout, LegalSection, LegalList, Term, type LegalDocMeta } from "../_components/legal-layout";
import { getLocale } from "@/lib/i18n";

export const metadata = {
  title: "Terms of Service — Libretour",
  description:
    "Legal terms governing the use of the Libretour platform by tourism suppliers and travel agents in New Zealand.",
};

export default async function TermsOfService() {
  const locale = await getLocale();
  const zh = locale === "zh-CN";

  const META: LegalDocMeta = {
    title: zh ? "服务条款" : "Terms of Service",
    effectiveDate: "1 January 2026",
    lastUpdated: "1 January 2026",
    version: "v1.0",
    activeSlug: "terms",
    toc: [
      { id: "s1", label: zh ? "1. 定义" : "1. Definitions" },
      { id: "s2", label: zh ? "2. 接受条款" : "2. Acceptance" },
      { id: "s3", label: zh ? "3. 资格与账户" : "3. Eligibility & accounts" },
      { id: "s4", label: zh ? "4. 供应商义务" : "4. Supplier obligations" },
      { id: "s5", label: zh ? "5. 学员使用" : "5. Learner use" },
      { id: "s6", label: zh ? "6. AI 生成内容" : "6. AI-generated content" },
      { id: "s7", label: zh ? "7. 声音克隆" : "7. Voice cloning" },
      { id: "s8", label: zh ? "8. 费用与订阅" : "8. Fees & subscriptions" },
      { id: "s9", label: zh ? "9. 取消与退款" : "9. Cancellation & refunds" },
      { id: "s10", label: zh ? "10. 知识产权" : "10. Intellectual property" },
      { id: "s11", label: zh ? "11. 可接受使用" : "11. Acceptable use" },
      { id: "s12", label: zh ? "12. 暂停与终止" : "12. Suspension & termination" },
      { id: "s13", label: zh ? "13. 免责声明" : "13. Disclaimers" },
      { id: "s14", label: zh ? "14. 责任限制" : "14. Limitation of liability" },
      { id: "s15", label: zh ? "15. 赔偿" : "15. Indemnity" },
      { id: "s16", label: zh ? "16. 消费者保护" : "16. Consumer protection" },
      { id: "s17", label: zh ? "17. 不可抗力" : "17. Force majeure" },
      { id: "s18", label: zh ? "18. 管辖法律" : "18. Governing law" },
      { id: "s19", label: zh ? "19. 争议" : "19. Disputes" },
      { id: "s20", label: zh ? "20. 一般条款" : "20. General" },
    ],
  };

  return (
    <LegalLayout meta={META}>
      <p>
        {zh ? (
          <>
            本服务条款（<Term>&ldquo;条款&rdquo;</Term>）构成 Libretour Limited（新西兰商业编号
            NZBN [TBD-NZBN]，一家注册办事处位于 [TBD-registered-address] 的新西兰公司，
            <Term>&ldquo;Libretour&rdquo;</Term>、<Term>&ldquo;我们&rdquo;</Term>、
            <Term>&ldquo;我方&rdquo;</Term> 或 <Term>&ldquo;我们的&rdquo;</Term>）与每一位访问或使用
            下文所述 Libretour 服务的个人或组织（<Term>&ldquo;您&rdquo;</Term> 或
            <Term> &ldquo;用户&rdquo;</Term>）之间具有法律约束力的协议。
          </>
        ) : (
          <>
            These Terms of Service (the <Term>&ldquo;Terms&rdquo;</Term>) constitute a legally
            binding agreement between Libretour Limited (NZBN [TBD-NZBN]), a New Zealand company
            having its registered office at [TBD-registered-address] (<Term>&ldquo;Libretour&rdquo;</Term>,
            <Term> &ldquo;we&rdquo;</Term>, <Term>&ldquo;us&rdquo;</Term>, or
            <Term> &ldquo;our&rdquo;</Term>), and each person or organisation that accesses or uses
            the Libretour services described below (<Term>&ldquo;you&rdquo;</Term> or the
            <Term> &ldquo;User&rdquo;</Term>).
          </>
        )}
      </p>
      <p>
        {zh ? (
          <>
            请仔细阅读本条款。通过创建账户、访问服务，或点击&ldquo;我同意&rdquo;（或类似的接受用语），
            即表示您同意受本条款、可接受使用政策以及隐私政策的约束，上述各项可能不时予以修订。
          </>
        ) : (
          <>
            Please read these Terms carefully. By creating an account, by accessing the
            Services, or by clicking &ldquo;I agree&rdquo; (or similar acceptance language), you agree
            to be bound by these Terms, by the Acceptable Use Policy, and by the Privacy
            Policy, each as amended from time to time.
          </>
        )}
      </p>

      <LegalSection id="s1" number="1." title={zh ? "定义" : "Definitions"}>
        <p>{zh ? "在本条款中，除上下文另有要求外：" : "In these Terms, unless the context otherwise requires:"}</p>
        <LegalList
          items={
            zh
              ? [
                  <>
                    <Term>&ldquo;服务&rdquo;</Term>（&ldquo;Services&rdquo;）指位于
                    www.libretour.com 的 Libretour 网站、Libretour 软件即服务平台、任何应用程序
                    编程接口、浏览器扩展、嵌入式小部件，以及由 Libretour 提供的所有相关线上和线下服务。
                  </>,
                  <>
                    <Term>&ldquo;供应商&rdquo;</Term>（&ldquo;Supplier&rdquo;）指为编写和发布有关其
                    产品的培训材料之目的而订阅服务的旅游企业或控股实体（包括其每一位获授权人员）。
                  </>,
                  <>
                    <Term>&ldquo;学员&rdquo;</Term>（&ldquo;Learner&rdquo;）指已注册账户以参加并完成
                    供应商发布的培训并与服务互动的个人代理商或其他专业用户。
                  </>,
                  <>
                    <Term>&ldquo;客户内容&rdquo;</Term>（&ldquo;Customer Content&rdquo;）指供应商或
                    学员通过服务上传、传输、生成或提供的所有内容、数据、文本、图像、音频、视频、文件
                    及其他材料。
                  </>,
                  <>
                    <Term>&ldquo;Libretour 内容&rdquo;</Term>（&ldquo;Libretour Content&rdquo;）指
                    服务以及由 Libretour 拥有或授权使用的所有软件、设计、商标、方法论、文档、培训
                    模板、默认声音及其他材料。
                  </>,
                  <>
                    <Term>&ldquo;订阅&rdquo;</Term>（&ldquo;Subscription&rdquo;）指通过服务或单独
                    签署的订单表订购的、用于访问服务指定功能的付费计划。
                  </>,
                  <>
                    <Term>&ldquo;工作日&rdquo;</Term>（&ldquo;Working Day&rdquo;）具有新西兰
                    《1999 年解释法》（Interpretation Act 1999）第 5 条赋予的含义。
                  </>,
                ]
              : [
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
                ]
          }
        />
      </LegalSection>

      <LegalSection id="s2" number="2." title={zh ? "接受与变更" : "Acceptance and changes"}>
        <p>
          {zh ? (
            <>
              通过访问或使用服务，您声明您已阅读、理解并同意本条款。如果您代表某一组织签订本条款，
              您声明并保证您有权约束该组织，且对&ldquo;您&rdquo;的提及将包括该组织。
            </>
          ) : (
            <>
              By accessing or using the Services you represent that you have read, understood,
              and agreed to these Terms. If you are entering into these Terms on behalf of an
              organisation, you represent and warrant that you have authority to bind that
              organisation, and references to &ldquo;you&rdquo; will include that organisation.
            </>
          )}
        </p>
        <p>
          {zh ? (
            <>
              我们可能不时修订本条款。重大变更将在生效前至少十（10）个工作日通过电子邮件通知账户
              持有人并在服务上发布。在修订生效日之后继续使用服务，即构成对修订后条款的接受。
            </>
          ) : (
            <>
              We may amend these Terms from time to time. Material changes will be notified to
              account holders by email and posted on the Services at least ten (10) Working
              Days before they take effect. Continued use of the Services after the effective
              date of an amendment constitutes acceptance of the amended Terms.
            </>
          )}
        </p>
      </LegalSection>

      <LegalSection id="s3" number="3." title={zh ? "资格、账户与安全" : "Eligibility, accounts, and security"}>
        <p>
          {zh ? (
            <>
              服务旨在供旅游业的供应商以及专业代理商使用。通过创建账户，您声明：
            </>
          ) : (
            <>
              The Services are intended for use by Suppliers in the tourism industry and by
              professional travel agents. By creating an account you represent that:
            </>
          )}
        </p>
        <LegalList
          items={
            zh
              ? [
                  <>您年满十六（16）周岁；</>,
                  <>您提供的注册信息准确、完整且最新；</>,
                  <>根据新西兰法律或任何其他适用司法管辖区，您未被禁止使用服务；并且</>,
                  <>如果您作为供应商的雇员或承包商访问服务，您有权这样做。</>,
                ]
              : [
                  <>you are at least sixteen (16) years of age;</>,
                  <>the registration information you provide is accurate, complete, and current;</>,
                  <>you are not barred from using the Services under New Zealand law or any
                    other applicable jurisdiction; and</>,
                  <>if you are accessing the Services as an employee or contractor of a
                    Supplier, you have authority to do so.</>,
                ]
          }
        />
        <p>
          {zh ? (
            <>
              您有责任对您的账户凭据保密，并对您账户下发生的所有活动负责。在知悉任何未经授权的访问
              或其他安全事件时，您必须立即通过 security@libretour.com 通知我们。
            </>
          ) : (
            <>
              You are responsible for keeping your account credentials confidential and for all
              activity that occurs under your account. You must notify us immediately at
              security@libretour.com on becoming aware of any unauthorised access or other
              security incident.
            </>
          )}
        </p>
      </LegalSection>

      <LegalSection id="s4" number="4." title={zh ? "供应商义务" : "Supplier obligations"}>
        <p>{zh ? "除其在本条款项下的其他义务外，每一供应商同意：" : "Each Supplier agrees, in addition to its other obligations under these Terms:"}</p>
        <LegalList
          items={
            zh
              ? [
                  <>仅上传供应商有权分享的客户内容，包括（在适用情况下）来自权利持有人的所有必要许可；</>,
                  <>不上传虚假陈述供应商产品、销售条件、退款条款或安全信息，从而违反《1986 年公平交易法》
                    （Fair Trading Act 1986）的客户内容；</>,
                  <>就客户内容中出现其声音、肖像、姓名或其他个人信息的每一位个人（包括第 7 条所述的每一位
                    声音捐赠者），取得并保留其同意的证据；</>,
                  <>授予 Libretour 一项全球性、非排他性、免版税的许可，以托管、复制、翻译、合成、传输和
                    展示客户内容，仅为向供应商及其学员提供服务之目的；</>,
                  <>指定一名账户管理员，作为供应商在计费、安全和隐私事务方面的主要联系人；并且</>,
                  <>遵守可接受使用政策。</>,
                ]
              : [
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
                ]
          }
        />
      </LegalSection>

      <LegalSection id="s5" number="5." title={zh ? "学员使用" : "Learner use"}>
        <p>{zh ? "每一学员同意：" : "Each Learner agrees:"}</p>
        <LegalList
          items={
            zh
              ? [
                  <>仅将服务用于学员自身的专业培训和认证目的；</>,
                  <>不与任何其他人（包括同一代理机构的同事）共享账户凭据；</>,
                  <>不在服务之外下载、抓取、镜像或以其他方式复制供应商培训材料，除非相关供应商明确许可；</>,
                  <>对测验和其他评估提供真实的答案；并且</>,
                  <>不以可接受使用政策中所述任何被禁止的方式使用 AI 助手，包括任何提取私有内容或规避
                    培训关卡的企图。</>,
                ]
              : [
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
                ]
          }
        />
      </LegalSection>

      <LegalSection id="s6" number="6." title={zh ? "AI 生成内容" : "AI-generated content"}>
        <p>
          {zh ? (
            <>
              服务包含使用大语言模型、机器翻译和文本转语音合成来生成或转换内容的功能，包括 AI 生成的
              测验题目、将客户内容翻译为其他语言、AI 生成的旁白，以及由平台内 AI 助手产生的答案
              （统称为 <Term>&ldquo;AI 输出&rdquo;</Term>，&ldquo;AI Output&rdquo;）。
            </>
          ) : (
            <>
              The Services include features that use large language models, machine
              translation, and text-to-speech synthesis to generate or transform content,
              including AI-generated quiz questions, translations of Customer Content into
              additional languages, AI-generated narration, and answers produced by the
              in-platform AI assistant (collectively, <Term>&ldquo;AI Output&rdquo;</Term>).
            </>
          )}
        </p>
        <p>{zh ? "您确认并同意：" : "You acknowledge and agree that:"}</p>
        <LegalList
          items={
            zh
              ? [
                  <>AI 输出由统计模型生成，可能不准确、不完整、存在偏见或在其他方面不适合您的用途；</>,
                  <>在发布 AI 输出或在商业上依赖 AI 输出之前，您将审查其准确性、适当性以及对适用法律的遵从；</>,
                  <>在法律允许的最大范围内，Libretour 不就 AI 输出作出任何保证，包括任何准确性、适用性
                    或不侵权的保证；</>,
                  <>在 AI 输出源自客户内容的情况下，供应商保留对所产生衍生作品的所有权并对其承担责任；并且</>,
                  <>Libretour 可对 AI 驱动的功能施加合理的使用配额、速率限制或字符上限，并保留经通知后
                    更改该等限制的权利。</>,
                ]
              : [
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
                ]
          }
        />
      </LegalSection>

      <LegalSection id="s7" number="7." title={zh ? "声音克隆与合成声音" : "Voice cloning and synthetic voices"}>
        <p>
          {zh ? (
            <>
              在供应商使用服务的声音克隆功能的情况下，供应商：
            </>
          ) : (
            <>
              Where a Supplier uses the voice-cloning functionality of the Services, the
              Supplier:
            </>
          )}
        </p>
        <LegalList
          items={
            zh
              ? [
                  <>保证其已取得被克隆声音的个人（<Term>&ldquo;声音捐赠者&rdquo;</Term>，
                    &ldquo;Voice Donor&rdquo;）事先知情的书面同意，以录制、克隆并在通过服务分发的培训
                    材料中商业性使用所产生的合成声音；</>,
                  <>保证声音捐赠者年满十八（18）周岁；</>,
                  <>将在合理请求时向 Libretour 出示声音捐赠者同意的证据；</>,
                  <>在声音捐赠者撤回同意时，停止使用所产生的合成声音并毫不迟延地通知 Libretour；并且</>,
                  <>就因通过服务未经授权使用任何声音捐赠者的声音或肖像而引起的任何第三方索赔，对
                    Libretour 作出赔偿。</>,
                ]
              : [
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
                ]
          }
        />
        <p>
          {zh ? (
            <>
              Libretour 保留在出现可信的同意争议时移除声音配置文件或音频输出的权利，并要求供应商在重新
              启用受影响的功能之前证实其同意记录。
            </>
          ) : (
            <>
              Libretour reserves the right to remove voice profiles or audio outputs in the
              event of a credible consent dispute and to require a Supplier to substantiate its
              consent record before re-enabling the affected feature.
            </>
          )}
        </p>
      </LegalSection>

      <LegalSection id="s8" number="8." title={zh ? "费用、订阅与税款" : "Fees, subscriptions, and taxes"}>
        <p>
          {zh ? (
            <>
              付费订阅的费用列明于服务上或订单表中。所有费用均不含新西兰商品及服务税（GST）以及您所在
              司法管辖区的任何同等间接税，该等税款（在适用情况下）将添加到您的发票中。
            </>
          ) : (
            <>
              Fees for paid Subscriptions are set out on the Services or in an order form. All
              fees are exclusive of New Zealand Goods and Services Tax (GST) and any
              equivalent indirect taxes in your jurisdiction, which (where applicable) will be
              added to your invoice.
            </>
          )}
        </p>
        <p>
          {zh ? (
            <>
              除非按照第 9 条取消，否则订阅将在每个订阅期结束时自动续订。免费层级的功能系无偿提供，
              并可随时被修改、限制或撤回。
            </>
          ) : (
            <>
              Subscriptions renew automatically at the end of each subscription term unless
              cancelled in accordance with section 9. Free-tier features are provided
              gratuitously and may be modified, limited, or withdrawn at any time.
            </>
          )}
        </p>
      </LegalSection>

      <LegalSection id="s9" number="9." title={zh ? "取消与退款" : "Cancellation and refunds"}>
        <p>
          {zh ? (
            <>
              您可随时通过服务内的计费设置取消您的订阅。取消在当前订阅期结束时生效；除《1993 年消费者
              保障法》（Consumer Guarantees Act 1993）或其他适用法律要求外，您无权就该订阅期任何未使用
              的部分获得按比例退款。
            </>
          ) : (
            <>
              You may cancel your Subscription at any time through the billing settings within
              the Services. Cancellation takes effect at the end of the then-current
              subscription term; you are not entitled to a pro-rata refund for any unused
              portion of that term, except as required by the Consumer Guarantees Act 1993 or
              other applicable law.
            </>
          )}
        </p>
        <p>
          {zh ? (
            <>
              如果服务在实质上未能遵守《1993 年消费者保障法》（在该法适用的情况下）项下的保障，您可能
              有权根据该法获得救济，包括在该不符合具有实质性质时获得退款。
            </>
          ) : (
            <>
              If the Services materially fail to comply with a guarantee under the Consumer
              Guarantees Act 1993 (where that Act applies), you may be entitled to a remedy in
              accordance with that Act, including a refund where the failure is of a
              substantial character.
            </>
          )}
        </p>
      </LegalSection>

      <LegalSection id="s10" number="10." title={zh ? "知识产权" : "Intellectual property"}>
        <p>
          {zh ? (
            <>
              在双方之间，供应商（或在适当情况下，学员）保留其所提供客户内容的所有权利、所有权和权益。
              供应商为运营服务之目的，向 Libretour 授予第 4 条所述的许可。
            </>
          ) : (
            <>
              As between the parties, the Supplier (or, where appropriate, the Learner) retains
              all right, title, and interest in and to the Customer Content it provides. The
              Supplier grants Libretour the licence described in section 4 for the purpose of
              operating the Services.
            </>
          )}
        </p>
        <p>
          {zh ? (
            <>
              除客户内容外，Libretour 保留对 Libretour 内容以及所有改进、修改和衍生作品的所有权利、
              所有权和权益。本条款中的任何内容均不授予您 Libretour 内容中的任何权利或许可，但作为服务
              一部分访问和使用它的有限权利除外。
            </>
          ) : (
            <>
              Libretour retains all right, title, and interest in and to the Libretour Content
              and to all improvements, modifications, and derivative works, other than
              Customer Content. Nothing in these Terms grants you any right or licence in the
              Libretour Content other than the limited right to access and use it as part of
              the Services.
            </>
          )}
        </p>
        <p>
          {zh ? (
            <>
              如果您向 Libretour 提交反馈、建议或功能请求，您授予 Libretour 一项永久、全球性、免版税、
              可再许可的许可，以将该等反馈用于任何目的而不受限制。
            </>
          ) : (
            <>
              If you submit feedback, suggestions, or feature requests to Libretour, you grant
              Libretour a perpetual, worldwide, royalty-free, sublicensable licence to use that
              feedback for any purpose without restriction.
            </>
          )}
        </p>
      </LegalSection>

      <LegalSection id="s11" number="11." title={zh ? "可接受使用" : "Acceptable use"}>
        <p>
          {zh ? (
            <>
              您对服务的使用受可接受使用政策约束，该政策通过引用并入本条款。在不限制该政策一般性的前提下，
              您不得，且不得允许任何第三方：
            </>
          ) : (
            <>
              Your use of the Services is subject to the Acceptable Use Policy, which is
              incorporated into these Terms by reference. Without limiting the generality of
              that policy, you must not, and must not permit any third party to:
            </>
          )}
        </p>
        <LegalList
          items={
            zh
              ? [
                  <>违反任何新西兰或其他适用法律使用服务，包括《1986 年公平交易法》（Fair Trading
                    Act 1986）、《1993 年消费者保障法》（Consumer Guarantees Act 1993）、《2007 年
                    未经请求电子信息法》（Unsolicited Electronic Messages Act 2007）以及《2015 年
                    有害数字通信法》（Harmful Digital Communications Act 2015）；</>,
                  <>推广或便利赌博、受管制物质的销售，或任何需要许可而未持有许可的活动；</>,
                  <>上传侵犯任何第三方知识产权的材料；</>,
                  <>试图对服务进行逆向工程、反编译或提取其源代码，但法律明确允许的范围除外；</>,
                  <>以对我们的基础设施造成不合理负载的方式通过自动化手段访问服务；或</>,
                  <>滥用、攻击或试图规避服务的任何安全功能。</>,
                ]
              : [
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
                ]
          }
        />
      </LegalSection>

      <LegalSection id="s12" number="12." title={zh ? "暂停与终止" : "Suspension and termination"}>
        <p>
          {zh ? (
            <>
              在 Libretour 合理认为存在下列情形时，Libretour 可在通知或不通知的情况下，全部或部分
              暂停或终止您对服务的访问：
            </>
          ) : (
            <>
              Libretour may suspend or terminate your access to the Services, in whole or in
              part, with or without notice, where Libretour reasonably believes that:
            </>
          )}
        </p>
        <LegalList
          items={
            zh
              ? [
                  <>您违反了本条款、可接受使用政策或任何适用法律；</>,
                  <>继续向您提供服务将使 Libretour、其他用户或第三方面临重大法律或安全风险；</>,
                  <>订阅所需的付款逾期超过十四（14）天；或</>,
                  <>法院命令或其他合法指令所要求。</>,
                ]
              : [
                  <>you have breached these Terms, the Acceptable Use Policy, or any applicable
                    law;</>,
                  <>continued provision of the Services to you would expose Libretour, another
                    user, or a third party to material legal or security risk;</>,
                  <>required payment for a Subscription is overdue by more than fourteen (14)
                    days; or</>,
                  <>required by court order or other lawful direction.</>,
                ]
          }
        />
        <p>
          {zh ? (
            <>
              终止后，供应商可在三十（30）天内请求以常用的机器可读格式导出其客户内容。在该期限之后，
              Libretour 可按照其保留计划删除客户内容。
            </>
          ) : (
            <>
              On termination, the Supplier may within thirty (30) days request export of its
              Customer Content in a commonly used machine-readable format. After that period,
              Libretour may delete Customer Content in accordance with its retention schedule.
            </>
          )}
        </p>
      </LegalSection>

      <LegalSection id="s13" number="13." title={zh ? "免责声明" : "Disclaimers"}>
        <p>
          {zh ? (
            <>
              在法律允许的最大范围内，服务按&ldquo;现状&rdquo;和&ldquo;可用&rdquo;基础提供，不附带任何
              形式的保证，无论是明示、默示、法定或其他，包括对适销性、特定用途适用性、不侵权、准确性、
              完整性或不间断运行的保证。
            </>
          ) : (
            <>
              To the maximum extent permitted by law, the Services are provided
              &ldquo;as is&rdquo; and &ldquo;as available&rdquo;, without warranty of any kind,
              whether express, implied, statutory, or otherwise, including warranties of
              merchantability, fitness for a particular purpose, non-infringement, accuracy,
              completeness, or uninterrupted operation.
            </>
          )}
        </p>
        <p>
          {zh ? (
            <>
              Libretour 不保证服务将无错误、AI 输出将准确、客户内容将免于意外丢失，或任何缺陷将在任何
              特定时限内得到纠正。
            </>
          ) : (
            <>
              Libretour does not warrant that the Services will be free of errors, that AI
              Output will be accurate, that Customer Content will be preserved against
              accidental loss, or that any defect will be corrected within any particular
              timeframe.
            </>
          )}
        </p>
      </LegalSection>

      <LegalSection id="s14" number="14." title={zh ? "责任限制" : "Limitation of liability"}>
        <p>
          {zh ? (
            <>
              在法律允许的最大范围内，任何一方均不对另一方承担任何间接、附带、特殊、后果性、惩戒性或
              惩罚性损害赔偿，或任何利润损失、收入损失、商誉损失、商业机会损失或数据丢失或损坏的责任，
              在每种情况下均由本条款引起或与之相关，即使已被告知该等损害的可能性。
            </>
          ) : (
            <>
              To the maximum extent permitted by law, neither party will be liable to the
              other for any indirect, incidental, special, consequential, exemplary, or
              punitive damages, or for any loss of profits, loss of revenue, loss of goodwill,
              loss of business opportunity, or loss or corruption of data, in each case
              arising out of or in connection with these Terms, even if advised of the
              possibility of such damages.
            </>
          )}
        </p>
        <p>
          {zh ? (
            <>
              在前述规定的前提下，在任何十二个月期间，各方因本条款引起或与之相关的累计责任以下列两者
              中的较高者为限：
            </>
          ) : (
            <>
              Subject to the foregoing, each party&apos;s aggregate liability arising out of
              or in connection with these Terms in any twelve-month period is limited to the
              greater of:
            </>
          )}
        </p>
        <LegalList
          items={
            zh
              ? [
                  <>供应商在引起索赔的事件发生前十二（12）个月内就服务向 Libretour 支付的费用；或</>,
                  <>1,000 新西兰元（NZD $1,000）。</>,
                ]
              : [
                  <>the fees paid by the Supplier to Libretour for the Services in the
                    twelve (12) months immediately preceding the event giving rise to the claim;
                    or</>,
                  <>NZD $1,000.</>,
                ]
          }
        />
        <p>
          {zh ? (
            <>
              本条款中的任何内容均不排除或限制因欺诈、欺诈性失实陈述、因疏忽导致的死亡或人身伤害，或
              任何其他不能合法排除的责任所产生的责任。
            </>
          ) : (
            <>
              Nothing in these Terms excludes or limits liability for fraud, fraudulent
              misrepresentation, death or personal injury caused by negligence, or any other
              liability that cannot lawfully be excluded.
            </>
          )}
        </p>
      </LegalSection>

      <LegalSection id="s15" number="15." title={zh ? "赔偿" : "Indemnity"}>
        <p>
          {zh ? (
            <>
              供应商将就因下列各项引起或与之相关的任何第三方索赔、损失、损害、责任、成本或费用（包括
              合理的法律费用），对 Libretour 及其管理人员、雇员、承包商和代理人作出赔偿、抗辩并使其
              免受损害：
            </>
          ) : (
            <>
              The Supplier will indemnify, defend, and hold harmless Libretour and its
              officers, employees, contractors, and agents from and against any third-party
              claim, loss, damage, liability, cost, or expense (including reasonable legal
              fees) arising out of or relating to:
            </>
          )}
        </p>
        <LegalList
          items={
            zh
              ? [
                  <>供应商通过服务上传或传输的任何客户内容；</>,
                  <>供应商对本条款或任何适用法律的任何违反；或</>,
                  <>任何被指称未经声音捐赠者授权的声音克隆使用。</>,
                ]
              : [
                  <>any Customer Content uploaded or transmitted via the Services by the
                    Supplier;</>,
                  <>any breach by the Supplier of these Terms or of any applicable law; or</>,
                  <>any use of voice cloning that is alleged to be unauthorised by the Voice
                    Donor.</>,
                ]
          }
        />
      </LegalSection>

      <LegalSection id="s16" number="16." title={zh ? "消费者保护" : "Consumer protection"}>
        <p>
          {zh ? (
            <>
              在您为商业目的在交易中获取服务的情况下，您与 Libretour 同意在《1993 年消费者保障法》
              第 43(2) 条和《1986 年公平交易法》第 5D 条所允许的最大范围内，排除适用《1993 年消费者
              保障法》（Consumer Guarantees Act 1993）的条款以及《1986 年公平交易法》（Fair Trading
              Act 1986）第 2 部分。双方确认，此项排除适用在相关情形下是公平合理的，且经过了真正的考量。
            </>
          ) : (
            <>
              Where you are acquiring the Services in trade for the purposes of a business,
              you and Libretour agree to contract out of the provisions of the Consumer
              Guarantees Act 1993 and Part 2 of the Fair Trading Act 1986 to the maximum
              extent permitted by section 43(2) of the Consumer Guarantees Act 1993 and
              section 5D of the Fair Trading Act 1986. Both parties confirm that this
              contracting-out is fair and reasonable in the circumstances and was the subject
              of genuine consideration.
            </>
          )}
        </p>
        <p>
          {zh ? (
            <>
              在您并非于交易中获取服务的情况下，本条款中的任何内容均不排除或限制您可能享有的任何不可
              排除的消费者保障、权利或救济。
            </>
          ) : (
            <>
              Nothing in these Terms excludes or limits any non-excludable consumer guarantee,
              right, or remedy that you may have where you are acquiring the Services other
              than in trade.
            </>
          )}
        </p>
      </LegalSection>

      <LegalSection id="s17" number="17." title={zh ? "不可抗力" : "Force majeure"}>
        <p>
          {zh ? (
            <>
              任何一方均不对因其合理控制之外的情形所导致的任何履约失败或延迟（付款义务除外）承担责任，
              包括但不限于天灾、自然灾害、流行病、战争、恐怖主义、内乱、政府行为、网络或公用事业故障，
              或第三方服务提供商的故障，前提是受影响的一方采取合理措施减轻其影响。
            </>
          ) : (
            <>
              Neither party will be liable for any failure or delay in performance (other than
              a payment obligation) caused by circumstances beyond its reasonable control,
              including without limitation acts of God, natural disaster, pandemic, war,
              terrorism, civil disturbance, government action, network or utility failure, or
              failure of a third-party service provider, provided that the affected party
              takes reasonable steps to mitigate the effects.
            </>
          )}
        </p>
      </LegalSection>

      <LegalSection id="s18" number="18." title={zh ? "管辖法律" : "Governing law"}>
        <p>
          {zh ? (
            <>
              本条款受新西兰法律管辖并依其解释。双方服从新西兰法院的非排他性管辖。
            </>
          ) : (
            <>
              These Terms are governed by, and will be construed in accordance with, the laws
              of New Zealand. The parties submit to the non-exclusive jurisdiction of the
              courts of New Zealand.
            </>
          )}
        </p>
      </LegalSection>

      <LegalSection id="s19" number="19." title={zh ? "争议" : "Disputes"}>
        <p>
          {zh ? (
            <>
              在提起任何法院诉讼之前，双方将本着诚信通过直接协商努力解决任何争议，并在争议书面通知发出后
              十（10）个工作日内升级至各方的高级管理层。如果争议在升级后三十（30）个工作日内未能解决，
              任何一方均可提起诉讼，或在征得另一方同意的情况下，将争议提交至按照解决学会调解规则
              （Resolution Institute Mediation Rules）进行的调解。
            </>
          ) : (
            <>
              Before commencing any court proceeding, the parties will attempt in good faith
              to resolve any dispute by direct negotiation, escalating to senior management of
              each party within ten (10) Working Days of written notice of the dispute. If a
              dispute is not resolved within thirty (30) Working Days after escalation, either
              party may commence proceedings or, with the other party&apos;s consent, refer the
              dispute to mediation under the Resolution Institute Mediation Rules.
            </>
          )}
        </p>
      </LegalSection>

      <LegalSection id="s20" number="20." title={zh ? "一般条款" : "General"}>
        <p>
          {zh ? (
            <>
              <Term>转让</Term>（Assignment）：未经我们事先书面同意，您不得转让您在本条款项下的权利或
              义务。我们可在合并、收购或出售我们几乎全部资产时转让本条款，并通知您。
            </>
          ) : (
            <>
              <Term>Assignment</Term>: you may not assign your rights or obligations under
              these Terms without our prior written consent. We may assign these Terms in
              connection with a merger, acquisition, or sale of substantially all our assets,
              on notice to you.
            </>
          )}
        </p>
        <p>
          {zh ? (
            <>
              <Term>通知</Term>（Notices）：向 Libretour 发出的通知必须以书面形式发送至
              legal@libretour.com 以及我们的注册办事处。向您发出的通知将发送至与您账户关联的电子邮件地址。
            </>
          ) : (
            <>
              <Term>Notices</Term>: notices to Libretour must be sent in writing to
              legal@libretour.com and to our registered office. Notices to you will be sent to
              the email address associated with your account.
            </>
          )}
        </p>
        <p>
          {zh ? (
            <>
              <Term>可分割性</Term>（Severability）：如果本条款的任何条款被认定为无效或不可执行，其余
              条款将继续完全有效。
            </>
          ) : (
            <>
              <Term>Severability</Term>: if any provision of these Terms is held invalid or
              unenforceable, the remaining provisions will continue in full force and effect.
            </>
          )}
        </p>
        <p>
          {zh ? (
            <>
              <Term>弃权</Term>（Waiver）：未能执行本条款的任何条款并不构成对该条款的弃权。
            </>
          ) : (
            <>
              <Term>Waiver</Term>: failure to enforce any provision of these Terms will not
              constitute a waiver of that provision.
            </>
          )}
        </p>
        <p>
          {zh ? (
            <>
              <Term>完整协议</Term>（Entire agreement）：本条款连同隐私政策、可接受使用政策、Cookies
              政策以及任何订单表，构成双方就服务达成的完整协议，并取代此前就该主题达成的任何协议。
            </>
          ) : (
            <>
              <Term>Entire agreement</Term>: these Terms, together with the Privacy Policy,
              Acceptable Use Policy, Cookies Policy, and any order form, constitute the entire
              agreement between the parties with respect to the Services and supersede any
              prior agreement on that subject.
            </>
          )}
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
