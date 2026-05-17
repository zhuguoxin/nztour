/**
 * Lightweight i18n. Cookie-based locale persistence (no URL-prefix
 * restructure), server-component aware via next/headers cookies().
 *
 * Why not next-intl: for MVP we only need EN + 简体中文 with a flat dict,
 * a few dozen keys, and a single switcher. Pulling next-intl forces
 * /[locale]/... route restructure across every page — too much risk
 * two days before a demo. Revisit in v0.2.
 *
 * Adding a new locale:
 *   1. add its code to SUPPORTED.
 *   2. add the same keys to `dict` under the new code.
 *   3. add a row to LANG_LABELS.
 *
 * Adding a new string:
 *   1. add the key to dict.en (the canonical set).
 *   2. add Chinese translation to dict['zh-CN'].
 *   3. read it with `(await t()).my_key`.
 */
import { cookies } from "next/headers";
import { SUPPORTED, type Locale } from "./i18n-shared";
export { SUPPORTED, LANG_LABELS, fmt } from "./i18n-shared";
export type { Locale } from "./i18n-shared";

export async function getLocale(): Promise<Locale> {
  const c = await cookies();
  const v = c.get("locale")?.value;
  return SUPPORTED.includes(v as Locale) ? (v as Locale) : "en";
}

export async function t() {
  return dict[await getLocale()];
}

// ---------------------------------------------------------------------------
//  Dictionary
//  Conventions:
//   - keys are snake_case
//   - {placeholders} use single curly braces; replace at call site
//   - never put HTML in values
// ---------------------------------------------------------------------------

const en = {
  // Navigation
  nav_explore: "Explore",
  nav_operators: "Operators",
  nav_badges: "Badges",
  nav_pricing: "Pricing",
  nav_home: "Home",
  nav_my_learning: "My learning",
  nav_operator_console: "Operator console",
  nav_operator_short: "Operator",
  nav_admin: "Admin",
  nav_learning_button: "Learning →",
  nav_learning_short: "Learning",

  // Auth
  sign_in: "Sign in",
  get_certified: "Get certified",
  language_label: "Language",

  // Home hero
  hero_live_chip: "● Live · {operators} operators · {courses} courses",
  hero_lang_chip: "🌐 7 languages · AI answers in 30+",
  hero_title_a: "Sell New Zealand with",
  hero_title_b: "confidence.",
  hero_subtitle:
    "The B2B training & certification platform for the NZ tourism industry. Learn directly from operators. Earn verifiable digital badges. Ask AI anything — in any language.",
  hero_ask_label: "Ask the agent assistant",
  hero_ask_placeholder:
    "What's the difference between Coronet Peak and The Remarkables?",
  hero_ask_button: "Ask",
  hero_example_1: "客户问 Heli Privates 适合什么水平?",
  hero_example_2: "Mt Hutt vs Coronet Peak for first-timers in June?",
  hero_example_3: "Snow-day cancellation policy",

  // Marketplace
  featured_operators: "Featured operators",
  featured_operators_subtitle:
    "Each operator brings their own course curriculum. One agent account, every NZ operator.",
  view_all_count: "View all {n} →",
  card_live: "● Live",
  card_coming_soon: "Coming soon",
  card_curriculum_coming_soon: "Course curriculum coming soon",
  card_courses_count: "🎓 {n} course",
  card_courses_count_plural: "🎓 {n} courses",
  card_modules_count: "{n} modules",
  card_minutes: "~{n} min",

  // Value props
  value_for_agents_badge: "For agents",
  value_for_agents:
    "One account, every NZ operator. Earn verifiable badges to share on LinkedIn and email signatures.",
  value_for_operators_badge: "For operators",
  value_for_operators:
    "Upload your existing PDFs and decks — we extract, structure, and turn them into trainable courses.",
  value_ai_badge: "AI-native",
  value_ai:
    "Agents can ask product questions in plain English or Chinese. Answers cite the operator source.",

  // /learn
  learn_label: "/LEARN",
  learn_welcome: "Welcome, {name}.",
  learn_anonymous: "there",
  learn_summary:
    "{courses} published course(s) available across {operators} operator(s).",
  learn_empty: "No published courses yet.",

  // Course detail
  course_label: "COURSE",
  modules_label: "MODULES",
  module_position: "Module {n}",
  completed_chip: "✓ Completed",
  no_blocks: "No content blocks yet for this module.",
  badge_earned: "Badge earned!",
  verify_code_prefix: "Verify code",
  back_to_courses: "Back to courses",
  start_module: "Start",
  stay_to_complete_a: "Stay on this page",
  stay_to_complete_b: "to mark complete",
  already_completed: "Already completed — feel free to review",
  ready_to_complete: "Ready to mark complete",
  saving: "Saving…",
  done: "Done",
  mark_complete: "Mark complete →",
  mark_complete_and_continue: "Mark complete & continue →",
  continue_to: "Continue to {title} →",

  // AI sidebar
  ai_sidebar_title: "Ask about this course",
  ai_sidebar_subtitle: "Grounded in operator content · EN / 中",
  ai_thinking: "Thinking…",
  ai_no_answer:
    "⚠ Not found in operator content. Answer is from general knowledge.",
  ai_empty_state: "Try asking about this course. Examples below.",
  ai_sidebar_placeholder: "Ask about {title}…",

  // /verify
  verify_label: "VERIFIED BADGE",
  verify_authentic: "Authentic",
  verify_subtitle:
    "This badge was issued by TourTrain on behalf of the operator listed below.",
  verify_course: "COURSE",
  verify_operator: "OPERATOR",
  verify_learner: "LEARNER",
  verify_awarded: "AWARDED",
  verify_code_label: "VERIFY CODE",
  verify_share_note:
    "Anyone with this URL can verify authenticity. Share on LinkedIn or in your email signature:",

  // Footer
  footer_build: "TourTrain · d5 build · {operators} operators / {courses} courses live",
};

