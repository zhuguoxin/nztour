import { notFound } from "next/navigation";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getCourseBySlug, getModuleBlocks, type ModuleRow } from "@/lib/db";
import {
  ensureUser,
  ensureEnrollment,
  getModuleProgress,
  maybeAwardBadge,
} from "@/lib/progress";
import { ModuleReader } from "./module-reader";
import { completeModuleAction } from "./actions";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ operator: string; course: string }>;
  searchParams: Promise<{ m?: string }>;
}

export default async function CoursePage({ params, searchParams }: Props) {
  const { operator: operatorSlug, course: courseSlug } = await params;
  const { m: moduleSlug } = await searchParams;

  const data = await getCourseBySlug(operatorSlug, courseSlug);
  if (!data) notFound();
  const { operator, course, modules } = data;
  if (modules.length === 0) {
    return <EmptyCourse operator={operator.name} title={course.title} />;
  }

  const { userId } = await auth();
  if (!userId) notFound(); // middleware should have redirected, defensive

  // Ensure D1 mirror of user + enrollment
  const user = await currentUser();
  await ensureUser({
    id: userId,
    email: user?.emailAddresses?.[0]?.emailAddress ?? "",
    name: user?.fullName,
    preferredLang: "en",
  });
  await ensureEnrollment(userId, course.id);

  const progressMap = await getModuleProgress(userId, course.id);

  // Resolve active module
  const active =
    modules.find((m) => m.slug === moduleSlug) ??
    modules.find((m) => !progressMap.get(m.id)?.completed_at) ??
    modules[0];
  const blocks = await getModuleBlocks(active.id);

  const completedCount = modules.filter((m) => progressMap.get(m.id)?.completed_at).length;
  const progressPct = Math.round((completedCount / modules.length) * 100);

  // Bind module/course ids into the server action via closures.
  async function onComplete(dwellSeconds: number): Promise<{ verifyCode?: string }> {
    "use server";
    return completeModuleAction({
      moduleId: active.id,
      courseId: course.id,
      dwellSeconds,
    });
  }

  return (
    <div className="min-h-screen bg-[#0b1117] text-[#e6edf3] font-sans">
      {/* Header */}
      <header className="border-b border-[#1f2a35] px-7 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-[#9aa7b8]">
          <Link href="/learn" className="flex items-center gap-2 text-[#e6edf3]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M3 19l9-14 9 14H3z" stroke="#22d3ee" strokeWidth="2" fill="rgba(34,211,238,.1)" />
              <circle cx="12" cy="14" r="2" fill="#a3e635" />
            </svg>
            <span className="font-semibold text-[15px]">
              <span className="text-[#22d3ee]">Tour</span>Train
            </span>
          </Link>
          <span className="text-[#5b6b7d]">/</span>
          <Link href={`/learn`} className="hover:text-white">
            {operator.name}
          </Link>
          <span className="text-[#5b6b7d]">/</span>
          <span className="text-[#e6edf3]">{course.title}</span>
        </div>
        <UserButton appearance={{ variables: { colorPrimary: "#22d3ee" } }} />
      </header>

      <div className="grid grid-cols-[280px_1fr]">
        {/* Module list */}
        <aside className="border-r border-[#1f2a35] p-5 min-h-[calc(100vh-65px)]">
          <div className="text-[11px] font-mono text-[#5b6b7d] mb-2">COURSE</div>
          <div className="text-[14px] font-semibold mb-1">{course.title}</div>
          <div className="text-xs text-[#9aa7b8] mb-4">{operator.name}</div>

          <div className="h-1.5 bg-[#1a2530] rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-gradient-to-r from-[#22d3ee] to-[#a3e635] transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-[#9aa7b8] mb-5">
            <span>
              {completedCount} of {modules.length} modules
            </span>
            <span className="text-[#bef264] font-medium">{progressPct}%</span>
          </div>

          <div className="text-[11px] font-mono text-[#5b6b7d] mb-2">MODULES</div>
          <ModuleList modules={modules} active={active} progressMap={progressMap} basePath={`/learn/${operatorSlug}/${courseSlug}`} />
        </aside>

        {/* Reader */}
        <ModuleReader
          module={active}
          blocks={blocks}
          courseSlug={courseSlug}
          operatorSlug={operatorSlug}
          modules={modules}
          isCompleted={!!progressMap.get(active.id)?.completed_at}
          onComplete={onComplete}
        />
      </div>
    </div>
  );
}

function ModuleList({
  modules,
  active,
  progressMap,
  basePath,
}: {
  modules: ModuleRow[];
  active: ModuleRow;
  progressMap: Map<string, { completed_at: number | null }>;
  basePath: string;
}) {
  // Pre-await badge check via maybeAwardBadge isn't here; that's done in the
  // server action after a successful completion (see actions.ts).
  void maybeAwardBadge;
  return (
    <div className="space-y-1">
      {modules.map((m) => {
        const done = !!progressMap.get(m.id)?.completed_at;
        const isActive = m.id === active.id;
        const dot = done ? "bg-[#a3e635]" : isActive ? "bg-[#22d3ee]" : "bg-[#374151]";
        return (
          <Link
            key={m.id}
            href={`${basePath}?m=${m.slug}`}
            className={`flex items-start gap-3 px-3 py-2.5 rounded-lg ${
              isActive ? "bg-[#1a2530] border border-[#22d3ee]/30" : "hover:bg-[#161e27]"
            }`}
          >
            <div className={`w-2 h-2 rounded-full mt-1.5 ${dot}`} />
            <div className="flex-1 min-w-0">
              <div className={`text-[13px] ${isActive ? "font-medium" : ""}`}>{m.title}</div>
              <div className="text-[11px] text-[#5b6b7d]">
                {m.est_minutes ? `${m.est_minutes} min` : ""}
                {done ? " · ✓ completed" : isActive ? " · in progress" : ""}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function EmptyCourse({ operator, title }: { operator: string; title: string }) {
  return (
    <div className="min-h-screen bg-[#0b1117] text-[#e6edf3] flex items-center justify-center font-sans">
      <div className="text-center">
        <div className="text-[11px] font-mono text-[#5b6b7d] mb-3">DRAFT</div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-[#9aa7b8] mt-1">{operator}</p>
        <p className="mt-6 text-[14px] text-[#9aa7b8] max-w-md">
          This course is auto-drafted from source files and pending operator review. Modules will appear
          once the operator publishes the parsed content.
        </p>
        <Link
          href="/learn"
          className="mt-6 inline-block px-4 py-2 rounded-md border border-[#243140] text-sm hover:bg-[#161e27]"
        >
          ← Back to courses
        </Link>
      </div>
    </div>
  );
}
