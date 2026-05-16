import Link from "next/link";
import { listOperatorsWithCourseCounts } from "@/lib/db";
import { TopBar } from "./_components/top-bar";

export const dynamic = "force-dynamic";

/**
 * Dark-green tech palette. Tokens:
 *   --bg          #04241e  (page)
 *   --bg-soft     #062b22  (sticky header w/ blur)
 *   --panel       #0a3a2f  (card surface)
 *   --panel-hover #0e4738
 *   --line        rgba(255,255,255,.08)
 *   --line-hover  rgba(52,211,153,.4)
 *   --ink         #f0fdf4  (high-contrast text)
 *   --ink-muted   #a7d4b6
 *   --ink-faint   #6b9981
 *   --accent      #34d399 (emerald-400)
 *   --accent-deep #10b981
 *   --lime        #bef264
 */
export default async function Home() {
  const operators = await listOperatorsWithCourseCounts();
  const totalCourses = operators.reduce((s, o) => s + o.course_count, 0);

  return (
    <div className="min-h-screen bg-[#04241e] text-[#f0fdf4] font-sans antialiased text-[16px]">
      <TopBar />

      {/* Hero with AI bar */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 -z-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(52,211,153,0.12) 0%, transparent 60%), radial-gradient(ellipse 50% 50% at 100% 30%, rgba(190,242,100,0.06) 0%, transparent 60%), radial-gradient(ellipse 50% 50% at 0% 80%, rgba(20,184,166,0.08) 0%, transparent 60%)",
          }}
        />
        <div className="relative px-5 sm:px-6 pt-16 sm:pt-24 pb-12 sm:pb-16 text-center max-w-4xl mx-auto">
          <div className="inline-flex flex-wrap items-center justify-center gap-2 mb-6 sm:mb-7">
            <span className="px-3 py-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/30 text-emerald-300 text-[12px] sm:text-[13px] font-medium">
              ● Live · {operators.length} operators · {totalCourses} courses
            </span>
            <span className="px-3 py-1.5 rounded-full bg-white/[.04] border border-white/[.08] text-[#c4e9d3] text-[12px] sm:text-[13px] font-medium">
              🌐 7 languages · AI answers in 30+
            </span>
          </div>
          <h1 className="text-[36px] sm:text-[48px] md:text-[64px] leading-[1.1] sm:leading-[1.05] font-semibold tracking-tight text-white">
            Sell New Zealand with{" "}
            <span className="bg-gradient-to-br from-emerald-300 via-emerald-400 to-lime-300 bg-clip-text text-transparent">
              confidence.
            </span>
          </h1>
          <p className="mt-5 sm:mt-6 text-[15px] sm:text-[17px] md:text-[19px] text-[#a7d4b6] max-w-2xl mx-auto leading-relaxed">
            The B2B training & certification platform for the NZ tourism industry. Learn directly
            from operators. Earn verifiable digital badges. Ask AI anything — in any language.
          </p>

          {/* AI ask bar */}
          <div className="mt-9 sm:mt-12 max-w-2xl mx-auto rounded-2xl border border-white/[.08] bg-[#0a3a2f]/80 backdrop-blur shadow-[0_4px_24px_rgba(0,0,0,.25),0_1px_0_rgba(255,255,255,.04)_inset] p-3 sm:p-4">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-9 h-9 sm:w-11 sm:h-11 shrink-0 rounded-lg bg-emerald-400/15 border border-emerald-400/30 flex items-center justify-center">
                <SparkleIcon />
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="text-[12px] sm:text-[13px] text-[#86b69a] mb-1">Ask the agent assistant</div>
                <input
                  className="w-full bg-transparent text-[14px] sm:text-[16px] text-white outline-none placeholder:text-[#5d9279]"
                  placeholder="What's the difference between Coronet Peak and The Remarkables?"
                />
              </div>
              <button className="self-stretch px-3 sm:px-5 rounded-md bg-emerald-400 text-[#04241e] font-semibold hover:bg-emerald-300 text-[13px] sm:text-[14px]">
                Ask
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-3 sm:mt-4 sm:pl-[60px]">
              <Chip>Try: 客户问 Heli Privates 适合什么水平?</Chip>
              <Chip>Mt Cook hotel room with Mt Cook view?</Chip>
              <Chip>Milford Sound vs Doubtful Sound</Chip>
            </div>
          </div>
        </div>
      </section>

      {/* Operator marketplace */}
      <section className="px-5 sm:px-8 pb-16 sm:pb-20 max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-5 sm:mb-7 gap-3">
          <div className="min-w-0">
            <h2 className="text-[20px] sm:text-[24px] font-semibold text-white">Featured operators</h2>
            <p className="text-[13px] sm:text-[15px] text-[#a7d4b6] mt-1 sm:mt-1.5">
              Each operator brings their own course curriculum. One agent account, every NZ
              operator.
            </p>
          </div>
          <a className="text-[13px] sm:text-[15px] text-emerald-300 hover:text-emerald-200 font-medium whitespace-nowrap shrink-0">
            View all {operators.length} →
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {operators.map((op) => (
            <OperatorCard key={op.id} op={op} />
          ))}
        </div>

        {/* Value props strip */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <ValueProp
            badge="For agents"
            badgeClass="bg-emerald-400/10 text-emerald-300 border-emerald-400/30"
            text="One account, every NZ operator. Earn verifiable badges to share on LinkedIn and email signatures."
          />
          <ValueProp
            badge="For operators"
            badgeClass="bg-lime-400/10 text-lime-300 border-lime-400/30"
            text="Upload your existing PDFs and decks — we extract, structure, and turn them into trainable courses."
          />
          <ValueProp
            badge="AI-native"
            badgeClass="bg-white/[.04] text-[#c4e9d3] border-white/[.10]"
            text="Agents can ask product questions in plain English or Chinese. Answers cite the operator source."
          />
        </div>
      </section>

      <footer className="border-t border-white/[.06] px-8 py-7 text-center text-[12px] font-mono text-[#5d9279]">
        TourTrain · d4 build · {operators.length} operators / {totalCourses} courses live
      </footer>
    </div>
  );
}

