import { LegalLayout, LegalSection, LegalList, Term, type LegalDocMeta } from "../_components/legal-layout";
import { getLocale } from "@/lib/i18n";

export const metadata = {
  title: "Acceptable Use Policy — Libretour",
  description:
    "Rules governing the content and conduct permitted on the Libretour platform.",
};

export default async function AcceptableUsePolicy() {
  const locale = await getLocale();
  const zh = locale === "zh-CN";

  const META: LegalDocMeta = {
    title: zh ? "可接受使用政策" : "Acceptable Use Policy",
    effectiveDate: "1 January 2026",
    lastUpdated: "1 January 2026",
    version: "v1.0",
    activeSlug: "acceptable-use",
    toc: [
      { id: "s1", label: zh ? "1. 适用范围" : "1. Application" },
      { id: "s2", label: zh ? "2. 禁止内容" : "2. Prohibited content" },
      { id: "s3", label: zh ? "3. 受监管行业" : "3. Regulated industries" },
      { id: "s4", label: zh ? "4. 误导性陈述" : "4. Misleading claims" },
      { id: "s5", label: zh ? "5. 知识产权" : "5. Intellectual property" },
      { id: "s6", label: zh ? "6. 声音克隆同意" : "6. Voice cloning consent" },
      { id: "s7", label: zh ? "7. AI 助手滥用" : "7. AI assistant misuse" },
      { id: "s8", label: zh ? "8. 账户与安全滥用" : "8. Account and security abuse" },
      { id: "s9", label: zh ? "9. 举报违规" : "9. Reporting violations" },
      { id: "s10", label: zh ? "10. 执行" : "10. Enforcement" },
    ],
  };

  return (
    <LegalLayout meta={META}>
      <p>
        {zh ? (
          <>
            本可接受使用政策（<Term>「本政策」</Term>）规定了 Libretour 服务的所有用户须遵守的规则。
            本政策为服务条款的补充，并以援引方式并入服务条款。本政策未予定义的、首字母大写的术语，
            其含义以服务条款中所赋予者为准。
          </>
        ) : (
          <>
            This Acceptable Use Policy (the <Term>&ldquo;Policy&rdquo;</Term>) sets out the rules that
            all Users of the Libretour services must comply with. It supplements the Terms of
            Service and is incorporated into the Terms of Service by reference. Capitalised
            terms not defined here have the meanings given in the Terms of Service.
          </>
        )}
      </p>

      <LegalSection id="s1" number="1." title={zh ? "适用范围" : "Application"}>
        <p>
          {zh
            ? "本政策适用于所有客户内容、所有 AI 助手交互，以及服务上的所有其他行为。各供应商须负责确保其客户内容及其人员遵守本政策，各学员须对其自身行为负责。"
            : "This Policy applies to all Customer Content, all AI assistant interactions, and all other conduct on the Services. Each Supplier is responsible for ensuring that its Customer Content and its personnel comply with this Policy, and each Learner is responsible for its own conduct."}
        </p>
      </LegalSection>

      <LegalSection id="s2" number="2." title={zh ? "禁止内容" : "Prohibited content"}>
        <p>
          {zh
            ? "您不得通过服务上传、传输、发布、链接或以其他方式提供任何具有下列性质的内容："
            : "You must not upload, transmit, publish, link to, or otherwise make available through the Services any content that:"}
        </p>
        <LegalList
          items={zh ? [
            <>属于违法、诽谤、威胁、骚扰、淫秽、露骨色情，或构成《2015 年有害数字通信法》（Harmful
              Digital Communications Act 2015）项下有害数字通信的内容;</>,
            <>基于《1993 年人权法》（Human Rights Act 1993）项下被禁止的理由，歧视任何个人或群体，
              或煽动对其的仇恨或暴力的内容;</>,
            <>包含恶意软件、病毒、勒索软件、蠕虫、定时炸弹、特洛伊木马或任何其他恶意代码的内容;</>,
            <>旨在进行网络钓鱼、窃取凭据，或以其他方式就内容的来源或目的欺骗用户的内容;</>,
            <>鼓励或助长犯罪活动、欺诈，或逃避税款或监管义务的内容;或</>,
            <>属于他人个人信息，而用户无权披露该信息的内容。</>,
          ] : [
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

      <LegalSection id="s3" number="3." title={zh ? "受监管行业" : "Regulated industries"}>
        <p>
          {zh
            ? "本服务旨在用于旅游行业培训。您不得使用本服务来推广、营销或宣传须持有牌照而未持有的产品或活动，或根据新西兰法律受特定类别营销限制的产品或活动。举例而言（但不限于此），包括："
            : "The Services are intended for tourism-industry training. You must not use the Services to promote, market, or advertise products or activities for which a licence is required and not held, or which are subject to category-specific marketing restrictions under New Zealand law. By way of example and without limitation, this includes:"}
        </p>
        <LegalList
          items={zh ? [
            <>受《2003 年博彩法》（Gambling Act 2003）监管的博彩与游戏服务;</>,
            <>受《2012 年酒类销售与供应法》（Sale and Supply of Alcohol Act 2012）监管的酒类供应;</>,
            <>受《2013 年精神活性物质法》（Psychoactive Substances Act 2013）监管的精神活性物质供应;</>,
            <>受《1990 年无烟环境与受监管产品法》（Smokefree Environments and Regulated Products
              Act 1990）监管的烟草及电子烟产品;</>,
            <>受《2013 年金融市场行为法》（Financial Markets Conduct Act 2013）监管的金融产品与服务;</>,
            <>受《1981 年药品法》（Medicines Act 1981）或《2023 年治疗产品法》（Therapeutic Products
              Act 2023）监管的治疗性或健康相关声称。</>,
          ] : [
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
          {zh
            ? "若供应商的合法经营包含上述任一类别（例如设有持牌酒吧的酒店运营方），供应商须将其客户内容限于一般运营培训，且不得在该等类别内将本服务用于推广目的。"
            : <>Where a Supplier&apos;s lawful operations include any of the foregoing categories
          (for example, a hotel operator with a licensed bar), the Supplier must scope its
          Customer Content to general operational training and may not use the Services
          for promotional purposes within those categories.</>}
        </p>
      </LegalSection>

      <LegalSection id="s4" number="4." title={zh ? "误导性及无依据的陈述" : "Misleading and unsubstantiated claims"}>
        <p>
          {zh
            ? "您不得在客户内容中作出在《1986 年公平交易法》（Fair Trading Act 1986）第 9 条含义范围内构成或可能构成误导或欺骗的任何陈述。尤其是，您不得作出："
            : "You must not make any representation in Customer Content that is, or is likely to be, misleading or deceptive within the meaning of section 9 of the Fair Trading Act 1986. In particular, you must not make:"}
        </p>
        <LegalList
          items={zh ? [
            <>关于产品价格、可获得性、稀缺性、特征、适用性、性能、质量或安全性的无依据陈述;</>,
            <>在作出声称时未获合理证据支持的环境或可持续性声称;</>,
            <>未经具名方给予的背书、赞助或核准的声称;或</>,
            <>关于适用于某产品的条件、限制或退款条款的声称，且与实际向消费者提供的条款相冲突。</>,
          ] : [
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

      <LegalSection id="s5" number="5." title={zh ? "知识产权" : "Intellectual property"}>
        <p>
          {zh
            ? "您不得上传侵犯任何第三方著作权、商标、注册外观设计或其他知识产权的客户内容，包括："
            : <>You must not upload Customer Content that infringes any third party&apos;s
          copyright, trademark, registered design, or other intellectual property right,
          including:</>}
        </p>
        <LegalList
          items={zh ? [
            <>您不拥有且未获许可使用的图像、照片或视频片段;</>,
            <>受第三方著作权保护的音乐、音效或脚本;</>,
            <>未经明确书面许可的第三方（包括竞争对手或合作运营方）的徽标、品牌名称或显著标记;</>,
            <>从受著作权保护的出版物中提取的、超出《1994 年著作权法》（Copyright Act 1994）项下
              合理使用所允许范围的内容。</>,
          ] : [
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

      <LegalSection id="s6" number="6." title={zh ? "声音克隆同意" : "Voice cloning consent"}>
        <p>
          {zh
            ? "唯有在供应商持有声音提供者事先知情书面同意的情况下，方可使用声音克隆，详见服务条款第 7 条。此外，供应商："
            : "Voice cloning may only be used where the Supplier holds the prior informed written consent of the Voice Donor, as described in section 7 of the Terms of Service. In addition, the Supplier:"}
        </p>
        <LegalList
          items={zh ? [
            <>须在使用克隆声音期间及其后不少于七（7）年内，保存原始同意文件（或其数字等价物）;</>,
            <>不得使用克隆声音模仿声音提供者以外的任何个人，或将任何个人未授权的言论归于其名下;</>,
            <>不得以任何会构成《1986 年公平交易法》（Fair Trading Act 1986）项下欺骗性陈述的方式
              使用克隆声音;及</>,
            <>在出现可信的同意争议时，须遵守 Libretour 关于移除或替换由克隆声音生成之音频的任何
              合理指示。</>,
          ] : [
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

      <LegalSection id="s7" number="7." title={zh ? "AI 助手滥用" : "AI assistant misuse"}>
        <p>{zh ? "您不得使用平台内的 AI 助手来：" : "You must not use the in-platform AI assistant to:"}</p>
        <LegalList
          items={zh ? [
            <>试图获取供应商私有内容的逐字副本，超出助手所配置披露的范围;</>,
            <>生成若直接上传则会违反本政策的内容;</>,
            <>规避旨在确认学员能力的学习、测验或章节门槛机制;</>,
            <>生成与本服务旅游培训目的无关的政治、宗教或党派宣传内容;或</>,
            <>进行自动化批量查询，意图收集模型响应以用于再发布、模型训练或竞争分析。</>,
          ] : [
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

      <LegalSection id="s8" number="8." title={zh ? "账户、网络与安全滥用" : "Account, network, and security abuse"}>
        <p>{zh ? "您不得，亦不得试图：" : "You must not, and must not attempt to:"}</p>
        <LegalList
          items={zh ? [
            <>共享、出售或转让您的账户凭据，或维持多个账户以规避配额;</>,
            <>通过已发布 API 之外的自动化手段抓取、爬取、收集或索引本服务;</>,
            <>在未获 Libretour 明确书面授权的情况下，探测、扫描或测试本服务的漏洞，
              作为已发布的负责任披露计划一部分的情形除外;</>,
            <>干扰、超载或损害本服务的运行，或任何其他用户对本服务的使用;</>,
            <>对本服务任何部分进行反向工程、反编译，或试图提取其源代码，但法律明确允许的范围内除外;或</>,
            <>向本服务引入旨在操纵或破坏我方 AI 系统稳定的内容（包括通过提示注入技术）。</>,
          ] : [
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

      <LegalSection id="s9" number="9." title={zh ? "举报违规" : "Reporting violations"}>
        <p>
          {zh
            ? "若您得知任何您认为违反本政策的行为或内容，请向 abuse@libretour.com 举报。举报应包括内容的 URL 或平台内位置、对所称违规行为的描述，以及举报人的联系方式。我们将在五（5）个工作日内确认收到每一份举报。"
            : <>If you become aware of any conduct or content that you believe breaches this
          Policy, please report it to abuse@libretour.com. Reports should include the URL
          or in-platform location of the content, a description of the alleged breach, and
          the reporter&apos;s contact details. We will acknowledge each report within five
          (5) Working Days.</>}
        </p>
      </LegalSection>

      <LegalSection id="s10" number="10." title={zh ? "执行" : "Enforcement"}>
        <p>
          {zh
            ? "若 Libretour 合理地认为某用户已违反本政策，Libretour 可酌情并与违规严重程度相称地："
            : "Where Libretour reasonably believes that a User has breached this Policy, Libretour may, in its discretion and proportionate to the seriousness of the breach:"}
        </p>
        <LegalList
          items={zh ? [
            <>发出书面警告;</>,
            <>移除违规内容或禁用对其的访问;</>,
            <>暂停该用户账户，期限不超过六十（60）日;</>,
            <>依据服务条款终止该用户的账户及订阅;</>,
            <>为调查目的或协助执法而保留日志和元数据;或</>,
            <>将事项移交新西兰警方、隐私专员办公室或任何其他主管监管机构。</>,
          ] : [
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
