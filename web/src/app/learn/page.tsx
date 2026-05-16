import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { listPublishedCourses } from "@/lib/db";
import { TopBar } from "../_components/top-bar";

export const dynamic = "force-dynamic";

export default async function LearnHome() {
  const [user, courses] = await Promise.all([currentUser(), listPublishedCourses()]);
  const firstName = user?.firstName ?? user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] ?? "there";

  return (
    <div className="min-h-screen bg-[#04241e] text-[#f0fdf4] font-sans antialiased text-[16px]">
      <TopBar
        breadcrumb={
          <span className="flex items-center gap-2">
            <Link href="/" className="hover:text-white">Home</Link>
            <span className="text-white/20">/</span>
            <span className="text-white">My learning</span>
          </span>
        }
      />

      <main className="px-5 sm:px-8 py-10 sm:py-12 max-w-6xl mx-auto">
        <div className="mb-7 sm:mb-10">
          <div className="text-[11px] tracking-widest font-mono text-emerald-300/70 mb-1">/LEARN</div>
          <h1 className="text-[28px] sm:text-[34px] font-semibold tracking-tight text-white">
            Welcome, {firstName}.
          </h1>
          <p className="text-[14px] sm:text-[15px] text-[#a7d4b6] mt-1.5">
            {courses.length} published course{courses.length === 1 ? "" : "s"} available across {new Set(courses.map((c) => c.operator_slug)).size} operator
            {new Set(courses.map((c) => c.operator_slug)).size === 1 ? "" : "s"}.
          </p>
        </div>

        {courses.length === 0 ? (
          <div className="rounded-xl border border-white/[.08] bg-[#0a3a2f] p-8 text-center text-[#a7d4b6]">
            No published courses yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.map((c) => (
              <Link
                key={c.id}
                href={`/learn/${c.operator_slug}/${c.slug}`}
                className="rounded-2xl overflow-hidden bg-[#0a3a2f] border border-white/[.08] hover:border-emerald-400/40 hover:shadow-[0_8px_32px_rgba(52,211,153,0.10)] transition cursor-pointer block"
              >
                <div
                  className="h-32 relative"
                  style={{
                    background: c.cover_color ?? "linear-gradient(135deg,#1e293b 0%,#334155 100%)",
                  }}
                >
                  <div className="absolute top-3.5 left-3.5">
                    <span className="px-2.5 py-1 rounded-full bg-black/35 backdrop-blur-sm text-[11px] font-medium text-emerald-200 border border-white/15">
                      ● Live
                    </span>
                  </div>
                  <div className="absolute bottom-3.5 left-4 right-4 flex items-end justify-between">
                    <div className="text-[36px] leading-none drop-shadow">{c.emoji ?? "📚"}</div>
                    <span className="px-2.5 py-1 rounded-full bg-black/35 backdrop-blur-sm text-[11px] text-white/80 border border-white/15">
                      {c.operator_name}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <div className="font-semibold text-[17px] text-white leading-snug line-clamp-2">
                    {c.title}
                  </div>
                  <p className="text-[13px] text-[#a7d4b6] mt-1.5 line-clamp-2">{c.summary}</p>
                  <div className="flex items-center gap-2.5 mt-3.5 text-[13px] text-[#86b69a]">
                    {c.est_minutes ? <span>⏱ ~{c.est_minutes} min</span> : null}
                    <span className="text-white/20">·</span>
                    <span>{c.primary_lang.toUpperCase()}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-12 text-[11px] font-mono text-[#5d9279]">
          d3 · d1 wired · {courses.length} course{courses.length === 1 ? "" : "s"} from seed · user {user?.id?.slice(0, 12)}…
        </div>
      </main>
    </div>
  );
}