// ============================================================================
//  Subcomponents
// ============================================================================

function OperatorCard({
  op,
}: {
  op: Awaited<ReturnType<typeof listOperatorsWithCourseCounts>>[number];
}) {
  const hasCourses = op.course_count > 0;
  const cover = op.cover_color ?? "linear-gradient(135deg,#475569 0%,#64748b 100%)";

  const inner = (
    <article className="rounded-2xl overflow-hidden bg-[#0a3a2f] border border-white/[.08] hover:border-emerald-400/40 hover:shadow-[0_8px_32px_rgba(52,211,153,0.10)] transition cursor-pointer h-full">
      <div className="h-32 relative" style={{ background: cover }}>
        <div className="absolute top-3.5 left-3.5">
          {hasCourses ? (
            <span className="px-2.5 py-1 rounded-full bg-black/35 backdrop-blur-sm text-[11px] font-medium text-emerald-200 border border-white/15">
              ● Live
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full bg-black/35 backdrop-blur-sm text-[11px] font-medium text-white/80 border border-white/15">
              Coming soon
            </span>
          )}
        </div>
        <div className="absolute bottom-3.5 left-4 right-4 flex items-end justify-between">
          <div className="text-[36px] leading-none drop-shadow">{op.emoji ?? "📚"}</div>
        </div>
      </div>
      <div className="p-5">
        <div className="text-[13px] text-[#86b69a] mb-1">{op.name}</div>
        <div className="font-semibold text-[17px] text-white leading-snug line-clamp-2">
          {op.sample_course_title ?? "Course curriculum coming soon"}
        </div>
        <div className="flex items-center gap-2.5 mt-3.5 text-[13px] text-[#86b69a]">
          <span>🎓 {op.course_count} course{op.course_count === 1 ? "" : "s"}</span>
          {op.module_count > 0 ? (
            <>
              <span className="text-white/20">·</span>
              <span>{op.module_count} modules</span>
            </>
          ) : null}
          {op.est_minutes > 0 ? (
            <>
              <span className="text-white/20">·</span>
              <span>~{op.est_minutes} min</span>
            </>
          ) : null}
        </div>
      </div>
    </article>
  );

  if (hasCourses && op.sample_course_slug) {
    return (
      <Link href={`/learn/${op.slug}/${op.sample_course_slug}`} className="block h-full">
        {inner}
      </Link>
    );
  }
  return <div>{inner}</div>;
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
      <p className="text-[15px] text-[#c4e9d3] leading-relaxed">{text}</p>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2.5 py-1 rounded-full bg-white/[.04] border border-white/[.08] text-[#c4e9d3] text-[12px]">
      {children}
    </span>
  );
}

function SparkleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3l1.8 4.7L18 9.5l-4.2 1.8L12 16l-1.8-4.7L6 9.5l4.2-1.8L12 3z"
        fill="#34d399"
        stroke="#10b981"
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
