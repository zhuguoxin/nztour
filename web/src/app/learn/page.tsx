import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { listPublishedCourses } from "@/lib/db";
import { TopBar } from "../_components/top-bar";
import { bootstrapAdminFromEmailList } from "@/lib/roles";
import { t, fmt } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function LearnHome() {
  await bootstrapAdminFromEmailList();
  const [user, courses, tr] = await Promise.all([
    currentUser(),
    listPublishedCourses(),
    t(),
  ]);
  const firstName =
    user?.firstName ?? user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] ?? tr.learn_anonymous;
  const operatorCount = new Set(courses.map((c) => c.operator_slug)).size;

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased text-[16px]">
      <TopBar
        breadcrumb={
          <span className="flex items-center gap-2">
            <Link href="/" className="hover:text-slate-900">
              {tr.nav_home}
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900">{tr.nav_my_learning}</span>
          </span>
        }
      />

      <main className="px-5 sm:px-8 py-10 sm:py-12 max-w-6xl mx-auto">
        <div className="mb-7 sm:mb-10">
          <div className="text-[11px] tracking-widest font-mono text-emerald-700/70 mb-1">
            {tr.learn_label}
          </div>
          <h1 className="text-[28px] sm:text-[34px] font-semibold tracking-tight text-slate-900">
            {fmt(tr.learn_welcome, { name: firstName })}
          </h1>
          <p className="text-[14px] sm:text-[15px] text-slate-600 mt-1.5">
            {fmt(tr.learn_summary, { courses: courses.length, operators: operatorCount })}
          </p>
        </div>

        {courses.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
            {tr.learn_empty}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.map((c) => (
              <Link
                key={c.id}
                href={`/learn/${c.operator_slug}/${c.slug}`}
                className="rounded-2xl overflow-hidden bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-[0_8px_32px_rgba(15,23,42,0.08)] transition cursor-pointer block"
              >
                <div
                  className="h-32 relative"
                  style={{
                    background:
                      c.cover_color ?? "linear-gradient(135deg,#1e293b 0%,#334155 100%)",
                  }}
                >
                  <div className="absolute top-3.5 left-3.5">
                    <span className="px-2.5 py-1 rounded-full bg-black/35 backdrop-blur-sm text-[11px] font-medium text-emerald-200 border border-white/15">
                      {tr.card_live}
                    </span>
                  </div>
                  <div className="absolute bottom-3.5 left-4 right-4 flex items-end justify-between">
                    <div className="text-[36px] leading-none drop-shadow">{c.emoji ?? "📚"}</div>
                    <span className="px-2.5 py-1 rounded-full bg-black/35 backdrop-blur-sm text-[11px] text-white/85 border border-white/15">
                      {c.operator_name}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <div className="font-semibold text-[17px] text-slate-900 leading-snug line-clamp-2">
                    {c.title}
                  </div>
                  <p className="text-[13px] text-slate-600 mt-1.5 line-clamp-2">{c.summary}</p>
                  <div className="flex items-center gap-2.5 mt-3.5 text-[13px] text-slate-500">
                    {c.est_minutes ? <span>⏱ {fmt(tr.card_minutes, { n: c.est_minutes })}</span> : null}
                    <span className="text-slate-300">·</span>
                    <span>{c.primary_lang.toUpperCase()}</span>
                    <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-medium">
                      💬 AI
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
