import { LegalLayout, LegalSection, LegalList, Term, type LegalDocMeta } from "../_components/legal-layout";
import { getLocale } from "@/lib/i18n";

export const metadata = {
  title: "Privacy Policy — Libretour",
  description:
    "How Libretour collects, uses, stores, and discloses personal information under the New Zealand Privacy Act 2020.",
};

export default async function PrivacyPolicy() {
  const locale = await getLocale();
  const zh = locale === "zh-CN";

  const META: LegalDocMeta = {
    title: zh ? "隐私政策" : "Privacy Policy",
    effectiveDate: "1 January 2026",
    lastUpdated: "1 January 2026",
    version: "v1.0",
    activeSlug: "privacy",
    toc: [
      { id: "s1", label: zh ? "1. 我们是谁" : "1. Who we are" },
      { id: "s2", label: zh ? "2. 适用范围" : "2. Scope" },
      { id: "s3", label: zh ? "3. 我们收集的个人信息" : "3. Personal information we collect" },
      { id: "s4", label: zh ? "4. 收集目的" : "4. Purposes of collection" },
      { id: "s5", label: zh ? "5. 我们如何使用信息" : "5. How we use information" },
      { id: "s6", label: zh ? "6. 信息披露" : "6. Disclosure" },
      { id: "s7", label: zh ? "7. 境外存储与传输" : "7. Overseas storage and transfer" },
      { id: "s8", label: zh ? "8. AI 处理" : "8. AI processing" },
      { id: "s9", label: zh ? "9. 语音克隆" : "9. Voice cloning" },
      { id: "s10", label: zh ? "10. 数据留存" : "10. Retention" },
      { id: "s11", label: zh ? "11. 安全保障" : "11. Security" },
      { id: "s12", label: zh ? "12. 您的权利" : "12. Your rights" },
      { id: "s13", label: zh ? "13. Cookie" : "13. Cookies" },
      { id: "s14", label: zh ? "14. 未成年人" : "14. Children" },
      { id: "s15", label: zh ? "15. 投诉" : "15. Complaints" },
      { id: "s16", label: zh ? "16. 联系我们" : "16. Contact" },
      { id: "s17", label: zh ? "17. 政策变更" : "17. Changes" },
    ],
  };

  return (
    <LegalLayout meta={META}>
      <p>
        {zh ? (
          <>
            本隐私政策(本<Term>“政策”</Term>)说明 Libretour Limited(NZBN [TBD-NZBN],一家
            注册办事处位于 [TBD-registered-address] 的新西兰公司)(<Term>“Libretour”</Term>、
            <Term>“我们”</Term>或<Term>“我方”</Term>)在您访问或使用 Libretour 网站、服务、
            应用程序及相关平台(合称<Term>“服务”</Term>)时,如何收集、使用、存储及披露个人数据。
          </>
        ) : (
          <>
            This Privacy Policy (this <Term>&ldquo;Policy&rdquo;</Term>) explains how Libretour
            Limited (NZBN [TBD-NZBN]), a New Zealand company having its registered office at
            [TBD-registered-address] (<Term>&ldquo;Libretour&rdquo;</Term>, <Term>&ldquo;we&rdquo;</Term>,
            <Term> &ldquo;us&rdquo;</Term>, or <Term>&ldquo;our&rdquo;</Term>), collects, uses, stores,
            and discloses personal information when you access or use the Libretour website,
            services, applications, and related platforms (collectively, the
            <Term> &ldquo;Services&rdquo;</Term>).
          </>
        )}
      </p>
      <p>
        {zh ? (
          <>
            就 2020 年《隐私法》(<Term>“隐私法”</Term>)而言,Libretour 是数据控制者(在新西兰
            称为<Term>“机构”</Term>),并致力于遵守《隐私法》第 22 条所列的十三项信息隐私原则
            (各称一项<Term>“IPP”</Term>)。
          </>
        ) : (
          <>
            Libretour is a data controller (referred to in New Zealand as an
            <Term> &ldquo;agency&rdquo;</Term>) for the purposes of the Privacy Act 2020 (the
            <Term> &ldquo;Privacy Act&rdquo;</Term>) and is committed to compliance with the
            thirteen Information Privacy Principles (each, an <Term>&ldquo;IPP&rdquo;</Term>) set out
            in section 22 of the Privacy Act.
          </>
        )}
      </p>

      <LegalSection id="s1" number="1." title={zh ? "我们是谁" : "Who we are"}>
        <p>
          {zh ? (
            <>
              Libretour 为新西兰旅游业运营一个企业对企业(B2B)的培训与认证平台。旅游供应商在平台上
              发布关于其产品的培训资料;旅行社(<Term>“学员”</Term>)注册、完成培训并获得可验证的
              数字徽章。平台还提供一款 AI 助手,基于供应商提供的内容回答问题。
            </>
          ) : (
            <>
              Libretour operates a business-to-business training and certification platform for
              the New Zealand tourism industry. Tourism suppliers publish training material
              about their products on the platform; travel agents (<Term>&ldquo;Learners&rdquo;</Term>)
              register, complete the training, and receive verifiable digital badges. The
              platform also makes available an AI assistant that answers questions grounded in
              supplier-provided content.
            </>
          )}
        </p>
      </LegalSection>

      <LegalSection id="s2" number="2." title={zh ? "本政策的适用范围" : "Scope of this Policy"}>
        <p>
          {zh
            ? "本政策适用于 Libretour 与服务相关而收集的个人数据。本政策不适用于以下方收集的信息:"
            : "This Policy applies to personal information collected by Libretour in connection with the Services. It does not apply to information collected by:"}
        </p>
        <LegalList
          items={
            zh
              ? [
                  <>服务所链接的、由第三方自行运营的网站或服务;</>,
                  <>旅游供应商作为其自身学员记录的独立数据控制者(各供应商维护其自身的隐私惯例);</>,
                  <>Libretour 与雇佣相关的个人数据,该等信息受单独的员工告知约束。</>,
                ]
              : [
                  <>third parties operating their own websites or services to which the Services link;</>,
                  <>tourism suppliers in their capacity as independent data controllers of their
                    own learner records (each supplier maintains its own privacy practices);</>,
                  <>Libretour&apos;s employment-related personal information, which is governed by
                    separate workforce notices.</>,
                ]
          }
        />
      </LegalSection>

      <LegalSection
        id="s3"
        number="3."
        title={zh ? "我们收集的个人信息(IPP 1–4)" : "Personal information we collect (IPPs 1–4)"}
      >
        <p>
          {zh
            ? "依据 IPP 1 至 4,Libretour 仅收集为实现本政策第 4 节所述目的所必需且与之直接相关的个人数据。我们收集以下类别的个人数据:"
            : "Consistent with IPPs 1 to 4, Libretour collects only the personal information necessary for, and directly related to, the purposes described in section 4 of this Policy. We collect the following categories of personal information:"}
        </p>
        <LegalList
          items={
            zh
              ? [
                  <>
                    <Term>账户信息</Term>:全名、工作电子邮箱、雇主或旅行社名称、国家/地区,以及
                    (可选的)偏好显示语言。账户创建由我们的身份验证服务商(Clerk, Inc.)居间办理。
                  </>,
                  <>
                    <Term>身份验证标识符</Term>:由 Clerk 签发的唯一用户标识符,以及您选择与账户
                    关联的任何单点登录(SSO)标识符。
                  </>,
                  <>
                    <Term>学习行为数据</Term>:您报名的课程、完成的模块、测验作答、各章节停留时长、
                    语言偏好以及所授予的数字徽章。
                  </>,
                  <>
                    <Term>AI 助手交互</Term>:您向平台内 AI 助手提交的自然语言问题、所生成的回复、
                    引用元数据,以及(针对已登录用户的)按问题记录的延迟与来源类型审计日志。
                  </>,
                  <>
                    <Term>自愿反馈</Term>:您选择就供应商培训向其提供的星级评分及自由文本反馈。
                  </>,
                  <>
                    <Term>语音样本</Term>:仅在供应商明确上传音频录音用于语音克隆的情形下,相应的
                    底层音频文件及任何衍生的语音模型标识符。参见第 9 节。
                  </>,
                  <>
                    <Term>技术信息</Term>:IP 地址、用户代理(user-agent)字符串、大致地理位置
                    (国家/地区)、来源 URL 及访问时间戳,在您访问服务时自动收集。
                  </>,
                  <>
                    <Term>Cookie 及类似技术</Term>:如本政策第 13 节及我们的 Cookie 政策所述。
                  </>,
                ]
              : [
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
                ]
          }
        />
        <p>
          {zh ? (
            <>
              除非您自愿提供,我们不会有意收集政府签发的标识符、金融账户明细(您的支付服务商为
              订阅计费而合法提供的除外),或《隐私法》项下被归类为<em>敏感信息</em>的信息。
            </>
          ) : (
            <>
              We do not knowingly collect government-issued identifiers, financial-account
              details (other than where lawfully provided by your payment provider for
              subscription billing), or information classified as <em>sensitive information</em>
              {" "}under the Privacy Act unless you voluntarily provide it.
            </>
          )}
        </p>
      </LegalSection>

      <LegalSection id="s4" number="4." title={zh ? "收集目的(IPP 1)" : "Purposes of collection (IPP 1)"}>
        <p>
          {zh
            ? "我们为与 Libretour 的职能或活动相关的以下合法目的收集个人数据:"
            : "We collect personal information for the following lawful purposes connected with a function or activity of Libretour:"}
        </p>
        <LegalList
          items={
            zh
              ? [
                  <>创建、保护并运营您的用户账户;</>,
                  <>提供、个性化及改进服务,包括学员进度跟踪、徽章签发及 AI 助手;</>,
                  <>向您所报名培训的旅游供应商提供汇总层级及个体层级的分析数据;</>,
                  <>就服务与您沟通,包括交易类通知、安全警报及本政策的更新;</>,
                  <>回应您的咨询、支持请求及《隐私法》项下的任何权利请求;</>,
                  <>侦测、预防并应对欺诈、滥用、安全事件,以及对我们《服务条款》或《可接受使用政策》的违反;</>,
                  <>遵守我们在新西兰法律项下的法律及监管义务;以及</>,
                  <>在您另行作出知情同意的情形下,使用语音样本创建用于培训内容旁白的合成语音模型。</>,
                ]
              : [
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
                ]
          }
        />
      </LegalSection>

      <LegalSection id="s5" number="5." title={zh ? "我们如何使用个人数据" : "How we use personal information"}>
        <p>
          {zh
            ? "我们将上述个人数据用于第 4 节所列目的。我们不出售个人数据。未先按 IPP 10 的要求取得您的授权,我们不会将个人数据用于行为定向广告或不相关的次要目的。"
            : "We use the personal information described above for the purposes set out in section 4. We do not sell personal information. We do not use personal information for behavioural advertising or for unrelated secondary purposes without first obtaining your authorisation as required by IPP 10."}
        </p>
        <p>
          {zh
            ? "在我们使用 AI 系统处理您的数据时,我们依照第 8 节所述的安排进行处理。"
            : "Where we use AI systems to process your data, we do so under arrangements described in section 8."}
        </p>
      </LegalSection>

      <LegalSection
        id="s6"
        number="6."
        title={zh ? "向第三方披露(IPP 10 与 11)" : "Disclosure to third parties (IPPs 10 & 11)"}
      >
        <p>
          {zh
            ? "我们仅在 IPP 11 所列一项或多项理由适用时披露个人数据。接收方的类别为:"
            : "We disclose personal information only where one or more of the grounds in IPP 11 applies. The categories of recipient are:"}
        </p>
        <LegalList
          items={
            zh
              ? [
                  <>
                    <Term>旅游供应商</Term>:各供应商可访问报名其培训的学员的姓名、电子邮箱、所属
                    旅行社、课程进度、徽章、评分及 AI 提问日志。供应商在《隐私法》项下为独立机构,
                    并对其自身的后续处理负责。
                  </>,
                  <>
                    <Term>服务提供商</Term>:云基础设施(Cloudflare, Inc.)、身份验证(Clerk, Inc.)、
                    大语言模型服务商(Anthropic, PBC,以及在适用情形下的 OpenAI, OpCo, LLC)、语音
                    合成服务商(ElevenLabs, Inc. 及第 9 节所述的其他服务商),以及电子邮件投递
                    (Resend, Inc.),各方均在书面保密及安全义务下行事。
                  </>,
                  <>
                    <Term>搜索及引用服务商</Term>:在 AI 助手无法依据供应商提供的内容作答时,助手
                    可能将问题文本转发至网络搜索服务商(Tavily AI, Inc.)以检索公开来源。账户身份
                    识别信息不会被传输。
                  </>,
                  <>
                    <Term>专业顾问</Term>:在确有必要时,我们的律师、会计师、保险人及审计师。
                  </>,
                  <>
                    <Term>收购方</Term>:就任何实际或拟议的合并、收购、融资或重组而言,并受接收方
                    所负保密义务的约束。
                  </>,
                  <>
                    <Term>监管机构及主管当局</Term>:在新西兰法律要求或授权披露的情形下,包括但不限于
                    隐私专员公署、新西兰警方或有管辖权法院的请求。
                  </>,
                ]
              : [
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
                ]
          }
        />
      </LegalSection>

      <LegalSection
        id="s7"
        number="7."
        title={zh ? "境外存储与跨境传输(IPP 12)" : "Overseas storage and cross-border transfer (IPP 12)"}
      >
        <p>
          {zh
            ? "服务使用 Cloudflare 的全球边缘网络运营。个人数据可能在新西兰境外的 Cloudflare 数据中心存储、处理或路由,包括在澳大利亚、美国、欧盟及英国。第 8 节项下的 AI 处理主要在 Anthropic, PBC 运营的、位于美国的基础设施上进行。"
            : "The Services are operated using Cloudflare's global edge network. Personal information may be stored, processed, or routed through Cloudflare data centres located outside New Zealand, including in Australia, the United States, the European Union, and the United Kingdom. AI processing under section 8 takes place on infrastructure operated by Anthropic, PBC, principally in the United States."}
        </p>
        <p>
          {zh
            ? "依据 IPP 12,我们仅在下列情形下向境外个人或实体披露个人数据:"
            : "In accordance with IPP 12, we disclose personal information to a foreign person or entity only where:"}
        </p>
        <LegalList
          items={
            zh
              ? [
                  <>该境外个人受可比的隐私保障约束(无论是依其所在司法管辖区的法律,还是依具有约束力的合同承诺);或</>,
                  <>您已被明确告知并已授权该等披露。</>,
                ]
              : [
                  <>the foreign person is subject to comparable privacy safeguards (whether
                    under the law of their home jurisdiction or under binding contractual
                    undertakings); or</>,
                  <>you have been expressly informed and have authorised the disclosure.</>,
                ]
          }
        />
        <p>
          {zh
            ? "使用服务即表示您确认上述境外处理对服务的正常运行是必要的,并授权该等处理。"
            : "By using the Services, you acknowledge that overseas processing as described above is necessary for the Services to function and you authorise such processing."}
        </p>
      </LegalSection>

      <LegalSection id="s8" number="8." title={zh ? "AI 处理" : "AI processing"}>
        <p>
          {zh
            ? "服务包含一款由第三方大语言模型服务商提供支持的 AI 助手。当您向助手提交问题时,以下数据将被传输至模型服务商,且仅用于生成回复:"
            : "The Services include an AI assistant powered by third-party large-language-model providers. When you submit a question to the assistant, the following data is transmitted to the model provider for the sole purpose of generating a response:"}
        </p>
        <LegalList
          items={
            zh
              ? [
                  <>问题文本;</>,
                  <>与您的问题相关的、由产品方发布的培训内容及补充材料;</>,
                  <>至多为您在当前页面与助手对话的简短上下文窗口;以及</>,
                  <>不含任何直接的账户标识符(您的用户标识符不会被传输)。</>,
                ]
              : [
                  <>the question text;</>,
                  <>the operator-published training content and supplementary materials relevant
                    to your question;</>,
                  <>at most, a short context window of your conversation with the assistant on
                    the current page; and</>,
                  <>no direct account identifier (your user identifier is not transmitted).</>,
                ]
          }
        />
        <p>
          {zh
            ? "我们要求模型服务商在禁止将客户数据用于训练通用基础模型的企业条款下处理该等数据。翻译功能及 AI 生成的测验编写遵守同一禁止规定。我们不对 AI 生成回复的任何特定准确性、完整性或对任何用途的适用性作出保证;凡用于商业目的所依赖的任何信息,您均须自行独立核实。"
            : "We require model providers to process this data under enterprise terms that prohibit use of customer data for the training of generalised foundation models. Translation features and AI-generated quiz authoring follow the same prohibition. We do not warrant any particular accuracy, completeness, or fitness for any purpose of AI-generated responses; you must independently verify any information relied upon for commercial purposes."}
        </p>
      </LegalSection>

      <LegalSection id="s9" number="9." title={zh ? "语音克隆与合成语音" : "Voice cloning and synthetic voices"}>
        <p>
          {zh ? (
            <>
              服务可选地允许旅游供应商根据所上传的人类说话者音频样本(<Term>“语音提供者”</Term>)
              创建合成语音模型。语音模型由第三方服务商(目前为 ElevenLabs, Inc.)生成,音频样本将
              被留存,用于重新生成或更新该模型。
            </>
          ) : (
            <>
              The Services optionally permit tourism suppliers to create a synthetic voice
              model from an uploaded audio sample of a human speaker (the
              <Term> &ldquo;Voice Donor&rdquo;</Term>). Voice models are generated by a
              third-party provider (currently ElevenLabs, Inc.) and the audio sample is
              retained for the purpose of regenerating or updating the model.
            </>
          )}
        </p>
        <p>
          {zh ? "供应商仅在下列情形下方可上传语音样本:" : "A supplier may upload a voice sample only where:"}
        </p>
        <LegalList
          items={
            zh
              ? [
                  <>语音提供者已就该录音、克隆,以及将所产生的合成语音后续商业性地用于经服务分发的供应商培训材料,作出知情的书面同意;</>,
                  <>供应商留存该同意的证据,并将应 Libretour 的要求出示;以及</>,
                  <>语音提供者年满 18 周岁。</>,
                ]
              : [
                  <>the Voice Donor has provided informed, written consent to the recording, the
                    cloning, and the subsequent commercial use of the resulting synthetic voice
                    in supplier training materials distributed via the Services;</>,
                  <>the supplier retains evidence of that consent and will produce it to
                    Libretour on request; and</>,
                  <>the Voice Donor is at least 18 years of age.</>,
                ]
          }
        />
        <p>
          {zh
            ? "应语音提供者或供应商的请求,Libretour 将删除音频样本、指示合成语音服务商删除底层语音模型,并在已发布的培训材料中移除或替换由该模型生成的音频,上述各项均在收到请求后三十(30)日内完成。"
            : "On request by the Voice Donor or by the supplier, Libretour will delete the audio sample, instruct the synthetic-voice provider to delete the underlying voice model, and remove or replace audio generated from that model in published training material, in each case within thirty (30) days of the request."}
        </p>
      </LegalSection>

      <LegalSection id="s10" number="10." title={zh ? "个人数据的留存" : "Retention of personal information"}>
        <p>
          {zh
            ? "除非法律要求或允许更长的留存期间,我们仅在为实现第 4 节所述目的合理必要的期间内留存个人数据。标准留存期间为:"
            : "We retain personal information only for as long as is reasonably necessary for the purposes described in section 4, unless a longer retention period is required or permitted by law. Standard retention periods are:"}
        </p>
        <LegalList
          items={
            zh
              ? [
                  <>账户记录:在账户存续期间,外加删除后十二(12)个月,以处理删除撤销及安全调查;</>,
                  <>学习行为数据、测验作答及徽章记录:在账户存续期间留存,其后以匿名化形式留存用于供应商分析;</>,
                  <>AI 助手日志:自对话之日起二十四(24)个月;</>,
                  <>课程反馈(评分及自由文本):在课程存续期间;</>,
                  <>语音样本及语音模型:直至撤回同意(参见第 9 节)或供应商订阅终止;</>,
                  <>技术访问日志:九十(90)日,此后予以汇总。</>,
                ]
              : [
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
                ]
          }
        />
      </LegalSection>

      <LegalSection id="s11" number="11." title={zh ? "安全保障措施(IPP 5)" : "Security safeguards (IPP 5)"}>
        <p>
          {zh
            ? "Libretour 采取 IPP 5 所要求的合理安全保障措施,以保护个人数据免遭丢失、未经授权的访问、使用、修改或披露。该等保障措施包括传输中加密(TLS 1.2 或更高版本)、静态加密、平台内基于角色的访问控制、定期访问审查,以及对我们各服务提供商所施加的合同安全义务。然而,任何电子传输或存储方法均非绝对安全,Libretour 无法保证绝对的安全性。"
            : "Libretour takes the reasonable security safeguards required by IPP 5 to protect personal information against loss, unauthorised access, use, modification, or disclosure. These safeguards include encryption in transit (TLS 1.2 or higher), encryption at rest, role-based access controls within the platform, periodic access reviews, and contractual security obligations on each of our service providers. No method of electronic transmission or storage is, however, completely secure, and Libretour cannot guarantee absolute security."}
        </p>
        <p>
          {zh
            ? "Libretour 维护应申报隐私泄露的响应流程,并将在发生应申报隐私泄露事件时,按《隐私法》第 114 至 117 条的要求,通知隐私专员公署及受影响的个人。"
            : "Libretour maintains a notifiable-privacy-breach response process and will notify the Office of the Privacy Commissioner and affected individuals as required by sections 114 to 117 of the Privacy Act in the event of a notifiable privacy breach."}
        </p>
      </LegalSection>

      <LegalSection id="s12" number="12." title={zh ? "您的权利(IPP 6 与 7)" : "Your rights (IPPs 6 & 7)"}>
        <p>
          {zh
            ? "依据《隐私法》IPP 6 与 7,您有权免费:"
            : "Under IPPs 6 and 7 of the Privacy Act you are entitled, at no charge, to:"}
        </p>
        <LegalList
          items={
            zh
              ? [
                  <>请求确认我们是否持有关于您的个人数据;</>,
                  <>请求访问该等信息;</>,
                  <>请求更正不准确、不完整或具有误导性的信息;以及</>,
                  <>就所请求但未作出的更正附加一份声明。</>,
                ]
              : [
                  <>request confirmation that we hold personal information about you;</>,
                  <>request access to that information;</>,
                  <>request correction of information that is inaccurate, incomplete, or
                    misleading; and</>,
                  <>attach a statement of correction sought but not made.</>,
                ]
          }
        />
        <p>
          {zh
            ? "我们将依据《隐私法》第 41 条,在二十(20)个工作日内回应经核实的权利请求。如需行使这些权利,请通过第 16 节中的联系方式与我们联系。在处理请求前,我们可能要求提供身份证明。"
            : "We will respond to a verified rights request within twenty (20) working days, in accordance with section 41 of the Privacy Act. To exercise these rights, contact us using the details in section 16. We may require proof of identity before actioning a request."}
        </p>
        <p>
          {zh
            ? "您也可随时在服务内删除您的账户。账户删除将触发第 10 节所述的留存流程。部分衍生、汇总或匿名化的数据在其不再属于个人数据时可能继续被留存。"
            : "You may also at any time delete your account from within the Services. Account deletion triggers the retention process described in section 10. Some derived, aggregated, or anonymised data may continue to be retained where it is no longer personal information."}
        </p>
      </LegalSection>

      <LegalSection id="s13" number="13." title={zh ? "Cookie 及类似技术" : "Cookies and similar technologies"}>
        <p>
          {zh
            ? "Libretour 使用少量严格必要的 Cookie(用于身份验证及语言偏好),以及有限的第一方分析 Cookie。包括各 Cookie 名称及用途在内的详情,载于我们的 Cookie 政策。在适用法律要求对非必要 Cookie 取得知情同意的情形下,我们将在设置该等 Cookie 之前取得该同意。"
            : "Libretour uses a small number of strictly necessary cookies (for authentication and language preference), together with limited first-party analytics cookies. Details, including the name and purpose of each cookie, are set out in our Cookies Policy. Where applicable law requires informed consent for non-essential cookies, we obtain that consent before setting them."}
        </p>
      </LegalSection>

      <LegalSection id="s14" number="14." title={zh ? "未成年人" : "Children"}>
        <p>
          {zh
            ? "服务面向专业旅行社及旅游供应商使用,并非面向未成年人。我们不会有意收集任何未满十六(16)周岁个人的个人数据。如我们获悉无意中收集了未满该年龄儿童的个人数据,我们将尽快删除。"
            : "The Services are intended for use by professional travel agents and tourism suppliers and are not directed to children. We do not knowingly collect personal information from any individual under the age of sixteen (16). If we become aware that we have inadvertently collected personal information from a child under that age, we will delete it as soon as practicable."}
        </p>
      </LegalSection>

      <LegalSection id="s15" number="15." title={zh ? "投诉" : "Complaints"}>
        <p>
          {zh
            ? "如您认为我们未能遵守《隐私法》或本政策,请先通过第 16 节中的联系方式与我们联系。我们认真对待隐私投诉,并将迅速调查。"
            : "If you believe that we have failed to comply with the Privacy Act or this Policy, please contact us first using the details in section 16. We take privacy complaints seriously and will investigate promptly."}
        </p>
        <p>
          {zh
            ? "您也有权直接向新西兰隐私专员公署提出投诉:"
            : "You also have the right to make a complaint directly to the Office of the Privacy Commissioner of New Zealand:"}
        </p>
        <LegalList
          items={
            zh
              ? [
                  <>在线:<a className="text-slate-900 hover:underline" href="https://www.privacy.org.nz/your-rights/making-a-complaint/" target="_blank" rel="noreferrer">privacy.org.nz</a>;</>,
                  <>电话:0800 803 909;</>,
                  <>邮寄:PO Box 10094, The Terrace, Wellington 6143。</>,
                ]
              : [
                  <>online: <a className="text-slate-900 hover:underline" href="https://www.privacy.org.nz/your-rights/making-a-complaint/" target="_blank" rel="noreferrer">privacy.org.nz</a>;</>,
                  <>by telephone: 0800 803 909;</>,
                  <>by post: PO Box 10094, The Terrace, Wellington 6143.</>,
                ]
          }
        />
      </LegalSection>

      <LegalSection id="s16" number="16." title={zh ? "联系我们" : "Contact us"}>
        <p>
          {zh
            ? "隐私相关的问题、请求及投诉,应发送至我们的隐私官:"
            : "Privacy questions, requests, and complaints should be directed to our Privacy Officer:"}
        </p>
        <LegalList
          items={
            zh
              ? [
                  <>电子邮件:<a className="text-slate-900 hover:underline" href="mailto:privacy@libretour.com">privacy@libretour.com</a>;</>,
                  <>邮寄:Privacy Officer, Libretour Limited, [TBD-registered-address], New Zealand。</>,
                ]
              : [
                  <>email: <a className="text-slate-900 hover:underline" href="mailto:privacy@libretour.com">privacy@libretour.com</a>;</>,
                  <>post: Privacy Officer, Libretour Limited, [TBD-registered-address], New
                    Zealand.</>,
                ]
          }
        />
      </LegalSection>

      <LegalSection id="s17" number="17." title={zh ? "本政策的变更" : "Changes to this Policy"}>
        <p>
          {zh
            ? "我们可能不时修订本政策。重大变更将在生效前至少十(10)个工作日通过电子邮件通知所有账户持有人,并在服务中显著位置公布。在修订生效日之后继续使用服务,即构成对修订后政策的接受。"
            : "We may amend this Policy from time to time. Material changes will be notified by email to all account holders and posted prominently on the Services at least ten (10) working days before they take effect. Continued use of the Services after the effective date of an amendment constitutes acceptance of the amended Policy."}
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
