import { currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { listPublishedCourses } from "@/lib/db";

// Force dynamic — we hit D1 on every request. Caching layer added in D7.
export const dynamic = "force-dynamic";

export default async function LearnHome() {
  const [user, courses] = await Promise.all([currentUser(), listPublishedCourses()]);

  return (
    <div className="min-h-screen bg-[#0b1117] text-[#e6edf3] font-sans">
      {/* Header */}
      <header className="border-b border-[#1f2a35] px-7 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M3 19l9-14 9 14H3z" stroke="#22d3ee" strokeWidth="2" fill="rgba(34,211,238,.1)" />
              <circle cx="12" cy="14" r="2" fill="#a3e635" />
            </svg>
            <span className="font-semibold text-[15px]">
              <span className="text-[#22d3ee]">Tour</span>Train
            </span>
          </Link>
          <span className="ml-2 text-[11px] tracking-widest text-[#5b6b7d] font-mono">/LEARN</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-[#9aa7b8]">
          <span>{user?.fullName ?? user?.emailAddresses?.[0]?.emailAddress}</span>
          <UserButton appearance={{ variables: { colorPrimary: "#22d3ee" } }} />
        </div>
      </header>

      <main className="px-10 py-10 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">Explore courses</h1>
          <p className="text-[14px] text-[#9aa7b8] mt-1">
            Learn directly from NZ tourism operators. {courses.length} course
            {courses.length === 1 ? "" : "s"} available.
          </p>
        </div>

        {courses.length === 0 ? (
          <div className="rounded-xl border border-[#1f2a35] bg-[#11181f] p-8 text-center text-[#9aa7b8]">
            No published courses yet. Run the seed script to load NZSki content.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((c) => (
              <Link
                key={c.id}
                href={`/learn/${c.operator_slug}/${c.slug}`}
                className="rounded-xl border border-[#1f2a35] bg-[#11181f] overflow-hidden hover:border-[#22d3ee]/40 transition cursor-pointer block"
              >
                <div
                  className="h-28 relative"
                  style={{ background: c.cover_color ?? "linear-gradient(135deg,#1e293b 0%,#334155 100%)" }}
                >
                  <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                    <div className="text-2xl">{c.emoji ?? "📚"}</div>
                    <span className="px-2 py-0.5 rounded-full bg-[#1a2530]/70 backdrop-blur border border-[#243140] text-[11px]">
                      {c.operator_name}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="font-semibold text-[15px]">{c.title}</div>
                  <p className="text-[12px] text-[#9aa7b8] mt-1 line-clamp-2">{c.summary}</p>
                  <div className="flex items-center gap-3 mt-3 text-xs text-[#9aa7b8]">
                    {c.est_minutes ? <span>⏱ ~{c.est_minutes} min</span> : null}
                    <span className="text-[#5b6b7d]">·</span>
                    <span>{c.primary_lang.toUpperCase()}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-12 text-[11px] text-[#5b6b7d] font-mono">
          d3 · d1 wired · {courses.length} course
          {courses.length === 1 ? "" : "s"} from seed · user {user?.id?.slice(0, 12)}…
        </div>
      </main>
    </div>
  );
}