type Dict = typeof en;

const zhCN: Dict = {
  // Navigation
  nav_explore: "探索",
  nav_operators: "运营商",
  nav_badges: "徽章",
  nav_pricing: "定价",
  nav_home: "首页",
  nav_my_learning: "我的学习",
  nav_operator_console: "运营商后台",
  nav_operator_short: "运营商",
  nav_admin: "管理",
  nav_learning_button: "去学习 →",
  nav_learning_short: "学习",

  // Auth
  sign_in: "登录",
  get_certified: "免费注册",
  language_label: "语言",

  // Home hero
  hero_live_chip: "● 在线 · {operators} 家运营商 · {courses} 门课程",
  hero_lang_chip: "🌐 7 种界面语言 · AI 可用 30+ 种语言回答",
  hero_title_a: "自信地销售",
  hero_title_b: "新西兰。",
  hero_subtitle:
    "新西兰旅游行业的 B2B 培训与认证平台。直接从运营商学习产品知识。获得可验证的数字徽章。用任何语言向 AI 提问。",
  hero_ask_label: "向 AI 销售助手提问",
  hero_ask_placeholder:
    "Coronet Peak 和 The Remarkables 有什么区别?",
  hero_ask_button: "提问",
  hero_example_1: "客户问 Heli Privates 适合什么水平?",
  hero_example_2: "6 月初学者选 Mt Hutt 还是 Coronet Peak?",
  hero_example_3: "雪天关闭的退改政策",

  // Marketplace
  featured_operators: "精选运营商",
  featured_operators_subtitle:
    "每家运营商提供自己的课程内容。一个代理账号,覆盖所有新西兰运营商。",
  view_all_count: "查看全部 {n} 家 →",
  card_live: "● 已上线",
  card_coming_soon: "即将上线",
  card_curriculum_coming_soon: "课程内容准备中",
  card_courses_count: "🎓 {n} 门课程",
  card_courses_count_plural: "🎓 {n} 门课程",
  card_modules_count: "{n} 个模块",
  card_minutes: "约 {n} 分钟",

  // Value props
  value_for_agents_badge: "面向销售代理",
  value_for_agents:
    "一个账号,覆盖所有新西兰运营商。获得可验证的徽章,展示在 LinkedIn 和邮件签名中。",
  value_for_operators_badge: "面向运营商",
  value_for_operators:
    "上传现有的 PDF 和演示文稿 — 我们自动提取、结构化,转换为可培训的课程。",
  value_ai_badge: "AI 原生",
  value_ai:
    "代理可用任意语言提问产品细节。回答均标注运营商原文出处。",

  // /learn
  learn_label: "/学习",
  learn_welcome: "欢迎,{name}。",
  learn_anonymous: "你好",
  learn_summary:
    "{operators} 家运营商共发布了 {courses} 门课程。",
  learn_empty: "暂无已发布的课程。",

  // Course detail
  course_label: "课程",
  modules_label: "模块",
  module_position: "第 {n} 个模块",
  completed_chip: "✓ 已完成",
  no_blocks: "该模块暂无内容。",
  badge_earned: "已获得徽章!",
  verify_code_prefix: "验证码",
  back_to_courses: "返回课程列表",
  start_module: "起点",
  stay_to_complete_a: "请在此页面停留",
  stay_to_complete_b: "以解锁完成按钮",
  already_completed: "已完成 — 可以随时回顾",
  ready_to_complete: "可以标记完成了",
  saving: "保存中…",
  done: "完成",
  mark_complete: "标记完成 →",
  mark_complete_and_continue: "标记完成并继续 →",
  continue_to: "继续到 {title} →",

  // AI sidebar
  ai_sidebar_title: "关于本课程提问",
  ai_sidebar_subtitle: "基于运营商内容 · 支持 EN / 中",
  ai_thinking: "思考中…",
  ai_no_answer:
    "⚠ 运营商内容中未找到相关信息。以下回答来自通用知识。",
  ai_empty_state: "试试关于本课程的问题。下方有示例。",
  ai_sidebar_placeholder: "向我询问关于 {title} 的任何问题…",

  // /verify
  verify_label: "已验证徽章",
  verify_authentic: "真实有效",
  verify_subtitle:
    "本徽章由 TourTrain 代表下列运营商颁发。",
  verify_course: "课程",
  verify_operator: "运营商",
  verify_learner: "学员",
  verify_awarded: "颁发日期",
  verify_code_label: "验证码",
  verify_share_note:
    "任何人通过该链接均可验证徽章真伪。可分享至 LinkedIn 或邮件签名:",

  // Footer
  footer_build: "TourTrain · d5 构建 · 已上线 {operators} 家运营商 / {courses} 门课程",
};

export const dict: Record<Locale, Dict> = {
  en,
  "zh-CN": zhCN,
};

// `fmt` is re-exported from ./i18n-shared so server + client can use the same helper.
