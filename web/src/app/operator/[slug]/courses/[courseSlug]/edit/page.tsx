import { notFound } from "next/navigation";
import Link from "next/link";
import { TopBar } from "../../../../../_components/top-bar";
import { requireOperatorMembership } from "@/lib/roles";
import { db } from "@/lib/db";
import {
  updateCourse,
  deleteCourse,
  createModule,
  updateModule,
  deleteModule,
  reorderModule,
  createBlock,
  updateBlock,
  deleteBlock,
  generateBlockAudio,
  clearBlockAudio,
} from "../../actions";
import { TTS_VOICES } from "@/lib/tts";

export const dynamic = "force-dynamic";

interface CourseEditRow {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  emoji: string | null;
  status: string;
  est_minutes: number | null;
  primary_lang: string;
}

interface ModuleRow {
  id: string;
  title: string;
  summary: string | null;
  est_minutes: number | null;
  position: number;
}

interface BlockRow {
  id: string;
  module_id: string;
  position: number;
  kind: string;
  text_md: string | null;
  video_uid: string | null;
  caption: string | null;
  audio_r2_key: string | null;
  audio_voice: string | null;
  audio_duration_s: number | null;
  audio_generated_at: number | null;
}

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ slug: string; courseSlug: string }>;
}) {
  const { slug, courseSlug } = await params;
  try {
    await requireOperatorMembership(slug);
  } catch {
    notFound();
  }

  const op = await db()
    .prepare(`SELECT id, name FROM operators WHERE slug = ?`)
    .bind(slug)
    .first<{ id: string; name: string }>();
  if (!op) notFound();

  const course = await db()
    .prepare(
      `SELECT id, slug, title, summary, emoji, status, est_minutes, primary_lang
       FROM courses WHERE operator_id = ? AND slug = ?`,
    )
    .bind(op.id, courseSlug)
    .first<CourseEditRow>();
  if (!course) notFound();

  const { results: modules } = await db()
    .prepare(
      `SELECT id, title, summary, est_minutes, position
       FROM modules WHERE course_id = ? ORDER BY position, id`,
    )
    .bind(course.id)
    .all<ModuleRow>();

  // Pull every block at once (one query) and group client-side.
  const moduleIds = (modules ?? []).map((m) => m.id);
  const blocksByModule = new Map<string, BlockRow[]>();
  if (moduleIds.length > 0) {
    const ph = moduleIds.map(() => "?").join(",");
    const { results: blocks } = await db()
      .prepare(
        `SELECT id, module_id, position, kind, text_md, video_uid, caption,
                audio_r2_key, audio_voice, audio_duration_s, audio_generated_at
         FROM content_blocks WHERE module_id IN (${ph}) ORDER BY module_id, position`,
      )
      .bind(...moduleIds)
      .all<BlockRow>();
    for (const b of blocks ?? []) {
      const arr = blocksByModule.get(b.module_id) ?? [];
      arr.push(b);
      blocksByModule.set(b.module_id, arr);
    }
  }

  return (
    <div className="min-h-screen bg-[#04241e] text-[#f0fdf4] font-sans antialiased">
      <TopBar
        breadcrumb={
          <span className="flex items-center gap-2 min-w-0 text-[14px]">
            <Link href={`/operator/${slug}`} className="hover:text-white">
              {op.name}
            </Link>
            <span className="text-white/20">/</span>
            <span className="text-white truncate">{course.title}</span>
            <span
              className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                course.status === "published"
                  ? "bg-lime-300/10 border-lime-300/30 text-lime-300"
                  : "bg-amber-300/10 border-amber-300/30 text-amber-300"
              }`}
            >
              {course.status}
            </span>
          </span>
        }
      />

      <main className="px-5 sm:px-8 py-8 max-w-4xl mx-auto space-y-8">
        {/* ============== Course meta ============== */}
        <section className="rounded-2xl border border-white/[.08] bg-[#0a3a2f]">
          <header className="px-5 py-4 border-b border-white/[.06] flex items-center justify-between">
            <div className="font-semibold text-[14px] text-white">Course details</div>
            {course.status === "published" ? (
              <Link
                href={`/learn/${slug}/${course.slug}`}
                target="_blank"
                className="text-[12px] text-emerald-300 hover:underline"
              >
                View live →
              </Link>
            ) : null}
          </header>
          <form action={updateCourse} className="p-5 space-y-4">
            <input type="hidden" name="operator_slug" value={slug} />
            <input type="hidden" name="course_slug" value={course.slug} />

            <Field label="Title">
              <input
                name="title"
                defaultValue={course.title}
                required
                maxLength={200}
                className={inputClass}
              />
            </Field>

            <Field label="Summary">
              <textarea
                name="summary"
                rows={3}
                maxLength={1000}
                defaultValue={course.summary ?? ""}
                className={inputClass + " resize-y"}
              />
            </Field>

            <div className="grid grid-cols-3 gap-4">
              <Field label="Emoji">
                <input
                  name="emoji"
                  defaultValue={course.emoji ?? ""}
                  maxLength={4}
                  className={inputClass + " text-[20px]"}
                />
              </Field>
              <Field label="Minutes">
                <input
                  name="est_minutes"
                  type="number"
                  min={1}
                  max={600}
                  defaultValue={course.est_minutes ?? ""}
                  className={inputClass}
                />
              </Field>
              <Field label="Status">
                <select name="status" defaultValue={course.status} className={inputClass}>
                  <option value="draft">draft</option>
                  <option value="published">published</option>
                </select>
              </Field>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="submit"
                className="px-4 py-2 rounded-md bg-emerald-400 text-[#04241e] font-semibold text-[13px] hover:bg-emerald-300"
              >
                Save changes
              </button>
              {/* Delete is a separate form to avoid form-nesting */}
            </div>
          </form>

          <form
            action={deleteCourse}
            className="px-5 pb-5 -mt-1 flex items-center justify-end"
          >
            <input type="hidden" name="operator_slug" value={slug} />
            <input type="hidden" name="course_slug" value={course.slug} />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-md border border-rose-400/30 text-rose-300 text-[12px] hover:bg-rose-400/10"
            >
              Delete course
            </button>
          </form>
        </section>

        {/* ============== Modules + blocks ============== */}
        <section className="rounded-2xl border border-white/[.08] bg-[#0a3a2f]">
          <header className="px-5 py-4 border-b border-white/[.06] flex items-center justify-between">
            <div>
              <div className="font-semibold text-[14px] text-white">Modules</div>
              <div className="text-[12px] text-[#86b69a] mt-0.5">
                {modules?.length ?? 0} module{modules?.length === 1 ? "" : "s"} · agents see them in
                this order
              </div>
            </div>
          </header>

          <div className="divide-y divide-white/[.04]">
            {(modules ?? []).map((m, i) => (
              <ModuleEditor
                key={m.id}
                module={m}
                blocks={blocksByModule.get(m.id) ?? []}
                operatorSlug={slug}
                courseSlug={course.slug}
                canMoveUp={i > 0}
                canMoveDown={i < (modules?.length ?? 0) - 1}
              />
            ))}
            {(modules?.length ?? 0) === 0 ? (
              <div className="px-5 py-8 text-center text-[13px] text-[#86b69a]">
                No modules yet. Add the first one below to get started.
              </div>
            ) : null}
          </div>

          {/* New-module form */}
          <form action={createModule} className="p-5 border-t border-white/[.04] flex gap-2">
            <input type="hidden" name="operator_slug" value={slug} />
            <input type="hidden" name="course_slug" value={course.slug} />
            <input
              name="title"
              required
              placeholder="New module title — e.g. Lifts & terrain map"
              className={`flex-1 ${inputClass}`}
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-emerald-400 text-[#04241e] font-semibold text-[13px] hover:bg-emerald-300 shrink-0"
            >
              + Add module
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}

const inputClass =
  "w-full bg-[#04241e] border border-white/[.10] rounded-md px-3 py-2 text-[14px] text-white outline-none focus:border-emerald-400/60";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[12px] font-semibold text-[#e6f5ec] mb-1.5">{label}</div>
      {children}
    </label>
  );
}

function ModuleEditor({
  module,
  blocks,
  operatorSlug,
  courseSlug,
  canMoveUp,
  canMoveDown,
}: {
  module: ModuleRow;
  blocks: BlockRow[];
  operatorSlug: string;
  courseSlug: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  return (
    <details className="group" open={blocks.length === 0}>
      <summary className="px-5 py-4 cursor-pointer flex items-center gap-3 hover:bg-white/[.02] list-none">
        <span className="text-[#86b69a] text-[14px] font-mono w-8">M{module.position}</span>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-medium text-white truncate">{module.title}</div>
          <div className="text-[11.5px] text-[#86b69a]">
            {blocks.length} block{blocks.length === 1 ? "" : "s"}
            {module.est_minutes ? ` · ${module.est_minutes} min` : ""}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <SmallForm action={reorderModule}>
            <Hidden operatorSlug={operatorSlug} courseSlug={courseSlug} />
            <input type="hidden" name="module_id" value={module.id} />
            <input type="hidden" name="dir" value="up" />
            <button
              type="submit"
              disabled={!canMoveUp}
              className="px-1.5 py-1 rounded text-[12px] text-[#a7d4b6] hover:bg-white/[.06] disabled:opacity-30"
              title="Move up"
            >
              ↑
            </button>
          </SmallForm>
          <SmallForm action={reorderModule}>
            <Hidden operatorSlug={operatorSlug} courseSlug={courseSlug} />
            <input type="hidden" name="module_id" value={module.id} />
            <input type="hidden" name="dir" value="down" />
            <button
              type="submit"
              disabled={!canMoveDown}
              className="px-1.5 py-1 rounded text-[12px] text-[#a7d4b6] hover:bg-white/[.06] disabled:opacity-30"
              title="Move down"
            >
              ↓
            </button>
          </SmallForm>
          <span className="text-[#a7d4b6] text-[12px] ml-1 group-open:rotate-180 transition-transform inline-block">
            ⌄
          </span>
        </div>
      </summary>

      <div className="px-5 pb-5 space-y-4">
        {/* Module meta */}
        <form action={updateModule} className="space-y-3 bg-[#062b22] rounded-lg p-3">
          <Hidden operatorSlug={operatorSlug} courseSlug={courseSlug} />
          <input type="hidden" name="module_id" value={module.id} />
          <Field label="Title">
            <input
              name="title"
              defaultValue={module.title}
              required
              maxLength={200}
              className={inputClass}
            />
          </Field>
          <div className="grid grid-cols-[1fr_120px] gap-3">
            <Field label="Summary">
              <input
                name="summary"
                defaultValue={module.summary ?? ""}
                maxLength={1000}
                className={inputClass}
              />
            </Field>
            <Field label="Minutes">
              <input
                name="est_minutes"
                type="number"
                min={1}
                max={120}
                defaultValue={module.est_minutes ?? ""}
                className={inputClass}
              />
            </Field>
          </div>
          <div className="flex items-center justify-between gap-2">
            <button
              type="submit"
              className="px-3 py-1.5 rounded-md bg-emerald-400 text-[#04241e] font-semibold text-[12.5px] hover:bg-emerald-300"
            >
              Save module
            </button>
            <SmallForm action={deleteModule}>
              <Hidden operatorSlug={operatorSlug} courseSlug={courseSlug} />
              <input type="hidden" name="module_id" value={module.id} />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-md border border-rose-400/30 text-rose-300 text-[12px] hover:bg-rose-400/10"
              >
                Delete module
              </button>
            </SmallForm>
          </div>
        </form>

        {/* Blocks */}
        <div className="space-y-3">
          {blocks.map((b) => (
            <BlockEditor
              key={b.id}
              block={b}
              operatorSlug={operatorSlug}
              courseSlug={courseSlug}
              moduleId={module.id}
            />
          ))}
        </div>

        {/* Add-block forms (one per kind, compact) */}
        <div className="grid grid-cols-2 gap-2 text-[12px]">
          {(["text", "callout", "video", "image"] as const).map((kind) => (
            <SmallForm key={kind} action={createBlock}>
              <Hidden operatorSlug={operatorSlug} courseSlug={courseSlug} />
              <input type="hidden" name="module_id" value={module.id} />
              <input type="hidden" name="kind" value={kind} />
              <button
                type="submit"
                className="w-full px-3 py-2 rounded-md border border-white/[.10] text-[#d8f0e1] hover:bg-white/[.06] text-left"
              >
                + Add {kind} block
              </button>
            </SmallForm>
          ))}
        </div>
      </div>
    </details>
  );
}

function BlockEditor({
  block,
  operatorSlug,
  courseSlug,
  moduleId,
}: {
  block: BlockRow;
  operatorSlug: string;
  courseSlug: string;
  moduleId: string;
}) {
  const isNarratable = block.kind === "text" || block.kind === "callout";
  const hasAudio = !!block.audio_r2_key;
  return (
    <div className="bg-[#04241e] border border-white/[.08] rounded-lg p-3 space-y-3">
      {/* Header row — kind chip + delete (a separate form so it can sit
          above the update form without nesting). */}
      <div className="flex items-center justify-between text-[11px]">
        <span className="px-2 py-0.5 rounded-full bg-white/[.04] border border-white/[.08] text-[#a7d4b6] uppercase font-mono">
          {block.kind}
        </span>
        <SmallForm action={deleteBlock}>
          <Hidden operatorSlug={operatorSlug} courseSlug={courseSlug} />
          <input type="hidden" name="module_id" value={moduleId} />
          <input type="hidden" name="block_id" value={block.id} />
          <button
            type="submit"
            className="px-2 py-0.5 rounded text-rose-300/80 hover:bg-rose-400/10 text-[11px]"
          >
            ✕ delete
          </button>
        </SmallForm>
      </div>

      {/* Field-update form */}
      <form action={updateBlock} className="space-y-2">
        <Hidden operatorSlug={operatorSlug} courseSlug={courseSlug} />
        <input type="hidden" name="module_id" value={moduleId} />
        <input type="hidden" name="block_id" value={block.id} />

        {isNarratable ? (
          <textarea
            name="text_md"
            rows={3}
            defaultValue={block.text_md ?? ""}
            placeholder="Markdown (**bold**, *italic*)"
            className={inputClass + " resize-y"}
          />
        ) : null}

        {block.kind === "video" ? (
          <input
            name="video_uid"
            defaultValue={block.video_uid ?? ""}
            placeholder="yt:<youtube-id>  or  Cloudflare Stream UID (32 hex)"
            className={inputClass + " font-mono text-[12.5px]"}
          />
        ) : null}

        {block.kind === "image" || block.kind === "video" || block.kind === "pdf" ? (
          <input
            name="caption"
            defaultValue={block.caption ?? ""}
            placeholder="Caption (optional)"
            className={inputClass}
          />
        ) : null}

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-3 py-1.5 rounded-md bg-white/[.06] border border-white/[.10] text-[#e6f5ec] text-[12px] hover:bg-white/[.10]"
          >
            Save block
          </button>
        </div>
      </form>

      {/* Voice-over panel — only for text + callout blocks (the only kinds
          with a text script to narrate). Sits in its own form so the generate
          action carries its own fields without polluting the update form. */}
      {isNarratable ? (
        <div className="rounded-md border border-emerald-400/15 bg-emerald-400/[.04] p-2.5">
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <div className="flex items-center gap-1.5 text-emerald-300 font-semibold">
              🎙️ Voice-over
              {hasAudio ? (
                <span className="ml-1 text-[10px] text-[#86b69a] font-normal">
                  {block.audio_voice} · {block.audio_duration_s ?? "?"}s · generated{" "}
                  {block.audio_generated_at ? fmtRelative(block.audio_generated_at) : ""}
                </span>
              ) : (
                <span className="ml-1 text-[10px] text-[#86b69a] font-normal">
                  Not generated yet
                </span>
              )}
            </div>
            {hasAudio ? (
              <SmallForm action={clearBlockAudio}>
                <Hidden operatorSlug={operatorSlug} courseSlug={courseSlug} />
                <input type="hidden" name="module_id" value={moduleId} />
                <input type="hidden" name="block_id" value={block.id} />
                <button
                  type="submit"
                  className="text-[10px] text-rose-300/80 hover:underline"
                  title="Delete the generated audio"
                >
                  clear
                </button>
              </SmallForm>
            ) : null}
          </div>

          {hasAudio ? (
            <audio
              controls
              preload="none"
              src={`/api/audio?id=${block.id}&t=${block.audio_generated_at ?? 0}`}
              className="w-full h-9 mb-2"
            />
          ) : null}

          <form action={generateBlockAudio} className="flex items-center gap-1.5">
            <Hidden operatorSlug={operatorSlug} courseSlug={courseSlug} />
            <input type="hidden" name="module_id" value={moduleId} />
            <input type="hidden" name="block_id" value={block.id} />
            <select
              name="voice"
              defaultValue={block.audio_voice ?? "nova"}
              className={inputClass + " flex-1 text-[12px]"}
            >
              {TTS_VOICES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label} — {v.description}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-md bg-emerald-400 text-[#04241e] font-semibold text-[12px] hover:bg-emerald-300 shrink-0"
            >
              {hasAudio ? "Regenerate" : "Generate audio"}
            </button>
          </form>
          <div className="text-[10.5px] text-[#86b69a] mt-1.5">
            OpenAI TTS-1 · auto-detects language from the text · saves to R2 ·
            served via /api/audio/&lt;block-id&gt;
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SmallForm({
  action,
  children,
}: {
  action: (form: FormData) => Promise<void>;
  children: React.ReactNode;
}) {
  return (
    <form action={action} className="inline-flex">
      {children}
    </form>
  );
}

function fmtRelative(unix: number): string {
  const diff = Date.now() / 1000 - unix;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function Hidden({ operatorSlug, courseSlug }: { operatorSlug: string; courseSlug: string }) {
  return (
    <>
      <input type="hidden" name="operator_slug" value={operatorSlug} />
      <input type="hidden" name="course_slug" value={courseSlug} />
    </>
  );
}
