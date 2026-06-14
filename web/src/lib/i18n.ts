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
  nav_operators: "Products",
  nav_badges: "Badges",
  nav_pricing: "Pricing",
  nav_home: "Home",
  nav_my_learning: "My learning",
  nav_operator_console: "Product console",
  nav_operator_short: "Product",
  nav_supplier_console: "Supplier console",
  bc_supplier: "Supplier",
  nav_supplier_short: "Supplier",
  nav_admin: "Admin",
  nav_learning_button: "Learning →",
  nav_learning_short: "Learning",

  // Auth
  sign_in: "Sign in",
  get_certified: "Get certified",
  language_label: "Language",

  // Home hero
  hero_live_chip: "● Live · {operators} products · {courses} courses",
  hero_lang_chip: "🌐 7 languages · AI answers in 30+",
  hero_title_a: "Sell New Zealand with",
  hero_title_b: "confidence.",
  hero_subtitle:
    "The B2B training & certification platform for the NZ tourism industry. Learn directly from suppliers. Earn verifiable digital badges. Ask AI anything — in any language.",
  hero_ask_label: "Ask the agent assistant",
  hero_ask_placeholder:
    "What's the difference between Coronet Peak and The Remarkables?",
  hero_ask_button: "Ask",
  hero_example_1: "客户问 Heli Privates 适合什么水平?",
  hero_example_2: "Mt Hutt vs Coronet Peak for first-timers in June?",
  hero_example_3: "Snow-day cancellation policy",

  // Marketplace
  featured_operators: "Featured products",
  featured_operators_subtitle:
    "Each product brings its own curriculum. One agent account, every NZ tourism product.",
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
    "One account, every NZ tourism product. Earn verifiable badges to share on LinkedIn and email signatures.",
  value_for_operators_badge: "For suppliers",
  value_for_operators:
    "Upload your existing PDFs and decks — we extract, structure, and turn them into trainable courses.",
  value_ai_badge: "AI-native",
  value_ai:
    "Agents can ask product questions in plain English or Chinese. Answers cite the supplier's content.",

  // /learn
  learn_label: "/LEARN",
  learn_welcome: "Welcome, {name}.",
  learn_anonymous: "there",
  learn_summary:
    "{courses} published course(s) across {operators} product(s).",
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
  ai_sidebar_subtitle: "Grounded in product content · EN / 中",
  ai_thinking: "Thinking…",
  ai_no_answer:
    "⚠ Not found in product content. Answer is from general knowledge.",
  ai_empty_state: "Try asking about this course. Examples below.",
  ai_sidebar_placeholder: "Ask about {title}…",

  // /verify
  verify_label: "VERIFIED BADGE",
  verify_authentic: "Authentic",
  verify_subtitle:
    "This badge was issued by Libretour on behalf of the product / supplier listed below.",
  verify_course: "COURSE",
  verify_operator: "PRODUCT",
  verify_learner: "LEARNER",
  verify_awarded: "AWARDED",
  verify_code_label: "VERIFY CODE",
  verify_share_note:
    "Anyone with this URL can verify authenticity. Share on LinkedIn or in your email signature:",

  // Footer
  footer_build: "Libretour · d5 build · {operators} products / {courses} courses live",

  // ===== /verify/[code] =====
  verify_chrome_label: "VERIFIED BADGE",
  verify_chrome_title: "Authentic",
  verify_chrome_subtitle:
    "This badge was issued by Libretour on behalf of the product / supplier listed below.",
  verify_field_course: "COURSE",
  verify_field_operator: "PRODUCT",
  verify_field_learner: "LEARNER",
  verify_field_awarded: "AWARDED",
  verify_field_code: "VERIFY CODE",
  verify_share_lead:
    "Anyone with this URL can verify authenticity. Share on LinkedIn or in your email signature:",

  // ===== /operator (picker — user-facing "Products") =====
  op_picker_label: "/PRODUCTS",
  op_picker_title_admin: "All products",
  op_picker_title_user: "Your products",
  op_picker_empty_blurb: "Nothing to manage yet.",
  op_picker_admin_blurb: "You can manage any of these {n} as platform admin.",
  op_picker_user_blurb_one:
    "You have {n} product. Pick one to open the console.",
  op_picker_user_blurb_many:
    "You have {n} products. Pick one to open the console.",
  op_picker_none_title: "No product memberships",
  op_picker_none_body:
    "You're signed in as a learner. To manage a product's content, ask your supplier owner or the platform admin to grant you access.",
  op_picker_card_published: "{n} published",
  op_picker_card_cta: "Open console →",

  // ===== /supplier (picker) =====
  sup_picker_label: "/SUPPLIERS",
  sup_picker_title_admin: "All suppliers",
  sup_picker_title_user: "Your suppliers",
  sup_picker_empty_blurb: "Nothing to manage yet.",
  sup_picker_admin_blurb: "You can manage any of these {n} suppliers as platform admin.",
  sup_picker_user_blurb: "You have access to {n} supplier(s). Pick one to see the roll-up.",
  sup_picker_none_title: "No supplier memberships",
  sup_picker_none_body:
    "Supplier access lets you see every product under a holding entity (e.g. SkyCity). Ask your supplier owner to add you.",
  sup_picker_card_products: "{n} products",
  sup_picker_card_published: "{n} published",
  sup_picker_card_cta: "Open dashboard →",

  // ===== /supplier/[slug] dashboard =====
  sup_d_chrome_label: "/SUPPLIER",
  sup_d_kpi_products: "PRODUCTS",
  sup_d_kpi_courses: "PUBLISHED COURSES",
  sup_d_kpi_learners: "TOTAL LEARNERS",
  sup_d_kpi_badges: "BADGES ISSUED",
  sup_d_products_heading: "Products ({n})",
  sup_d_mini_courses: "courses",
  sup_d_mini_learners: "learners",
  sup_d_mini_badges: "badges",
  sup_d_card_cta: "Open product console →",

  // ===== /product/[slug] dashboard =====
  op_d_chrome_label: "/PRODUCT",
  op_d_view_as_admin: "viewing as admin",
  op_d_blurb:
    "Manage your courses, watch what agents are learning, and see the questions they're asking — all in one place.",
  op_d_new_course: "+ New course",
  op_d_new_course_disabled: "Course CRUD lands in v0.2",
  op_d_switch: "Switch",
  op_d_switch_panel_title: "YOUR OPERATORS · {n}",
  op_d_switch_view_all: "View all operators →",

  op_d_kpi_total_learners: "TOTAL LEARNERS",
  op_d_kpi_courses_published: "COURSES PUBLISHED",
  op_d_kpi_badges_awarded: "BADGES AWARDED",
  op_d_kpi_ai_questions: "AI QUESTIONS",
  op_d_kpi_this_week: "+{n} this week",
  op_d_kpi_drafts: "{n} draft",
  op_d_kpi_all_live: "all live",
  op_d_kpi_completion: "{pct}% completion",
  op_d_kpi_30d: "{n} in last 30d",

  op_d_activity_title: "Learning activity · last 7 days",
  op_d_activity_completions: "Module completions",
  op_d_activity_new_learners: "New learners",
  op_d_activity_empty: "No activity in the last 7 days yet.",

  op_d_my_courses: "My courses",
  op_d_total_count: "{n} total",
  op_d_no_courses: "No courses yet.",
  op_d_course_modules: "{n} module",
  op_d_course_modules_plural: "{n} modules",
  op_d_course_updated: "updated {rel}",
  op_d_course_learners_tooltip: "{n} learner have started this course",
  op_d_course_learners_tooltip_plural: "{n} learners have started this course",
  op_d_status_published: "Published",
  op_d_status_draft: "Draft",
  op_d_action_edit: "Edit",
  op_d_action_view: "View",

  op_d_upload_title: "Upload content",
  op_d_upload_sub: "PDF · PPTX · DOCX · MP4 · Images — auto-extracted into modules",
  op_d_upload_dropzone_a: "Drop files here or",
  op_d_upload_dropzone_b: "browse",
  op_d_upload_dropzone_blurb:
    "We'll auto-extract text, images & structure into modules",
  op_d_upload_alert:
    "Self-serve parsing wires up in v0.2 (Cloudflare Containers).\n\nFor the MVP demo, content is pre-extracted offline — see seed/scripts/extract_pdf.py.",
  op_d_upload_state_pdf_done: "✓ Parsed · 12 sections · 8 images",
  op_d_upload_state_pptx_done: "✓ Parsed · 22 slides · ready to review",
  op_d_upload_state_video_done: "✓ Encoded · 3:30",
  op_d_upload_state_pptx_progress: "⚙ Parsing slides… {n}/22",
  op_d_upload_state_video_progress: "Encoding via Stream · {t} / 3:30",
  op_d_upload_state_pdf_progress: "Parsing…",
  op_d_upload_state_done_chip: "Done",

  op_d_learners_title: "Recent learner progress",
  op_d_learners_export: "Export CSV",
  op_d_learners_export_tooltip: "CSV export lands in v0.2",
  op_d_learners_empty:
    "No learners yet — share your course link with agents to get the first enrollments.",
  op_d_learners_th_learner: "Learner",
  op_d_learners_th_agency: "Agency",
  op_d_learners_th_course: "Course",
  op_d_learners_th_progress: "Progress",
  op_d_learners_th_badge: "Badge",
  op_d_badge_issued: "Issued",
  op_d_badge_pending: "Pending",
  op_d_badge_not_yet: "Not yet",

  op_d_topqs_title: "Top questions agents ask",
  op_d_topqs_sub: "Last 30 days · {n} queries",
  op_d_topqs_empty:
    "No questions yet. Share the AI assistant with agents to start gathering insights.",
  op_d_topqs_asks_one: "{n} ask",
  op_d_topqs_asks_plural: "{n} asks",
  op_d_topqs_source_rag: "✓ answered from your content",
  op_d_topqs_source_web: "⚠ fell back to web — consider adding to course",
  op_d_topqs_source_none: "✗ no answer found — content gap",
  op_d_topqs_view_all: "View all questions →",

  op_d_403_label: "403",
  op_d_403_title: "No operator access",
  op_d_403_body:
    "You don't have permission to manage {slug}. Ask the platform admin to grant you operator membership.",
  op_d_403_home: "← Home",

  // ===== /admin =====
  admin_chrome_label: "/ADMIN",
  admin_breadcrumb: "Platform admin",
  admin_title: "Platform admin",
  admin_blurb:
    "Manage users and grant operator memberships. Use sparingly — every action writes to D1.",
  admin_stat_users: "Users",
  admin_stat_operators: "Operators",
  admin_stat_memberships: "Memberships",
  admin_stat_you: "You",
  admin_you_admin: "✓ admin",
  admin_users_title: "Users + memberships",
  admin_users_sub:
    "Last 100 by signup time. Submit the form on any row to grant a new operator membership.",
  admin_users_empty: "No users yet.",
  admin_grant_placeholder: "Grant operator…",
  admin_grant_button: "Grant",
  admin_role_admin: "admin",
  admin_role_editor: "editor",
  admin_revoke_tooltip: "Revoke {role} access to {operator}",
  admin_operators_title: "Operators",
  admin_operators_sub: "Tap to open the console as admin.",
  admin_403_title: "Admin only",
  admin_403_body:
    "You're signed in but not a platform admin. If your email is on the allow-list, visit /learn first to trigger the bootstrap.",

  // ===== AskAI conversation =====
  ai_thinking_inline: "Thinking…",
  ai_no_answer_inline:
    "⚠ Not found in product content. Answer is from general knowledge.",
  ai_ask_button_inline: "Ask",

  // ===== Module reader / video block =====
  video_caption_default: "Video",
  video_not_uploaded: "video not yet uploaded",
  video_setup_hint:
    "Set NEXT_PUBLIC_STREAM_CUSTOMER_SUBDOMAIN and a real Stream UID to embed",
  mobile_ask_ai: "Ask AI",
};

