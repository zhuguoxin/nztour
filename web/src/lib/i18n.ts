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

  // ===== New course / generate-from-document =====
  nc_crumb_new: "New course",
  nc_label: "/PRODUCT · NEW COURSE",
  nc_title: "Create a new course",
  nc_tab_ai: "Generate from a document",
  nc_tab_manual: "Create manually",
  nc_manual_sub:
    "Give the course a title and a one-line summary. You can add modules and content after it's created. New courses start as drafts.",
  nc_f_title: "Title",
  nc_f_title_hint: "What an agent sees on the course card.",
  nc_f_summary: "Summary",
  nc_f_summary_hint: "1-2 sentences. Optional.",
  nc_f_emoji: "Emoji",
  nc_f_emoji_hint: "One character.",
  nc_f_est: "Estimated minutes",
  nc_f_est_hint: "Total reading time.",
  nc_f_lang: "Primary language",
  nc_f_lang_hint: "The language the source content is in.",
  nc_create: "Create course →",
  nc_cancel: "Cancel",

  gen_sub:
    "Upload a brochure, deck, or fact sheet (PDF or text). Claude reads it and drafts a structured course — modules and content — that you can edit before publishing.",
  gen_file: "Source file",
  gen_file_pick: "Choose a PDF or text file",
  gen_file_hint: "PDF / TXT / Markdown · ≤ 20 MB",
  gen_title_label: "Working title",
  gen_title_hint: "Optional — the AI will refine it.",
  gen_title_ph: "e.g. Coronet Peak 2026",
  gen_notes_label: "Notes for the AI",
  gen_notes_hint: "Optional — focus, audience, emphasis.",
  gen_notes_ph: "e.g. emphasise booking & cancellation policy",
  gen_button: "Generate course →",
  gen_generating:
    "Reading the document and drafting your course… this usually takes 20–60 seconds.",
  gen_need_file: "Choose a file first.",
  gen_failed: "Generation failed",

  // ===== Voices panel =====
  voi_title: "Cloned voices",
  voi_sub: "Voices recorded for this supplier. Each can narrate only the languages you assign it.",
  voi_disabled: "Cloning disabled — key not set",
  voi_empty: "No cloned voices yet — record one below.",
  voi_edit: "Edit",
  voi_langs: "Languages:",
  voi_name_ph: "Voice name e.g. Maya — sales lead",
  voi_g_neutral: "neutral",
  voi_g_male: "male",
  voi_g_female: "female",
  voi_rec_start: "● Start recording",
  voi_rec_rerecord: "● Re-record",
  voi_rec_stop: "■ Stop",
  voi_rec_max: "max {n} min",
  voi_recorded: "{t} recorded",
  voi_save_clone: "Save & clone",
  voi_cloning: "Cloning…",
  voi_rerecord_btn: "Re-record",
  voi_save_new_rec: "Save new recording",
  voi_discard: "Discard take",
  voi_save_changes: "Save changes",
  voi_saving: "Saving…",
  voi_cancel: "Cancel",
  voi_too_short: "Recording is under 10 seconds — record a bit more for a good clone.",
  voi_mic_blocked: "Microphone access was blocked. Allow mic permission and try again.",
  voi_nothing: "Nothing was recorded. Try again.",
  voi_tip:
    "Record 10 seconds–3 minutes, single speaker, clear speech, no music or background noise.",
  voi_new_heading: "Recording a new voice",
  voi_enter_name_first: "Enter a voice name first",
  voi_pick_lang_first: "Pick at least one language",

  // ===== Translations panel =====
  tp_title: "Languages",
  tp_sub:
    "Source language is {lang}. Enable a language to translate the whole course; disable it to hide it from learners without losing the translation or audio — re-enabling is instant.",
  tp_source: "source",
  tp_translating: "Translating — usually 10–30 seconds for a typical course.",
  tp_enabled_title: "Enabled — click to disable (translation is kept)",
  tp_disabled_title: "Disabled — click to enable (reuses the existing {lang} translation)",
  tp_translate_title: "Translate the whole course to {lang} and enable it",
  tp_retranslate_title: "Re-translate (overwrites the existing translation)",
  tp_preview_title: "Preview in {lang}",

  // ===== Course editor (page + duration + modules) =====
  ed_course_details: "Course details",
  ed_preview_title: "Preview the course as a learner would see it, even while draft",
  ed_preview: "Preview →",
  ed_view_live: "View live →",
  ed_minutes: "Minutes",
  ed_status: "Status",
  ed_draft: "draft",
  ed_published: "published",
  ed_save_changes: "Save changes",
  ed_delete_course: "Delete course",
  ed_modules: "Modules",
  ed_modules_count: "{n} modules · drag ⠿ to reorder",
  ed_voices_title: "Clone a sales rep's own voice — it works in every language across your products.",
  ed_manage_voices: "🎙️ Manage & clone voices →",
  ed_new_module_ph: "New module title — e.g. Lifts & terrain map",
  ed_add_module: "+ Add module",
  ed_len_label: "COURSE LENGTH",
  ed_len_target: "Target ≤ 20:00 · sweet spot ~15:00",
  ed_len_low: "Under 5 min — consider adding more content.",
  ed_len_good: "Length is in the sweet spot.",
  ed_len_warn: "Past 15 min — getting long. Trim or split if you can.",
  ed_len_over: "Over 20 min — strongly consider splitting this course.",
  ed_len_sweet: "15:00 sweet spot",

  // ===== Course editor — modules / blocks / quiz / audio (editor-modules.tsx) =====
  em_lang_tabs_label: "Editing language",
  em_block_add_text: "+ Text",
  em_block_add_image: "+ Image",
  em_block_add_video: "+ Video",
  em_block_add_callout: "+ Callout",
  em_module_title_ph: "Module title",
  em_module_summary_ph: "Module summary (optional)",
  em_save: "Save",
  em_saved: "Saved",
  em_saving: "Saving…",
  em_delete_module: "Delete module",
  em_delete_module_confirm: "Delete this module and all its blocks?",
  em_delete_block: "Delete block",
  em_block_text_ph: "Markdown (**bold**, *italic*)",
  em_block_video_ph: "yt:<youtube-id>  or  Cloudflare Stream UID (32 hex)",
  em_block_caption_ph: "Caption (optional)",
  em_block_training: "Fed to the AI assistant for Q&A, but hidden from learners in /learn",
  em_quiz_title: "Quiz",
  em_quiz_generate: "✨ Generate quiz",
  em_quiz_generate_title: "AI-generates 5 multi-choice questions from this module's text content",
  em_quiz_generating: "Generating…",
  em_quiz_q_ph: "Question…",
  em_quiz_choice_a: "Choice A",
  em_quiz_choice_b: "Choice B",
  em_quiz_choice_c: "Choice C (optional)",
  em_quiz_choice_d: "Choice D (optional)",
  em_quiz_explanation_ph: "Explanation (optional)",
  em_quiz_delete_q: "Delete question",
  em_quiz_add_q: "+ Add question",
  em_quiz_correct: "Correct",
  em_audio_heading: "Voice-over",
  em_audio_generate: "Generate audio",
  em_audio_generating: "Generating…",
  em_audio_regenerate: "Regenerate",
  em_audio_delete_title: "Delete the primary-lang generated audio (other languages stay)",
  em_audio_no_text: "No text to narrate.",
  em_no_blocks: "No content blocks yet.",
  em_block_image: "Image",
  em_block_video: "Video",
  em_block_text: "Text",
  em_block_callout: "Callout",
  em_drag_reorder: "Drag to reorder",
  em_no_modules: "No modules yet. Add the first one below to get started.",
  em_field_title: "Title",
  em_field_summary: "Summary",
  em_field_minutes: "Minutes",
  em_save_module: "Save module",
  em_no_blocks_add: "No blocks yet — add one below.",
  em_add_block_text: "+ Add text block",
  em_add_block_callout: "+ Add callout block",
  em_add_block_video: "+ Add video block",
  em_add_block_image: "+ Add image block",
  em_block_tip:
    "💡 Write each {text} block as one coherent paragraph (2–5 sentences) — it reads better and keeps voice-over narration natural. Use a {callout} for a single highlight, and a separate block per distinct item (e.g. each pricing tier). One sentence per block makes the audio choppy.",
  em_block_tip_text: "text",
  em_block_tip_callout: "callout",
  em_quiz_heading: "End-of-chapter quiz",
  em_quiz_count_one: "({n} question · learner sees 3 random)",
  em_quiz_count_many: "({n} questions · learner sees 3 random)",
  em_quiz_gen5: "✨ Generate 5 from content",
  em_quiz_empty:
    "No questions yet — learners will use the default 30-second-dwell completion until you add some.",
  em_quiz_add_short: "+ Add",
  em_ai_only: "AI-only",
  em_ai_only_hide: "AI-only (hide from learners)",
  em_save_block: "Save block",
  em_audio_one_per_lang: "one row per available language",
  em_audio_primary_suffix: " · primary",
  em_audio_not_generated: "not generated",
  em_audio_gen_short: "Generate",
  em_audio_clear_primary: "clear primary audio",
  em_gen_failed: "Generation failed",
  em_img_none: "No image — pick a file below",
  em_uploading: "Uploading…",
  em_replace_image: "Replace image",
  em_choose_image: "Choose image",
  em_img_formats: "PNG / JPEG / WebP / GIF · max 8 MB",
  em_block_delete_short: "✕ delete",
  ui_upload_failed: "Upload failed",
  ui_reorder_failed: "Failed to save order",
  ui_just_now: "just now",
  ui_m_ago: "{n}m ago",
  ui_h_ago: "{n}h ago",
  ui_d_ago: "{n}d ago",

  // ===== Cover image / attachments =====
  ci_cover_image: "Cover image",
  ci_emoji_ph: "Emoji, e.g. 🏔️",
  ci_replace_image: "Replace image",
  ci_upload_image: "Upload image",
  ci_uploading: "Uploading…",
  ci_use_emoji: "use emoji instead",
  ci_hint: "PNG / JPEG / WebP · ≤ 4 MB · shown on the course card. An image overrides the emoji.",
  at_delete: "Delete attachment",
  at_title: "Supplementary materials",
  at_ai_only: "AI-only",
  at_subtitle:
    "Hidden from learners · fed to the AI assistant for Q&A only · PDF / TXT / Markdown / DOCX ≤ 16 MB",
  at_empty: "No supplementary materials yet — drop a file below.",
  at_uploaded_rel: "uploaded {rel}",
  at_add_file: "+ Add file",
  at_uploading: "Uploading…",
  at_add_hint: "Ingestion runs async — badge moves from pending → ready once vectorized.",
  at_rag_ready: "RAG ready",
  at_rag_failed: "RAG failed",
  at_rag_pending: "RAG pending",

  // ===== Product dashboard (extra) =====
  pd_kpi_satisfaction: "SATISFACTION",
  pd_kpi_ratings: "{n} ratings",
  pd_kpi_no_ratings: "no ratings yet",
  pd_voices_link: "🎙️ Voices",
  pd_voices_link_tooltip: "Clone a sales rep's voice (works across every language)",
  pd_apply: "Apply",
  pd_reporting_window: "REPORTING WINDOW",
  pd_preset_7d: "Last 7d",
  pd_preset_30d: "Last 30d",
  pd_preset_90d: "Last 90d",
  pd_learners_csv: "⬇ Learners CSV",
  pd_learners_csv_tooltip: "Download every learner in this window as CSV",
  pd_qa_archive: "View Q&A archive →",
  pd_rel_just_now: "just now",
  pd_rel_m_ago: "{n}m ago",
  pd_rel_h_ago: "{n}h ago",
  pd_rel_d_ago: "{n}d ago",
  pd_rel_mo_ago: "{n}mo ago",

  // ===== Branding panel =====
  br_title: "Branding",
  br_blurb:
    "These colours and your logo decide how your courses look to agents. Save → every course you publish shifts to match. Leave a colour blank to use the Libretour default.",
  br_field_bg_label: "Page background",
  br_field_bg_hint: "The main page surface behind everything",
  br_field_panel_label: "Block background",
  br_field_panel_hint: "Cards, modules and content blocks",
  br_field_ink_label: "Text",
  br_field_ink_hint: "Headlines and body copy",
  br_field_accent_label: "Highlight",
  br_field_accent_hint: "Buttons, progress bar and links",
  br_save_hint: "After saving, refresh a course page to see the new theme applied everywhere.",
  br_save: "Save branding",
  br_preview: "PREVIEW",
  br_preview_module_title: "Lifts & terrain map",
  br_preview_module_sub: "5 min · sample module",
  br_preview_continue: "Continue",
  br_reset: "Reset to Libretour default",
  br_colour_swatch: "{label} colour swatch",
  br_colour_placeholder: "#hex or blank to reset",
  br_logo_alt: "Operator logo",
  br_logo_none: "No logo yet",
  br_logo_uploading: "Uploading…",
  br_logo_replace: "Replace logo",
  br_logo_upload: "Upload logo",
  br_logo_remove: "remove",
  br_logo_hint: "PNG / SVG · transparent · ≤ 1 MB",
  br_logo_upload_failed: "Upload failed",

  // ===== Supplier dashboard (extra) =====
  sp_breadcrumb: "Supplier · {name}",
  sp_voices_crumb: "{name} · Voices",
  sp_no_access_label: "/ NO ACCESS",
  sp_no_access_title: "You don't have supplier access to this account.",
  sp_no_access_body:
    "Ask your supplier owner to grant you a membership, or contact Libretour support.",
  sp_back_home: "Back to home",
  sp_voices_label: "VOICES",
  sp_voices_blurb:
    "Clone a sales rep's voice (MiniMax) — it becomes available in every course your products publish, in any language. Stock voices are listed for reference.",

  // ===== Learner area =====
  lr_tab_in_progress: "In progress",
  lr_tab_completed: "Completed",
  lr_tab_favorites: "Favorites",
  lr_tab_all: "All courses",
  lr_tab_badges: "Badges",
  lr_search_placeholder: "Search title, supplier, summary…",
  lr_card_updated: "Updated",
  lr_card_modules_progress: "{done} / {total} modules",
  lr_badges_empty: "No badges yet. Complete a course to earn your first.",
  lr_empty_search: "Nothing matches \"{q}\" in this view.",
  lr_empty_in_progress: "You haven't started anything yet. Browse the All tab and dive in.",
  lr_empty_completed: "No completed courses yet — finish a chapter to start earning a badge.",
  lr_empty_favorites: "No favorites yet — tap the ♥ on any card to save it here.",
  lr_empty_all: "Nothing published yet.",

  // Favorite button
  lr_fav_remove: "Remove from favorites",
  lr_fav_add: "Add to favorites",
  lr_fav_saved: "Saved to favorites",
  lr_fav_save: "Save to favorites",

  // Course page
  lr_preview_banner:
    "⚠ PREVIEW MODE — viewing {status} content as a learner. AI-only blocks are hidden, the same as in production.",
  lr_browse_courses: "Browse {name} courses",
  lr_back_to_course_start: "Back to course start",
  lr_module_locked: "locked",
  lr_module_min: "{n} min",
  lr_module_locked_tooltip: "Complete the previous module's quiz to unlock",
  lr_language: "Language",
  lr_draft_label: "DRAFT",
  lr_draft_blurb:
    "This course is auto-drafted from source files and pending operator review. Modules will appear once the operator publishes the parsed content.",
  lr_back_to_courses_arrow: "← Back to courses",

  // Module reader
  lr_pass_quiz_to_continue: "Pass the quiz above to continue.",
  lr_block_image: "Image",
  lr_block_pdf: "Attached PDF",
  lr_voiceover: "Voice-over",

  // Quiz panel
  lr_quiz_passed_chip: "✓ You've passed this chapter's quiz.",
  lr_quiz_heading: "End-of-chapter quiz",
  lr_quiz_instructions: "Answer {n} questions to continue — pass {pass} of {n}.",
  lr_quiz_q_prefix: "Q{n}.",
  lr_quiz_incorrect: "✗ Incorrect.",
  lr_quiz_passed_result: "✓ Passed {score}/{total} — next chapter unlocked",
  lr_quiz_failed_result: "Scored {score}/{total}. Review and try a new set.",
  lr_quiz_answered: "Answered {answered}/{total}",
  lr_quiz_ready: "Ready to submit",
  lr_quiz_try_new: "Try a new set",
  lr_quiz_grading: "Grading…",
  lr_quiz_submit: "Submit answers",
  lr_quiz_submit_failed: "Failed to submit",

  // Feedback widget
  lr_fb_prompt: "How is this training? Share quick feedback →",
  lr_fb_click_to_rate: "click to rate",
  lr_fb_rate_title: "Rate this training",
  lr_fb_dismiss: "dismiss",
  lr_fb_placeholder: "Optional: what worked? what was confusing?",
  lr_fb_thanks: "✓ Thanks — feedback sent",
  lr_fb_pick_star: "Pick a star above to enable Send",
  lr_fb_sending: "Sending…",
  lr_fb_sent: "Sent ✓",
  lr_fb_send: "Send",
  lr_fb_submit_failed: "Failed to submit",
  lr_fb_star_one: "{n} star",
  lr_fb_star_many: "{n} stars",

  // Q&A archive
  qa_breadcrumb: "Q&A archive",
  qa_reporting_window: "REPORTING WINDOW",
  qa_apply: "Apply",
  qa_uncategorized_count: "{n} uncategorized",
  qa_all_categorized: "all categorized",
  qa_themes_heading: "THEMES — {n}",
  qa_all_themes: "All themes",
  qa_theme_question_one: "{n} question",
  qa_theme_question_many: "{n} questions",
  qa_no_themes: "No themes yet — click Refresh themes to categorize.",
  qa_filtered: "Filtered: {label}",
  qa_all_qa: "All Q&A",
  qa_shown_count: "{n} shown · 200 max",
  qa_search_placeholder: "Search question text…",
  qa_uncategorized_badge: "uncategorized",
  qa_empty: "No questions in this window/filter.",

  // ===== Home footer =====
  fo_platform: "PLATFORM",
  fo_browse: "Browse training",
  fo_about: "About",
  fo_contact_link: "Contact",
  fo_legal: "LEGAL",
  fo_terms: "Terms of Service",
  fo_privacy: "Privacy Policy",
  fo_acceptable: "Acceptable Use",
  fo_cookies: "Cookies",
  fo_contact_head: "CONTACT",
  fo_company: "COMPANY",
  fo_country: "New Zealand",
};

