import Link from "next/link";
import { listOperatorsWithCourseCounts } from "@/lib/db";
import { TopBar } from "./_components/top-bar";
import { AskAI } from "./_components/ask-ai";
import { t, fmt } from "@/lib/i18n";
import { getCurrentRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

/**
 * Libretour platform — light theme. Tokens:
 *   bg            #ffffff  (page)
 *   bg-soft       #f9fafb  (sticky header w/ blur, very faint hero glow)
 *   panel         #ffffff  (card surface, on a light slate-200 border)
 *   line          #e5e7eb  (slate-200)
 *   ink           #0f172a  (slate-900) — primary text
 *   ink-muted     #475569  (slate-600) — secondary text
 *   ink-faint     #64748b  (slate-500) — tertiary
 *   accent        #059669  (emerald-600) — primary CTA, links
 *   accent-deep   #047857  (emerald-700) — hover
 *   accent-soft   #ecfdf5  (emerald-50)  — accent backgrounds
 */
export default async function Home() {
  const [operators, tr, role] = await Promise.all([
    listOperatorsWithCourseCounts(),
    t(),
    getCurrentRole(),
  ]);
  const totalCourses = operators.reduce((s, o) => s + o.course_count, 0);
  const manageableSlugs = new Set(
    role.isAdmin
      ? operators.map((o) => o.slug)
      : role.operators.map((o) => o.operator_slug),
  );

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased text-[16px]">
      <TopBar />

      {/* Hero with AI bar */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 -z-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(16,185,129,0.08) 0%, transparent 60%), radial-gradient(ellipse 50% 50% at 100% 30%, rgba(132,204,22,0.05) 0%, transparent 60%), radial-gradient(ellipse 50% 50% at 0% 80%, rgba(20,184,166,0.05) 0%, transparent 60%)",
          }}
        />
        <div className="relative px-5 sm:px-6 pt-16 sm:pt-24 pb-12 sm:pb-16 text-center max-w-4xl mx-auto">
          <div className="inline-flex flex-wrap items-center justify-center gap-2 mb-6 sm:mb-7">
            <span className="px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[12px] sm:text-[13px] font-medium">
              {fmt(tr.hero_live_chip, { operators: operators.length, courses: totalCourses })}
            </span>
            <span className="px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-slate-600 text-[12px] sm:text-[13px] font-medium">
              {tr.hero_lang_chip}
            </span>
          </div>
          <h1 className="text-[36px] sm:text-[48px] md:text-[64px] leading-[1.1] sm:leading-[1.05] font-semibold tracking-tight text-slate-900">
            {tr.hero_title_a}{" "}
            <span className="bg-gradient-to-br from-emerald-600 via-emerald-500 to-lime-500 bg-clip-text text-transparent">
              {tr.hero_title_b}
            </span>
          </h1>
          <p className="mt-5 sm:mt-6 text-[15px] sm:text-[17px] md:text-[19px] text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {tr.hero_subtitle}
          </p>

          {/* AI ask bar */}
          <div className="mt-9 sm:mt-12">
            <AskAI
              variant="hero"
              placeholder={tr.hero_ask_placeholder}
              examples={[tr.hero_example_1, tr.hero_example_2, tr.hero_example_3]}
              askLabel={tr.hero_ask_button}
              thinkingText={tr.ai_thinking_inline}
              noAnswerWarning={tr.ai_no_answer_inline}
            />
          </div>
        </div>
      </section>

      {/* Operator marketplace */}
      <section className="px-5 sm:px-8 pb-16 sm:pb-20 max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-5 sm:mb-7 gap-3">
          <div className="min-w-0">
            <h2 className="text-[20px] sm:text-[24px] font-semibold text-slate-900">
              {tr.featured_operators}
            </h2>
            <p className="text-[13px] sm:text-[15px] text-slate-600 mt-1 sm:mt-1.5">
              {tr.featured_operators_subtitle}
            </p>
          </div>
          <a className="text-[13px] sm:text-[15px] text-emerald-700 hover:text-emerald-800 font-medium whitespace-nowrap shrink-0">
            {fmt(tr.view_all_count, { n: operators.length })}
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {operators.map((op) => (
            <OperatorCard
              key={op.id}
              op={op}
              tr={tr}
              canManage={manageableSlugs.has(op.slug)}
            />
          ))}
        </div>

        {/* Value props strip */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <ValueProp
            badge={tr.value_for_agents_badge}
            badgeClass="bg-emerald-50 text-emerald-700 border-emerald-200"
            text={tr.value_for_agents}
          />
          <ValueProp
            badge={tr.value_for_operators_badge}
            badgeClass="bg-lime-50 text-lime-700 border-lime-200"
            text={tr.value_for_operators}
          />
          <ValueProp
            badge={tr.value_ai_badge}
            badgeClass="bg-slate-50 text-slate-700 border-slate-200"
            text={tr.value_ai}
          />
        </div>
      </section>

      <footer className="border-t border-slate-200 px-5 sm:px-8 py-8 mt-12">
        <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-[12.5px]">
          <div>
            <div className="text-[10px] tracking-widest font-mono text-emerald-700/70 mb-2">PLATFORM</div>
            <ul className="space-y-1.5 text-slate-600">
              <li><Link href="/learn" className="hover:text-slate-900">Browse training</Link></li>
              <li><Link href="/about" className="hover:text-slate-900">About</Link></li>
              <li><Link href="/contact" className="hover:text-slate-900">Contact</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-[10px] tracking-widest font-mono text-emerald-700/70 mb-2">LEGAL</div>
            <ul className="space-y-1.5 text-slate-600">
              <li><Link href="/legal/terms" className="hover:text-slate-900">Terms of Service</Link></li>
              <li><Link href="/legal/privacy" className="hover:text-slate-900">Privacy Policy</Link></li>
              <li><Link href="/legal/acceptable-use" className="hover:text-slate-900">Acceptable Use</Link></li>
              <li><Link href="/legal/cookies" className="hover:text-slate-900">Cookies</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-[10px] tracking-widest font-mono text-emerald-700/70 mb-2">CONTACT</div>
            <ul className="space-y-1.5 text-slate-600">
              <li><a href="mailto:hello@libretour.com" className="hover:text-slate-900">hello@libretour.com</a></li>
              <li><a href="mailto:support@libretour.com" className="hover:text-slate-900">support@libretour.com</a></li>
              <li><a href="mailto:privacy@libretour.com" className="hover:text-slate-900">privacy@libretour.com</a></li>
            </ul>
          </div>
          <div>
            <div className="text-[10px] tracking-widest font-mono text-emerald-700/70 mb-2">COMPANY</div>
            <p className="text-slate-600 leading-relaxed">
              Libretour Limited
              <br />
              <span className="text-slate-400">NZBN [TBD-NZBN]</span>
              <br />
              <span className="text-slate-400">[TBD-registered-address]</span>
              <br />
              New Zealand
            </p>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-8 pt-5 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
          <div className="text-[11px] font-mono text-slate-400">
            {fmt(tr.footer_build, { operators: operators.length, courses: totalCourses })}
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            © {new Date().getFullYear()} Libretour Limited
          </div>
        </div>
      </footer>
    </div>
  );
}

