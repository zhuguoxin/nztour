import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { listOperatorsWithCourseCounts } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Home() {
  const operators = await listOperatorsWithCourseCounts();
  const totalCourses = operators.reduce((s, o) => s + o.course_count, 0);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased">
      {/* Top bar */}
      <header className="border-b border-slate-200/80 px-7 py-3.5 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur z-10">
        <div className="flex items-center gap-2">
          <Logo />
          <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] tracking-widest font-mono text-emerald-700 bg-emerald-50 border border-emerald-100">
            NZ · MVP
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-1 text-[13px] text-slate-600">
          <a className="px-3 py-1.5 hover:text-slate-900">Explore</a>
          <a className="px-3 py-1.5 hover:text-slate-900">Operators</a>
          <a className="px-3 py-1.5 hover:text-slate-900">Badges</a>
          <a className="px-3 py-1.5 hover:text-slate-900">Pricing</a>
        </nav>

        <div className="flex items-center gap-2 text-xs">
          <LangPicker />
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="px-3 py-1.5 rounded-md text-slate-700 hover:bg-slate-100 text-[13px]">
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="px-3 py-1.5 rounded-md bg-emerald-600 text-white font-medium hover:bg-emerald-700 text-[13px]">
                Get certified
              </button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <Link
              href="/learn"
              className="px-3 py-1.5 rounded-md bg-emerald-600 text-white font-medium hover:bg-emerald-700 text-[13px]"
            >
              Go to learning →
            </Link>
            <UserButton appearance={{ variables: { colorPrimary: "#059669" } }} />
          </Show>
        </div>
      </header>

      {/* Hero with AI bar */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 -z-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(16,185,129,0.08) 0%, transparent 60%), radial-gradient(ellipse 50% 50% at 100% 50%, rgba(132,204,22,0.05) 0%, transparent 60%)",
          }}
        />
        <div className="relative px-6 pt-20 pb-12 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-5">
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-medium">
              ● Live · {operators.length} operators · {totalCourses} courses
            </span>
            <span className="px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-600 text-[11px] font-medium">
              🌐 7 languages · AI answers in 30+
            </span>
          </div>
          <h1 className="text-[44px] leading-[1.1] font-semibold tracking-tight text-slate-900">
            Sell New Zealand with{" "}
            <span className="bg-gradient-to-br from-emerald-500 to-lime-500 bg-clip-text text-transparent">
              confidence.
            </span>
          </h1>
          <p className="mt-4 text-[15px] text-slate-600 max-w-2xl mx-auto">
            The B2B training & certification platform for the NZ tourism industry. Learn directly
            from operators. Earn verifiable digital badges. Ask AI anything — in any language.
          </p>

          {/* AI ask bar */}
          <div className="mt-9 max-w-2xl mx-auto rounded-2xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.06)] p-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 shrink-0 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                <SparkleIcon />
              </div>
              <div className="flex-1 text-left">
                <div className="text-[12px] text-slate-500 mb-0.5">Ask the agent assistant</div>
                <input
                  className="w-full bg-transparent text-[14px] outline-none placeholder:text-slate-400"
                  placeholder="e.g. What's the difference between Coronet Peak and The Remarkables?"
                />
              </div>
              <button className="self-stretch px-3.5 rounded-md bg-emerald-600 text-white font-medium hover:bg-emerald-700 text-[13px]">
                Ask
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3 pl-12">
              <Chip>Try: 客户问 Heli Privates 适合什么水平?</Chip>
              <Chip>Mt Cook hotel room with Mt Cook view?</Chip>
              <Chip>Milford Sound vs Doubtful Sound</Chip>
            </div>
          </div>
        </div>
      </section>

      {/* Operator marketplace */}
      <section className="px-6 pb-16 max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Featured operators</h2>
            <p className="text-[13px] text-slate-500 mt-0.5">
              Each operator brings their own course curriculum. One agent account, every NZ
              operator.
            </p>
          </div>
          <a className="text-[13px] text-emerald-700 hover:text-emerald-800 font-medium">
            View all {operators.length} →
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {operators.map((op) => (
            <OperatorCard key={op.id} op={op} />
          ))}
        </div>

        {/* Value props strip */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
          <ValueProp
            badge="For agents"
            badgeClass="bg-emerald-50 text-emerald-700 border-emerald-200"
            text="One account, every NZ operator. Earn verifiable badges to share on LinkedIn and email signatures."
          />
          <ValueProp
            badge="For operators"
            badgeClass="bg-lime-50 text-lime-700 border-lime-200"
            text="Upload your existing PDFs and decks — we extract, structure, and turn them into trainable courses."
          />
          <ValueProp
            badge="AI-native"
            badgeClass="bg-slate-50 text-slate-700 border-slate-200"
            text="Agents can ask product questions in plain English or Chinese. Answers cite the operator source."
          />
        </div>
      </section>

      <footer className="border-t border-slate-200 px-6 py-6 text-center text-[11px] font-mono text-slate-400">
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
  const cover =
    op.cover_color ?? "linear-gradient(135deg,#475569 0%,#64748b 100%)";

  const inner = (
    <article className="rounded-xl overflow-hidden bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-[0_4px_20px_rgba(16,185,129,0.08)] transition cursor-pointer h-full">
      <div className="h-28 relative" style={{ background: cover }}>
        <div className="absolute top-3 left-3">
          {hasCourses ? (
            <span className="px-2 py-0.5 rounded-full bg-white/85 backdrop-blur text-[10px] font-medium text-emerald-700 border border-white/50">
              ● Live
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-white/85 backdrop-blur text-[10px] font-medium text-slate-600 border border-white/50">
              Coming soon
            </span>
          )}
        </div>
        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between text-white/90">
          <div className="text-3xl drop-shadow-sm">{op.emoji ?? "📚"}</div>
        </div>
      </div>
      <div className="p-4">
        <div className="text-[12px] text-slate-500 mb-0.5">{op.name}</div>
        <div className="font-semibold text-[15px] text-slate-900 leading-snug line-clamp-2">
          {op.sample_course_title ?? "Course curriculum coming soon"}
        </div>
        <div className="flex items-center gap-2 mt-3 text-[12px] text-slate-500">
          <span>🎓 {op.course_count} course{op.course_count === 1 ? "" : "s"}</span>
          {op.module_count > 0 ? (
            <>
              <span className="text-slate-300">·</span>
              <span>{op.module_count} modules</span>
            </>
          ) : null}
          {op.est_minutes > 0 ? (
            <>
              <span className="text-slate-300">·</span>
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
  return <div className="opacity-90">{inner}</div>;
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
        className={`inline-block px-2 py-0.5 rounded-full border text-[11px] font-medium mb-2 ${badgeClass}`}
      >
        {badge}
      </span>
      <p className="text-[13px] text-slate-600 leading-relaxed">{text}</p>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-600 text-[11px]">
      {children}
    </span>
  );
}

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M3 19l9-14 9 14H3z" stroke="#059669" strokeWidth="2" fill="rgba(16,185,129,.08)" />
        <circle cx="12" cy="14" r="2" fill="#84cc16" />
      </svg>
      <span className="font-semibold text-[15px] text-slate-900">
        <span className="text-emerald-700">Tour</span>Train
      </span>
    </Link>
  );
}

function LangPicker() {
  return (
    <button
      type="button"
      className="px-2.5 py-1.5 rounded-md text-slate-600 hover:bg-slate-100 text-[12px] inline-flex items-center gap-1"
      aria-label="Change language"
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        <path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" stroke="currentColor" strokeWidth="2" />
      </svg>
      EN
    </button>
  );
}

function SparkleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3l1.8 4.7L18 9.5l-4.2 1.8L12 16l-1.8-4.7L6 9.5l4.2-1.8L12 3z"
        fill="#10b981"
        stroke="#059669"
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
