import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0b1117] text-[#e6edf3] font-sans">
      {/* Top bar */}
      <header className="border-b border-[#1f2a35] px-7 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M3 19l9-14 9 14H3z" stroke="#22d3ee" strokeWidth="2" fill="rgba(34,211,238,.1)" />
            <circle cx="12" cy="14" r="2" fill="#a3e635" />
          </svg>
          <span className="font-semibold text-[15px]">
            <span className="text-[#22d3ee]">Tour</span>
            <span>Train</span>
          </span>
          <span className="ml-2 text-[11px] tracking-widest text-[#5b6b7d] font-mono">NZ · MVP</span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="px-3 py-1.5 rounded-md border border-[#243140] hover:bg-[#161e27]">
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="px-3 py-1.5 rounded-md bg-[#22d3ee] text-[#04141a] font-semibold hover:bg-[#67e8f9]">
                Get certified
              </button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <Link
              href="/learn"
              className="px-3 py-1.5 rounded-md bg-[#22d3ee] text-[#04141a] font-semibold hover:bg-[#67e8f9]"
            >
              Go to learning →
            </Link>
            <UserButton appearance={{ variables: { colorPrimary: "#22d3ee" } }} />
          </Show>
        </div>
      </header>

      {/* Hero */}
      <main className="px-10 py-24 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 mb-6">
          <span className="px-2 py-0.5 rounded-full bg-[rgba(163,230,53,.12)] border border-[rgba(163,230,53,.3)] text-[#bef264] text-[11px] font-medium">
            ● MVP build — clerk wired
          </span>
        </div>
        <h1 className="text-5xl font-bold tracking-tight">Sell New Zealand with confidence.</h1>
        <p className="mt-4 text-[15px] text-[#9aa7b8]">
          The B2B training & certification platform for the NZ tourism industry. Learn directly from
          operators. Earn verifiable digital badges. Ask AI anything — in any language.
        </p>

        <Show when="signed-out">
          <div className="mt-10 flex items-center justify-center gap-3">
            <SignUpButton mode="modal">
              <button className="px-5 py-2.5 rounded-md bg-[#22d3ee] text-[#04141a] font-semibold hover:bg-[#67e8f9]">
                Create free account
              </button>
            </SignUpButton>
            <SignInButton mode="modal">
              <button className="px-5 py-2.5 rounded-md border border-[#243140] hover:bg-[#161e27] text-sm">
                I already have one
              </button>
            </SignInButton>
          </div>
        </Show>
        <Show when="signed-in">
          <div className="mt-10">
            <Link
              href="/learn"
              className="inline-block px-5 py-2.5 rounded-md bg-[#22d3ee] text-[#04141a] font-semibold hover:bg-[#67e8f9]"
            >
              Browse courses →
            </Link>
          </div>
        </Show>

        <p className="mt-16 text-[12px] text-[#5b6b7d] font-mono">
          d2 · clerk wired · d1 schema ready · seed data committed
        </p>
      </main>
    </div>
  );
}