// ============================================================================
//  Subcomponents
// ============================================================================

function OperatorCard({
  op,
  tr,
  canManage,
}: {
  op: Awaited<ReturnType<typeof listOperatorsWithCourseCounts>>[number];
  tr: Awaited<ReturnType<typeof t>>;
  canManage: boolean;
}) {
  const hasCourses = op.course_count > 0;
  // Operator cover gradients stay as-is — they're each operator's brand
  // signature and survive a light page background by virtue of the dark cover
  // tile that sits inside an otherwise white card.
  const cover = op.cover_color ?? "linear-gradient(135deg,#475569 0%,#64748b 100%)";
  const coursesLabel =
    op.course_count === 1
      ? fmt(tr.card_courses_count, { n: op.course_count })
      : fmt(tr.card_courses_count_plural, { n: op.course_count });

  const targetHref =
    hasCourses && op.sample_course_slug
      ? `/learn/${op.slug}/${op.sample_course_slug}`
      : null;

  return (
    <article className="rounded-2xl overflow-hidden bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-[0_8px_32px_rgba(15,23,42,0.08)] transition h-full relative">
      <div className="h-32 relative" style={{ background: cover }}>
        <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5">
          {hasCourses ? (
            <span className="px-2.5 py-1 rounded-full bg-black/35 backdrop-blur-sm text-[11px] font-medium text-emerald-200 border border-white/15">
              {tr.card_live}
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full bg-black/35 backdrop-blur-sm text-[11px] font-medium text-white/80 border border-white/15">
              {tr.card_coming_soon}
            </span>
          )}
        </div>
        {canManage ? (
          <Link
            href={`/product/${op.slug}`}
            className="absolute top-3.5 right-3.5 z-10 px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-semibold hover:bg-emerald-700 shadow"
          >
            ⚙ Manage
          </Link>
        ) : null}
        <div className="absolute bottom-3.5 left-4 right-4 flex items-end justify-between">
          <div className="text-[36px] leading-none drop-shadow">{op.emoji ?? "📚"}</div>
        </div>
      </div>
      <div className="p-5">
        <div className="text-[13px] text-slate-500 mb-1">{op.name}</div>
        <div className="font-semibold text-[17px] text-slate-900 leading-snug line-clamp-2">
          {op.sample_course_title ?? tr.card_curriculum_coming_soon}
        </div>
        <div className="flex items-center gap-2.5 mt-3.5 text-[13px] text-slate-500">
          <span>{coursesLabel}</span>
          {op.module_count > 0 ? (
            <>
              <span className="text-slate-300">·</span>
              <span>{fmt(tr.card_modules_count, { n: op.module_count })}</span>
            </>
          ) : null}
          {op.est_minutes > 0 ? (
            <>
              <span className="text-slate-300">·</span>
              <span>{fmt(tr.card_minutes, { n: op.est_minutes })}</span>
            </>
          ) : null}
        </div>
      </div>
      {/* Whole-card hit area: anchor positioned absolutely under the Manage
          pill so the pill stays clickable. Card uses z-stacking so the
          Manage button (z-10) sits above the link surface (z-0). */}
      {targetHref ? (
        <Link
          href={targetHref}
          aria-label={op.sample_course_title ?? op.name}
          className="absolute inset-0 z-0 cursor-pointer"
        />
      ) : null}
    </article>
  );
}

function ValueProp({
  badge,
  badgeClass,
  text,
}: {
  badge: string;
  badgeClass: string;
  text: string;
}) {
  return (
    <div>
      <span
        className={`inline-block px-2.5 py-1 rounded-full border text-[12px] font-medium mb-3 ${badgeClass}`}
      >
        {badge}
      </span>
      <p className="text-[15px] text-slate-700 leading-relaxed">{text}</p>
    </div>
  );
}
