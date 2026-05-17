import { notFound } from "next/navigation";
import Link from "next/link";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getCourseBySlug, getModuleBlocks, type ModuleRow } from "@/lib/db";
import {
  ensureUser,
  ensureEnrollment,
  getModuleProgress,
} from "@/lib/progress";
import { ModuleReader } from "./module-reader";
import { completeModuleAction } from "./actions";
import { TopBar } from "../../../_components/top-bar";
import { AskAI } from "../../../_components/ask-ai";
import { t, fmt } from "@/lib/i18n";

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
  if (!userId) notFound();

  const user = await currentUser();
  await ensureUser({
    id: userId,
    email: user?.emailAddresses?.[0]?.emailAddress ?? "",
    name: user?.fullName,
    preferredLang: "en",
  });
  await ensureEnrollment(userId, course.id);

  const progressMap = await getModuleProgress(userId, course.id);

  const active =
    modules.find((m) => m.slug === moduleSlug) ??
    modules.find((m) => !progressMap.get(m.id)?.completed_at) ??
    modules[0];
  const blocks = await getModuleBlocks(active.id);

  const completedCount = modules.filter((m) => progressMap.get(m.id)?.completed_at).length;
  const progressPct = Math.round((completedCount / modules.length) * 100);
  const tr = await t();

  async function onComplete(dwellSeconds: number): Promise<{ verifyCode?: string }> {
    "use server";
    return completeModuleAction({
      moduleId: active.id,
      courseId: course.id,
      dwellSeconds,
    });
  }

  return (
    <div className="min-h-screen bg-[#04241e] text-[#f0fdf4] font-sans antialiased text-[16px]">
      <TopBar
        breadcrumb={
          <span className="flex items-center gap-2 min-w-0">
            <Link href="/learn" className="hover:text-white shrink-0">{tr.nav_my_learning}</Link>
            <span className="text-white/20 shrink-0">/</span>
            <span className="shrink-0">{operator.name}</span>
            <span className="text-white/20 shrink-0">/</span>
            <span className="text-white truncate">{course.title}</span>
          </span>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_360px]">
        {/* Module list */}
        <aside className="border-b lg:border-b-0 lg:border-r border-white/[.06] p-5 lg:min-h-[calc(100vh-65px)] bg-[#062b22]/50">
          <div className="text-[11px] font-mono text-emerald-300/70 mb-2">{tr.course_label}</div>
          <div className="text-[15px] font-semibold mb-1 text-white">{course.title}</div>
          <div className="text-[13px] text-[#a7d4b6] mb-4">{operator.name}</div>

          <div className="h-1.5 bg-black/30 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-lime-300 transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[13px] text-[#a7d4b6] mb-5">
            <span>
              {completedCount} / {modules.length}
            </span>
            <span className="text-lime-300 font-medium">{progressPct}%</span>
          </div>

          <div className="text-[11px] font-mono text-emerald-300/70 mb-2">{tr.modules_label}</div>
          <ModuleList
            modules={modules}
            active={active}
            progressMap={progressMap}
            basePath={`/learn/${operatorSlug}/${courseSlug}`}
            completedLabel={tr.completed_chip}
          />
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
          tr={{
            module_position: tr.module_position,
            completed_chip: tr.completed_chip,
            no_blocks: tr.no_blocks,
            badge_earned: tr.badge_earned,
            verify_code_prefix: tr.verify_code_prefix,
            back_to_courses: tr.back_to_courses,
            start_module: tr.start_module,
            stay_to_complete_a: tr.stay_to_complete_a,
            stay_to_complete_b: tr.stay_to_complete_b,
            already_completed: tr.already_completed,
            ready_to_complete: tr.ready_to_complete,
            saving: tr.saving,
            done: tr.done,
            mark_complete: tr.mark_complete,
            mark_complete_and_continue: tr.mark_complete_and_continue,
            continue_to: tr.continue_to,
          }}
        />

        {/* AI sidebar — scoped to this course */}
        <aside className="border-t lg:border-t-0 lg:border-l border-white/[.06] lg:min-h-[calc(100vh-65px)] lg:max-h-[calc(100vh-65px)]">
          <AskAI
            variant="sidebar"
            scope={{ operator_id: operator.id, course_id: course.id }}
            sidebarTitle={tr.ai_sidebar_title}
            sidebarSubtitle={tr.ai_sidebar_subtitle}
            emptyState={tr.ai_empty_state}
            thinkingText={tr.ai_thinking}
            noAnswerWarning={tr.ai_no_answer}
            placeholder={fmt(tr.ai_sidebar_placeholder, { title: course.title })}
            examples={[tr.hero_example_1, tr.hero_example_3, tr.hero_example_2]}
          />
        </aside>
      </div>
    </div>
  );
}

function ModuleList({
  modules,
  active,
  progressMap,
  basePath,
  completedLabel,
}: {
  modules: ModuleRow[];
  active: ModuleRow;
  progressMap: Map<string, { completed_at: number | null }>;
  basePath: string;
  completedLabel: string;
}) {
  return (
    <div className="space-y-1">
      {modules.map((m) => {
        const done = !!progressMap.get(m.id)?.completed_at;
        const isActive = m.id === active.id;
        const dot = done
          ? "bg-emerald-300"
          : isActive
            ? "bg-emerald-400"
            : "bg-white/15";
        return (
          <Link
            key={m.id}
            href={`${basePath}?m=${m.slug}`}
            className={`flex items-start gap-3 px-3 py-2.5 rounded-lg ${
              isActive
                ? "bg-emerald-400/10 border border-emerald-400/30"
                : "border border-transparent hover:bg-white/[.04]"
            }`}
          >
            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${dot}`} />
            <div className="flex-1 min-w-0">
              <div className={`text-[14px] ${isActive ? "font-medium text-white" : "text-[#d8f0e1]"}`}>
                {m.title}
              </div>
              <div className="text-[11px] text-[#86b69a]">
                {m.est_minutes ? `${m.est_minutes} min` : ""}
                {done ? ` · ${completedLabel}` : ""}
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
    <div className="min-h-screen bg-[#04241e] text-[#f0fdf4] font-sans antialiased flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <div className="text-[11px] font-mono text-emerald-300/70 mb-3 tracking-widest">DRAFT</div>
        <h1 className="text-[26px] font-semibold text-white">{title}</h1>
        <p className="text-[#a7d4b6] mt-1.5">{operator}</p>
        <p className="mt-6 text-[14px] text-[#a7d4b6] leading-relaxed">
          This course is auto-drafted from source files and pending operator review. Modules will
          appear once the operator publishes the parsed content.
        </p>
        <Link
          href="/learn"
          className="mt-7 inline-block px-4 py-2 rounded-md border border-white/[.10] text-[14px] text-[#d8f0e1] hover:bg-white/[.06]"
        >
          ← Back to courses
        </Link>
      </div>
    </div>
  );
}