type Dict = typeof en;

const zhCN: Dict = {
  // Navigation
  nav_explore: "探索",
  nav_operators: "产品",
  nav_badges: "徽章",
  nav_pricing: "定价",
  nav_home: "首页",
  nav_my_learning: "我的学习",
  nav_operator_console: "产品后台",
  nav_operator_short: "产品",
  nav_supplier_console: "供应商面板",
  bc_supplier: "供应商面板",
  nav_supplier_short: "供应商",
  nav_admin: "管理",
  nav_learning_button: "去学习 →",
  nav_learning_short: "学习",

  // Auth
  sign_in: "登录",
  get_certified: "免费注册",
  language_label: "语言",

  // Home hero
  hero_live_chip: "● 在线 · {operators} 个产品 · {courses} 门课程",
  hero_lang_chip: "🌐 7 种界面语言 · AI 可用 30+ 种语言回答",
  hero_title_a: "自信地销售",
  hero_title_b: "新西兰。",
  hero_subtitle:
    "新西兰旅游行业的 B2B 培训与认证平台。直接从供应商学习产品知识。获得可验证的数字徽章。用任何语言向 AI 提问。",
  hero_ask_label: "向 AI 销售助手提问",
  hero_ask_placeholder:
    "Coronet Peak 和 The Remarkables 有什么区别?",
  hero_ask_button: "提问",
  hero_example_1: "客户问 Heli Privates 适合什么水平?",
  hero_example_2: "6 月初学者选 Mt Hutt 还是 Coronet Peak?",
  hero_example_3: "雪天关闭的退改政策",

  // Marketplace
  featured_operators: "精选产品",
  featured_operators_subtitle:
    "每个产品提供自己的课程内容。一个代理账号,覆盖所有新西兰旅游产品。",
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
    "一个账号,覆盖所有新西兰旅游产品。获得可验证的徽章,展示在 LinkedIn 和邮件签名中。",
  value_for_operators_badge: "面向供应商",
  value_for_operators:
    "上传现有的 PDF 和演示文稿 — 我们自动提取、结构化,转换为可培训的课程。",
  value_ai_badge: "AI 原生",
  value_ai:
    "代理可用任意语言提问产品细节。回答均标注产品原文出处。",

  // /learn
  learn_label: "/学习",
  learn_welcome: "欢迎,{name}。",
  learn_anonymous: "你好",
  learn_summary:
    "{operators} 个产品共发布了 {courses} 门课程。",
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
    "本徽章由 Libretour 代表下列产品/供应商颁发。",
  verify_course: "课程",
  verify_operator: "产品",
  verify_learner: "学员",
  verify_awarded: "颁发日期",
  verify_code_label: "验证码",
  verify_share_note:
    "任何人通过该链接均可验证徽章真伪。可分享至 LinkedIn 或邮件签名:",

  // Footer
  footer_build: "Libretour · d5 构建 · 已上线 {operators} 个产品 / {courses} 门课程",

  // ===== /verify/[code] =====
  verify_chrome_label: "已验证徽章",
  verify_chrome_title: "真实有效",
  verify_chrome_subtitle: "本徽章由 Libretour 代表下列产品/供应商颁发。",
  verify_field_course: "课程",
  verify_field_operator: "产品",
  verify_field_learner: "学员",
  verify_field_awarded: "颁发日期",
  verify_field_code: "验证码",
  verify_share_lead:
    "任何人通过该链接均可验证徽章真伪。可分享至 LinkedIn 或邮件签名:",

  // ===== /operator (picker — user-facing "产品") =====
  op_picker_label: "/产品",
  op_picker_title_admin: "全部产品",
  op_picker_title_user: "你的产品",
  op_picker_empty_blurb: "暂无可管理的产品。",
  op_picker_admin_blurb: "作为平台管理员,你可管理以下 {n} 个产品。",
  op_picker_user_blurb_one: "你拥有 {n} 个产品。点击进入后台。",
  op_picker_user_blurb_many: "你拥有 {n} 个产品。选择一个进入后台。",
  op_picker_none_title: "尚无产品权限",
  op_picker_none_body:
    "你目前是学员身份。如需管理产品内容,请联系所属供应商管理员或平台管理员开通。",
  op_picker_card_published: "{n} 门已发布",
  op_picker_card_cta: "进入后台 →",

  // ===== /supplier (picker) =====
  sup_picker_label: "/供应商",
  sup_picker_title_admin: "全部供应商",
  sup_picker_title_user: "你的供应商",
  sup_picker_empty_blurb: "暂无可管理的供应商。",
  sup_picker_admin_blurb: "作为平台管理员,你可管理以下 {n} 家供应商。",
  sup_picker_user_blurb: "你拥有 {n} 家供应商权限。选择一家查看汇总。",
  sup_picker_none_title: "尚无供应商权限",
  sup_picker_none_body:
    "供应商权限可让你查看其名下所有产品(例如 SkyCity)的汇总。请联系供应商管理员开通。",
  sup_picker_card_products: "{n} 个产品",
  sup_picker_card_published: "{n} 门已发布",
  sup_picker_card_cta: "查看面板 →",

  // ===== /supplier/[slug] dashboard =====
  sup_d_chrome_label: "/供应商",
  sup_d_kpi_products: "产品数",
  sup_d_kpi_courses: "已发布课程",
  sup_d_kpi_learners: "学员总数",
  sup_d_kpi_badges: "颁发徽章",
  sup_d_products_heading: "产品 ({n})",
  sup_d_mini_courses: "课程",
  sup_d_mini_learners: "学员",
  sup_d_mini_badges: "徽章",
  sup_d_card_cta: "进入产品后台 →",

  // ===== /product/[slug] dashboard =====
  op_d_chrome_label: "/产品",
  op_d_view_as_admin: "以管理员身份查看",
  op_d_blurb:
    "在一个面板里管理课程、查看学员动态、洞察代理实际提问的问题。",
  op_d_new_course: "+ 新建课程",
  op_d_new_course_disabled: "课程编辑器将于 v0.2 上线",
  op_d_switch: "切换",
  op_d_switch_panel_title: "你的运营商 · {n}",
  op_d_switch_view_all: "查看全部运营商 →",

  op_d_kpi_total_learners: "学员总数",
  op_d_kpi_courses_published: "已发布课程",
  op_d_kpi_badges_awarded: "颁发徽章",
  op_d_kpi_ai_questions: "AI 提问数",
  op_d_kpi_this_week: "本周 +{n}",
  op_d_kpi_drafts: "草稿 {n} 门",
  op_d_kpi_all_live: "全部已上线",
  op_d_kpi_completion: "完成率 {pct}%",
  op_d_kpi_30d: "近 30 天 {n}",

  op_d_activity_title: "学习活动 · 近 7 天",
  op_d_activity_completions: "模块完成",
  op_d_activity_new_learners: "新增学员",
  op_d_activity_empty: "近 7 天暂无学习活动。",

  op_d_my_courses: "我的课程",
  op_d_total_count: "共 {n} 门",
  op_d_no_courses: "暂无课程。",
  op_d_course_modules: "{n} 个模块",
  op_d_course_modules_plural: "{n} 个模块",
  op_d_course_updated: "更新于 {rel}",
  op_d_course_learners_tooltip: "已有 {n} 位学员开始本课",
  op_d_course_learners_tooltip_plural: "已有 {n} 位学员开始本课",
  op_d_status_published: "已发布",
  op_d_status_draft: "草稿",
  op_d_action_edit: "编辑",
  op_d_action_view: "查看",

  op_d_upload_title: "上传内容",
  op_d_upload_sub: "PDF · PPTX · DOCX · MP4 · 图片 — 自动提取为课程模块",
  op_d_upload_dropzone_a: "拖文件到这里或",
  op_d_upload_dropzone_b: "浏览选择",
  op_d_upload_dropzone_blurb: "系统会自动提取文字、图片并生成课程结构",
  op_d_upload_alert:
    "自助解析将于 v0.2 通过 Cloudflare Containers 上线。\n\nMVP 阶段我们采用离线预提取 — 请参考 seed/scripts/extract_pdf.py。",
  op_d_upload_state_pdf_done: "✓ 已解析 · 12 段 · 8 张图",
  op_d_upload_state_pptx_done: "✓ 已解析 · 22 页 · 等待审核",
  op_d_upload_state_video_done: "✓ 已编码 · 3:30",
  op_d_upload_state_pptx_progress: "⚙ 解析中… {n}/22",
  op_d_upload_state_video_progress: "Stream 编码中 · {t} / 3:30",
  op_d_upload_state_pdf_progress: "解析中…",
  op_d_upload_state_done_chip: "完成",

  op_d_learners_title: "最近学员进度",
  op_d_learners_export: "导出 CSV",
  op_d_learners_export_tooltip: "CSV 导出将于 v0.2 上线",
  op_d_learners_empty:
    "暂无学员 — 把课程链接分享给代理,开始获取第一批注册。",
  op_d_learners_th_learner: "学员",
  op_d_learners_th_agency: "公司",
  op_d_learners_th_course: "课程",
  op_d_learners_th_progress: "进度",
  op_d_learners_th_badge: "徽章",
  op_d_badge_issued: "已颁发",
  op_d_badge_pending: "进行中",
  op_d_badge_not_yet: "未开始",

  op_d_topqs_title: "代理最常问的问题",
  op_d_topqs_sub: "近 30 天 · 共 {n} 次提问",
  op_d_topqs_empty:
    "暂无提问。把 AI 助手分享给代理,开始积累洞察。",
  op_d_topqs_asks_one: "{n} 次提问",
  op_d_topqs_asks_plural: "{n} 次提问",
  op_d_topqs_source_rag: "✓ 命中你的课程内容",
  op_d_topqs_source_web: "⚠ 回退到网络答案 — 建议补充到课程",
  op_d_topqs_source_none: "✗ 未找到答案 — 内容缺口",
  op_d_topqs_view_all: "查看全部提问 →",

  op_d_403_label: "403",
  op_d_403_title: "无运营商访问权限",
  op_d_403_body:
    "你没有管理 {slug} 的权限。请联系平台管理员授予 operator membership。",
  op_d_403_home: "← 返回首页",

  // ===== /admin =====
  admin_chrome_label: "/管理",
  admin_breadcrumb: "平台管理",
  admin_title: "平台管理",
  admin_blurb:
    "管理用户与运营商权限。每个动作都会写入 D1,请谨慎操作。",
  admin_stat_users: "用户",
  admin_stat_operators: "运营商",
  admin_stat_memberships: "授权数",
  admin_stat_you: "当前",
  admin_you_admin: "✓ 管理员",
  admin_users_title: "用户与授权",
  admin_users_sub:
    "按注册时间倒序最近 100 位。提交任意一行的表单即可授予新的运营商权限。",
  admin_users_empty: "暂无用户。",
  admin_grant_placeholder: "授予运营商…",
  admin_grant_button: "授予",
  admin_role_admin: "admin",
  admin_role_editor: "editor",
  admin_revoke_tooltip: "撤销 {operator} 的 {role} 权限",
  admin_operators_title: "运营商列表",
  admin_operators_sub: "点击任意一家,以管理员身份进入后台。",
  admin_403_title: "仅限管理员",
  admin_403_body:
    "你已登录,但不是平台管理员。如果你的邮箱在白名单内,先访问 /learn 触发自动提权。",

  // ===== AskAI conversation =====
  ai_thinking_inline: "思考中…",
  ai_no_answer_inline: "⚠ 运营商内容中未找到相关信息。以下回答来自通用知识。",
  ai_ask_button_inline: "提问",

  // ===== Module reader / video block =====
  video_caption_default: "视频",
  video_not_uploaded: "视频尚未上传",
  video_setup_hint:
    "在 NEXT_PUBLIC_STREAM_CUSTOMER_SUBDOMAIN 填入域名 + 真实 Stream UID 即可嵌入播放",
  mobile_ask_ai: "问 AI",
};

export const dict: Record<Locale, Dict> = {
  en,
  "zh-CN": zhCN,
};

// `fmt` is re-exported from ./i18n-shared so server + client can use the same helper.