export type Dict = typeof en;

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

  // ===== New course / generate-from-document =====
  nc_crumb_new: "新建课程",
  nc_label: "/产品 · 新建课程",
  nc_title: "新建课程",
  nc_tab_ai: "上传资料生成",
  nc_tab_manual: "手动创建",
  nc_manual_sub:
    "填写课程标题和一句话简介。创建后可继续添加模块和内容。新课程默认为草稿。",
  nc_f_title: "标题",
  nc_f_title_hint: "代理商在课程卡片上看到的标题。",
  nc_f_summary: "简介",
  nc_f_summary_hint: "1-2 句话,可选。",
  nc_f_emoji: "表情符号",
  nc_f_emoji_hint: "一个字符。",
  nc_f_est: "预计时长(分钟)",
  nc_f_est_hint: "总阅读时长。",
  nc_f_lang: "主语言",
  nc_f_lang_hint: "源内容所用的语言。",
  nc_create: "创建课程 →",
  nc_cancel: "取消",

  gen_sub:
    "上传宣传册、PPT 或资料表(PDF 或文本)。Claude 会阅读并自动生成结构化课程(模块与内容),你可在发布前编辑。",
  gen_file: "源文件",
  gen_file_pick: "选择 PDF 或文本文件",
  gen_file_hint: "PDF / TXT / Markdown · ≤ 20 MB",
  gen_title_label: "课程标题",
  gen_title_hint: "可选,AI 会进一步完善。",
  gen_title_ph: "例如:Coronet Peak 2026",
  gen_notes_label: "给 AI 的备注",
  gen_notes_hint: "可选,如侧重点、受众、强调内容。",
  gen_notes_ph: "例如:侧重预订与退改政策",
  gen_button: "生成课程 →",
  gen_generating: "正在阅读文档并生成课程…通常需要 20–60 秒。",
  gen_need_file: "请先选择文件。",
  gen_failed: "生成失败",

  // ===== Voices panel =====
  voi_title: "克隆声音",
  voi_sub: "为该供应商录制的声音。每个声音只能朗读你为它指定的语言。",
  voi_disabled: "克隆未启用 — 未配置密钥",
  voi_empty: "还没有克隆声音 — 在下方录制一个。",
  voi_edit: "编辑",
  voi_langs: "适用语言:",
  voi_name_ph: "声音名称,如:Maya — 销售主管",
  voi_g_neutral: "中性",
  voi_g_male: "男声",
  voi_g_female: "女声",
  voi_rec_start: "● 开始录音",
  voi_rec_rerecord: "● 重新录制",
  voi_rec_stop: "■ 停止",
  voi_rec_max: "最长 {n} 分钟",
  voi_recorded: "已录制 {t}",
  voi_save_clone: "保存并克隆",
  voi_cloning: "克隆中…",
  voi_rerecord_btn: "重新录制",
  voi_save_new_rec: "保存新录音",
  voi_discard: "放弃本次",
  voi_save_changes: "保存更改",
  voi_saving: "保存中…",
  voi_cancel: "取消",
  voi_too_short: "录音不足 10 秒 — 多录一点以获得更好的克隆效果。",
  voi_mic_blocked: "麦克风被阻止。请允许麦克风权限后重试。",
  voi_nothing: "没有录到声音,请重试。",
  voi_tip: "录制 10 秒–3 分钟,单人、吐字清晰,无音乐或背景噪音。",
  voi_new_heading: "录制新声音",
  voi_enter_name_first: "请先输入声音名称",
  voi_pick_lang_first: "请至少选择一种语言",

  // ===== Translations panel =====
  tp_title: "语言",
  tp_sub:
    "源语言为 {lang}。启用某语言会翻译整个课程;禁用则对学员隐藏但保留翻译与音频 — 重新启用即时生效。",
  tp_source: "源语言",
  tp_translating: "正在翻译 — 一般课程约需 10–30 秒。",
  tp_enabled_title: "已启用 — 点击可禁用(保留翻译)",
  tp_disabled_title: "已禁用 — 点击可启用(复用已有的 {lang} 翻译)",
  tp_translate_title: "将整个课程翻译为 {lang} 并启用",
  tp_retranslate_title: "重新翻译(覆盖已有翻译)",
  tp_preview_title: "预览 {lang}",

  // ===== Course editor (page + duration + modules) =====
  ed_course_details: "课程详情",
  ed_preview_title: "以学员视角预览课程(草稿也可预览)",
  ed_preview: "预览 →",
  ed_view_live: "查看已发布 →",
  ed_minutes: "分钟",
  ed_status: "状态",
  ed_draft: "草稿",
  ed_published: "已发布",
  ed_save_changes: "保存更改",
  ed_delete_course: "删除课程",
  ed_modules: "模块",
  ed_modules_count: "{n} 个模块 · 拖动 ⠿ 排序",
  ed_voices_title: "克隆销售代表本人的声音 — 可用于你所有产品的所有语言。",
  ed_manage_voices: "🎙️ 管理 / 克隆声音 →",
  ed_new_module_ph: "新模块标题 — 例如:缆车与地形图",
  ed_add_module: "+ 添加模块",
  ed_len_label: "课程时长",
  ed_len_target: "目标 ≤ 20:00 · 最佳约 15:00",
  ed_len_low: "不足 5 分钟 — 可以再补充一些内容。",
  ed_len_good: "时长正合适。",
  ed_len_warn: "超过 15 分钟 — 偏长了,尽量精简或拆分。",
  ed_len_over: "超过 20 分钟 — 强烈建议拆分本课程。",
  ed_len_sweet: "15:00 最佳时长",

  // ===== Course editor — modules / blocks / quiz / audio (editor-modules.tsx) =====
  em_lang_tabs_label: "编辑语言",
  em_block_add_text: "+ 文本",
  em_block_add_image: "+ 图片",
  em_block_add_video: "+ 视频",
  em_block_add_callout: "+ 提示框",
  em_module_title_ph: "模块标题",
  em_module_summary_ph: "模块简介(可选)",
  em_save: "保存",
  em_saved: "已保存",
  em_saving: "保存中…",
  em_delete_module: "删除模块",
  em_delete_module_confirm: "删除该模块及其所有内容块?",
  em_delete_block: "删除内容块",
  em_block_text_ph: "Markdown(**加粗**、*斜体*)",
  em_block_video_ph: "yt:<youtube-id> 或 Cloudflare Stream UID(32 位十六进制)",
  em_block_caption_ph: "说明文字(可选)",
  em_block_training: "提供给 AI 助手用于问答,但在 /learn 中对学员隐藏",
  em_quiz_title: "测验",
  em_quiz_generate: "✨ 生成测验",
  em_quiz_generate_title: "用 AI 根据本模块的文字内容生成 5 道多选题",
  em_quiz_generating: "生成中…",
  em_quiz_q_ph: "题目…",
  em_quiz_choice_a: "选项 A",
  em_quiz_choice_b: "选项 B",
  em_quiz_choice_c: "选项 C(可选)",
  em_quiz_choice_d: "选项 D(可选)",
  em_quiz_explanation_ph: "解析(可选)",
  em_quiz_delete_q: "删除题目",
  em_quiz_add_q: "+ 添加题目",
  em_quiz_correct: "正确答案",
  em_audio_heading: "配音",
  em_audio_generate: "生成音频",
  em_audio_generating: "生成中…",
  em_audio_regenerate: "重新生成",
  em_audio_delete_title: "删除主语言生成的音频(其他语言保留)",
  em_audio_no_text: "没有可朗读的文本。",
  em_no_blocks: "暂无内容块。",
  em_block_image: "图片",
  em_block_video: "视频",
  em_block_text: "文本",
  em_block_callout: "提示框",
  em_drag_reorder: "拖动排序",
  em_no_modules: "还没有模块。在下方添加第一个模块开始吧。",
  em_field_title: "标题",
  em_field_summary: "简介",
  em_field_minutes: "分钟",
  em_save_module: "保存模块",
  em_no_blocks_add: "还没有内容块 — 在下方添加一个。",
  em_add_block_text: "+ 添加文本块",
  em_add_block_callout: "+ 添加提示框",
  em_add_block_video: "+ 添加视频块",
  em_add_block_image: "+ 添加图片块",
  em_block_tip:
    "💡 把每个{text}块写成一个完整连贯的段落(2–5 句)— 阅读体验更好,配音也更自然。用{callout}突出单条重点,每个独立条目(如每档价格)单独成块。一句一块会让音频显得断断续续。",
  em_block_tip_text: "文本",
  em_block_tip_callout: "提示框",
  em_quiz_heading: "章末测验",
  em_quiz_count_one: "({n} 道题 · 学员随机看到 3 道)",
  em_quiz_count_many: "({n} 道题 · 学员随机看到 3 道)",
  em_quiz_gen5: "✨ 根据内容生成 5 道",
  em_quiz_empty: "还没有题目 — 在你添加之前,学员将使用默认的停留 30 秒即完成方式。",
  em_quiz_add_short: "+ 添加",
  em_ai_only: "仅 AI",
  em_ai_only_hide: "仅 AI(对学员隐藏)",
  em_save_block: "保存内容块",
  em_audio_one_per_lang: "每种可用语言一行",
  em_audio_primary_suffix: " · 主语言",
  em_audio_not_generated: "未生成",
  em_audio_gen_short: "生成",
  em_audio_clear_primary: "清除主语言音频",
  em_gen_failed: "生成失败",
  em_img_none: "暂无图片 — 在下方选择文件",
  em_uploading: "上传中…",
  em_replace_image: "替换图片",
  em_choose_image: "选择图片",
  em_img_formats: "PNG / JPEG / WebP / GIF · 最大 8 MB",
  em_block_delete_short: "✕ 删除",
  ui_upload_failed: "上传失败",
  ui_reorder_failed: "保存排序失败",
  ui_just_now: "刚刚",
  ui_m_ago: "{n} 分钟前",
  ui_h_ago: "{n} 小时前",
  ui_d_ago: "{n} 天前",

  // ===== Cover image / attachments =====
  ci_cover_image: "封面图",
  ci_emoji_ph: "表情符号,例如 🏔️",
  ci_replace_image: "替换图片",
  ci_upload_image: "上传图片",
  ci_uploading: "上传中…",
  ci_use_emoji: "改用表情符号",
  ci_hint: "PNG / JPEG / WebP · ≤ 4 MB · 显示在课程卡片上。图片会覆盖表情符号。",
  at_delete: "删除附件",
  at_title: "补充资料",
  at_ai_only: "仅 AI",
  at_subtitle:
    "对学员隐藏 · 仅供 AI 助手问答使用 · PDF / TXT / Markdown / DOCX ≤ 16 MB",
  at_empty: "还没有补充资料 — 在下方添加文件。",
  at_uploaded_rel: "上传于 {rel}",
  at_add_file: "+ 添加文件",
  at_uploading: "上传中…",
  at_add_hint: "向量化在后台异步进行 — 完成后徽章会从「待处理」变为「就绪」。",
  at_rag_ready: "RAG 就绪",
  at_rag_failed: "RAG 失败",
  at_rag_pending: "RAG 待处理",

  // ===== Product dashboard (extra) =====
  pd_kpi_satisfaction: "满意度",
  pd_kpi_ratings: "{n} 条评分",
  pd_kpi_no_ratings: "暂无评分",
  pd_voices_link: "🎙️ 声音",
  pd_voices_link_tooltip: "克隆销售代表的声音(适用于所有语言)",
  pd_apply: "应用",
  pd_reporting_window: "统计区间",
  pd_preset_7d: "近 7 天",
  pd_preset_30d: "近 30 天",
  pd_preset_90d: "近 90 天",
  pd_learners_csv: "⬇ 导出学员 CSV",
  pd_learners_csv_tooltip: "将该区间内全部学员导出为 CSV",
  pd_qa_archive: "查看问答存档 →",
  pd_rel_just_now: "刚刚",
  pd_rel_m_ago: "{n} 分钟前",
  pd_rel_h_ago: "{n} 小时前",
  pd_rel_d_ago: "{n} 天前",
  pd_rel_mo_ago: "{n} 个月前",

  // ===== Branding panel =====
  br_title: "品牌外观",
  br_blurb:
    "这些颜色和你的 Logo 决定了课程在代理眼中的样式。保存后,你发布的每门课程都会随之更新。某个颜色留空则使用 Libretour 默认值。",
  br_field_bg_label: "页面背景",
  br_field_bg_hint: "所有内容背后的主页面底色",
  br_field_panel_label: "区块背景",
  br_field_panel_hint: "卡片、模块和内容区块",
  br_field_ink_label: "文字",
  br_field_ink_hint: "标题与正文",
  br_field_accent_label: "强调色",
  br_field_accent_hint: "按钮、进度条和链接",
  br_save_hint: "保存后,刷新任意课程页面即可看到新主题已全面生效。",
  br_save: "保存品牌外观",
  br_preview: "预览",
  br_preview_module_title: "缆车与地形图",
  br_preview_module_sub: "5 分钟 · 示例模块",
  br_preview_continue: "继续",
  br_reset: "恢复 Libretour 默认",
  br_colour_swatch: "{label}取色器",
  br_colour_placeholder: "#十六进制,留空则重置",
  br_logo_alt: "产品 Logo",
  br_logo_none: "尚未上传 Logo",
  br_logo_uploading: "上传中…",
  br_logo_replace: "替换 Logo",
  br_logo_upload: "上传 Logo",
  br_logo_remove: "移除",
  br_logo_hint: "PNG / SVG · 透明底 · ≤ 1 MB",
  br_logo_upload_failed: "上传失败",

  // ===== Supplier dashboard (extra) =====
  sp_breadcrumb: "供应商 · {name}",
  sp_voices_crumb: "{name} · 声音",
  sp_no_access_label: "/ 无访问权限",
  sp_no_access_title: "你没有该账户的供应商访问权限。",
  sp_no_access_body:
    "请联系你的供应商管理员为你开通权限,或联系 Libretour 支持团队。",
  sp_back_home: "返回首页",
  sp_voices_label: "声音",
  sp_voices_blurb:
    "克隆销售代表的声音(MiniMax)— 它将可用于你旗下产品发布的每一门课程,支持任意语言。库存声音仅供参考。",

  // ===== Learner area =====
  lr_tab_in_progress: "学习中",
  lr_tab_completed: "已完成",
  lr_tab_favorites: "收藏",
  lr_tab_all: "全部课程",
  lr_tab_badges: "徽章",
  lr_search_placeholder: "搜索课程标题、供应商、简介…",
  lr_card_updated: "有更新",
  lr_card_modules_progress: "{done} / {total} 个模块",
  lr_badges_empty: "还没有徽章。完成一门课程即可获得第一枚。",
  lr_empty_search: "当前视图中没有匹配「{q}」的内容。",
  lr_empty_in_progress: "你还没有开始任何课程。去「全部课程」看看,挑一门开始吧。",
  lr_empty_completed: "还没有完成的课程 — 完成一个章节,开始赢取徽章。",
  lr_empty_favorites: "还没有收藏 — 点击任意卡片上的 ♥ 即可收藏到这里。",
  lr_empty_all: "暂无已发布的课程。",

  // Favorite button
  lr_fav_remove: "取消收藏",
  lr_fav_add: "加入收藏",
  lr_fav_saved: "已收藏",
  lr_fav_save: "收藏",

  // Course page
  lr_preview_banner:
    "⚠ 预览模式 — 正以学员视角查看{status}内容。仅 AI 可见的内容块已隐藏,与正式环境一致。",
  lr_browse_courses: "浏览 {name} 的课程",
  lr_back_to_course_start: "返回课程起点",
  lr_module_locked: "已锁定",
  lr_module_min: "{n} 分钟",
  lr_module_locked_tooltip: "通过上一模块的测验后解锁",
  lr_language: "语言",
  lr_draft_label: "草稿",
  lr_draft_blurb:
    "本课程由源文件自动生成草稿,正在等待运营商审核。运营商发布解析内容后,模块将会出现。",
  lr_back_to_courses_arrow: "← 返回课程列表",

  // Module reader
  lr_pass_quiz_to_continue: "通过上方的测验后才能继续。",
  lr_block_image: "图片",
  lr_block_pdf: "附件 PDF",
  lr_voiceover: "配音",

  // Quiz panel
  lr_quiz_passed_chip: "✓ 你已通过本章测验。",
  lr_quiz_heading: "章末测验",
  lr_quiz_instructions: "回答 {n} 道题即可继续 — {n} 道中答对 {pass} 道。",
  lr_quiz_q_prefix: "第 {n} 题.",
  lr_quiz_incorrect: "✗ 回答错误。",
  lr_quiz_passed_result: "✓ 已通过 {score}/{total} — 下一章已解锁",
  lr_quiz_failed_result: "得分 {score}/{total}。回顾后换一组题再试。",
  lr_quiz_answered: "已回答 {answered}/{total}",
  lr_quiz_ready: "可以提交了",
  lr_quiz_try_new: "换一组题",
  lr_quiz_grading: "评分中…",
  lr_quiz_submit: "提交答案",
  lr_quiz_submit_failed: "提交失败",

  // Feedback widget
  lr_fb_prompt: "这次培训怎么样?分享你的快速反馈 →",
  lr_fb_click_to_rate: "点击评分",
  lr_fb_rate_title: "为本次培训评分",
  lr_fb_dismiss: "关闭",
  lr_fb_placeholder: "可选:哪里有帮助?哪里让你困惑?",
  lr_fb_thanks: "✓ 谢谢 — 反馈已提交",
  lr_fb_pick_star: "请先在上方选择星级以启用发送",
  lr_fb_sending: "发送中…",
  lr_fb_sent: "已发送 ✓",
  lr_fb_send: "发送",
  lr_fb_submit_failed: "提交失败",
  lr_fb_star_one: "{n} 星",
  lr_fb_star_many: "{n} 星",

  // Q&A archive
  qa_breadcrumb: "问答存档",
  qa_reporting_window: "统计区间",
  qa_apply: "应用",
  qa_uncategorized_count: "{n} 条未分类",
  qa_all_categorized: "已全部分类",
  qa_themes_heading: "主题 — {n}",
  qa_all_themes: "全部主题",
  qa_theme_question_one: "{n} 个问题",
  qa_theme_question_many: "{n} 个问题",
  qa_no_themes: "暂无主题 — 点击「刷新主题」进行分类。",
  qa_filtered: "已筛选:{label}",
  qa_all_qa: "全部问答",
  qa_shown_count: "显示 {n} 条 · 最多 200 条",
  qa_search_placeholder: "搜索问题内容…",
  qa_uncategorized_badge: "未分类",
  qa_empty: "该区间/筛选下暂无问题。",

  // ===== Home footer =====
  fo_platform: "平台",
  fo_browse: "浏览培训",
  fo_about: "关于",
  fo_contact_link: "联系",
  fo_legal: "法律",
  fo_terms: "服务条款",
  fo_privacy: "隐私政策",
  fo_acceptable: "可接受使用政策",
  fo_cookies: "Cookie 政策",
  fo_contact_head: "联系方式",
  fo_company: "公司",
  fo_country: "新西兰",
};

export const dict: Record<Locale, Dict> = {
  en,
  "zh-CN": zhCN,
};

// `fmt` is re-exported from ./i18n-shared so server + client can use the same helper.
