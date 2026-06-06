"use client";

import { useTransition } from "react";
import {
  updateModule,
  deleteModule,
  createBlock,
  updateBlock,
  deleteBlock,
  generateBlockAudio,
  clearBlockAudio,
  reorderModulesBulk,
  reorderBlocksBulk,
} from "../../actions";
import { TTS_LANGS } from "@/lib/tts";
import { SortableList, GrabHandle, type DragHandleProps } from "./sortable-list";

export interface ModuleData {
  id: string;
  title: string;
  summary: string | null;
  est_minutes: number | null;
  position: number;
}

export interface BlockData {
  id: string;
  module_id: string;
  position: number;
  kind: string;
  text_md: string | null;
  video_uid: string | null;
  image_r2_key: string | null;
  caption: string | null;
  visibility: string;
  duration_s: number | null;
  audio_r2_key: string | null;
  audio_voice: string | null;
  audio_duration_s: number | null;
  audio_generated_at: number | null;
}

const inputClass =
  "w-full bg-[#04241e] border border-white/[.10] rounded-md px-3 py-2 text-[14px] text-white outline-none focus:border-emerald-400/60";

/**
 * Client wrapper for the modules-and-blocks portion of the editor.
 *
 * Modules render in a vertical SortableList; each open module renders its
 * blocks in a nested SortableList. Drag handles live on a dedicated grab
 * icon to avoid stealing pointer events from text fields / buttons.
 *
 * All mutations go through server actions imported from ../../actions.
 * Optimistic ordering is handled inside SortableList — failures revert.
 */
export function EditorModules({
  operatorSlug,
  courseSlug,
  modules,
  blocksByModuleId,
}: {
  operatorSlug: string;
  courseSlug: string;
  modules: ModuleData[];
  blocksByModuleId: Record<string, BlockData[]>;
}) {
  return (
    <SortableList
      items={modules}
      onReorder={(orderedIds) =>
        reorderModulesBulk({ operatorSlug, courseSlug, orderedIds })
      }
      emptyState={
        <div className="px-5 py-8 text-center text-[13px] text-[#86b69a]">
          No modules yet. Add the first one below to get started.
        </div>
      }
      renderItem={(m, handle) => (
        <ModuleEditor
          module={m}
          handle={handle}
          blocks={blocksByModuleId[m.id] ?? []}
          operatorSlug={operatorSlug}
          courseSlug={courseSlug}
        />
      )}
    />
  );
}

function ModuleEditor({
  module,
  handle,
  blocks,
  operatorSlug,
  courseSlug,
}: {
  module: ModuleData;
  handle: DragHandleProps;
  blocks: BlockData[];
  operatorSlug: string;
  courseSlug: string;
}) {
  return (
    <details className="group border-b border-white/[.04]" open={blocks.length === 0}>
      <summary className="px-5 py-4 cursor-pointer flex items-center gap-3 hover:bg-white/[.02] list-none">
        <GrabHandle handle={handle} />
        <span className="text-[#86b69a] text-[14px] font-mono w-8">M{module.position}</span>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-medium text-white truncate">{module.title}</div>
          <div className="text-[11.5px] text-[#86b69a]">
            {blocks.length} block{blocks.length === 1 ? "" : "s"}
            {module.est_minutes ? ` · ${module.est_minutes} min` : ""}
          </div>
        </div>
        <span className="text-[#a7d4b6] text-[12px] ml-1 group-open:rotate-180 transition-transform inline-block">
          ⌄
        </span>
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
            <form action={deleteModule} className="inline-flex">
              <Hidden operatorSlug={operatorSlug} courseSlug={courseSlug} />
              <input type="hidden" name="module_id" value={module.id} />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-md border border-rose-400/30 text-rose-300 text-[12px] hover:bg-rose-400/10"
              >
                Delete module
              </button>
            </form>
          </div>
        </form>

        {/* Blocks — nested sortable */}
        <SortableList
          items={blocks}
          onReorder={(orderedIds) =>
            reorderBlocksBulk({ operatorSlug, courseSlug, moduleId: module.id, orderedIds })
          }
          emptyState={
            <div className="text-[12px] text-[#86b69a] text-center py-3">
              No blocks yet — add one below.
            </div>
          }
          renderItem={(b, h) => (
            <div className="mb-3">
              <BlockEditor
                block={b}
                handle={h}
                operatorSlug={operatorSlug}
                courseSlug={courseSlug}
                moduleId={module.id}
              />
            </div>
          )}
        />

        {/* Add-block buttons */}
        <div className="grid grid-cols-2 gap-2 text-[12px]">
          {(["text", "callout", "video", "image"] as const).map((kind) => (
            <form key={kind} action={createBlock} className="inline-flex">
              <Hidden operatorSlug={operatorSlug} courseSlug={courseSlug} />
              <input type="hidden" name="module_id" value={module.id} />
              <input type="hidden" name="kind" value={kind} />
              <button
                type="submit"
                className="w-full px-3 py-2 rounded-md border border-white/[.10] text-[#d8f0e1] hover:bg-white/[.06] text-left"
              >
                + Add {kind} block
              </button>
            </form>
          ))}
        </div>
      </div>
    </details>
  );
}

function BlockEditor({
  block,
  handle,
  operatorSlug,
  courseSlug,
  moduleId,
}: {
  block: BlockData;
  handle: DragHandleProps;
  operatorSlug: string;
  courseSlug: string;
  moduleId: string;
}) {
  const isNarratable = block.kind === "text" || block.kind === "callout";
  const hasAudio = !!block.audio_r2_key;
  return (
    <div className="bg-[#04241e] border border-white/[.08] rounded-lg p-3 space-y-3">
      <div className="flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-2">
          <GrabHandle handle={handle} />
          <span className="px-2 py-0.5 rounded-full bg-white/[.04] border border-white/[.08] text-[#a7d4b6] uppercase font-mono">
            {block.kind}
          </span>
          {block.visibility === "assistant_only" ? (
            <span
              className="px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 uppercase font-mono"
              title="Fed to the AI assistant for Q&A, but hidden from learners in /learn"
            >
              AI-only
            </span>
          ) : null}
          {block.duration_s ? (
            <span className="text-[10px] text-[#86b69a] font-mono">
              {fmtDuration(block.duration_s)}
            </span>
          ) : null}
        </div>
        <form action={deleteBlock} className="inline-flex">
          <Hidden operatorSlug={operatorSlug} courseSlug={courseSlug} />
          <input type="hidden" name="module_id" value={moduleId} />
          <input type="hidden" name="block_id" value={block.id} />
          <button
            type="submit"
            className="px-2 py-0.5 rounded text-rose-300/80 hover:bg-rose-400/10 text-[11px]"
          >
            ✕ delete
          </button>
        </form>
      </div>

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

        {block.kind === "image" ? (
          <ImageUploader
            block={block}
            operatorSlug={operatorSlug}
            courseSlug={courseSlug}
            moduleId={moduleId}
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

        <div className="flex items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-[11.5px] text-[#a7d4b6] select-none">
            <input
              type="checkbox"
              name="visibility_assistant_only"
              defaultChecked={block.visibility === "assistant_only"}
              className="accent-emerald-400"
            />
            AI-only (hide from learners)
          </label>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-md bg-white/[.06] border border-white/[.10] text-[#e6f5ec] text-[12px] hover:bg-white/[.10]"
          >
            Save block
          </button>
        </div>
      </form>

      {isNarratable ? (
        <div className="rounded-md border border-emerald-400/15 bg-emerald-400/[.04] p-2.5">
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <div className="flex items-center gap-1.5 text-emerald-300 font-semibold">
              🎙️ Voice-over
              {hasAudio ? (
                <span className="ml-1 text-[10px] text-[#86b69a] font-normal">
                  {block.audio_voice ?? "auto"} · {block.audio_duration_s ?? "?"}s · generated{" "}
                  {block.audio_generated_at ? fmtRelative(block.audio_generated_at) : ""}
                </span>
              ) : (
                <span className="ml-1 text-[10px] text-[#86b69a] font-normal">
                  Not generated yet
                </span>
              )}
            </div>
            {hasAudio ? (
              <form action={clearBlockAudio} className="inline-flex">
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
              </form>
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
              name="lang"
              defaultValue={block.audio_voice ?? "auto"}
              className={inputClass + " flex-1 text-[12px]"}
            >
              {TTS_LANGS.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
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
            Cloudflare Workers AI · @cf/myshell-ai/melotts · saves to R2 ·
            served via /api/audio?id=&lt;block-id&gt;
          </div>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Image block uploader. Renders preview + file picker; on file select, POSTs
 * to /api/upload/image which writes to R2 and updates the block's image_r2_key.
 * On success we refresh the page.
 */
function ImageUploader({
  block,
  operatorSlug,
  courseSlug,
  moduleId,
}: {
  block: BlockData;
  operatorSlug: string;
  courseSlug: string;
  moduleId: string;
}) {
  const [pending, startTransition] = useTransition();

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("operator_slug", operatorSlug);
    fd.append("course_slug", courseSlug);
    fd.append("module_id", moduleId);
    fd.append("block_id", block.id);
    startTransition(async () => {
      const r = await fetch("/api/upload/image", { method: "POST", body: fd });
      if (r.ok) {
        // Soft refresh — server re-renders with new image_r2_key.
        window.location.reload();
      } else {
        const msg = await r.text().catch(() => "Upload failed");
        alert(msg.slice(0, 300));
      }
    });
  }

  return (
    <div className="space-y-2">
      {block.image_r2_key ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/api/image?id=${block.id}`}
          alt={block.caption ?? ""}
          className="max-h-48 rounded border border-white/[.08] object-contain"
        />
      ) : (
        <div className="h-32 rounded border border-dashed border-white/[.10] flex items-center justify-center text-[12px] text-[#86b69a]">
          No image — pick a file below
        </div>
      )}
      <label className="flex items-center gap-2 text-[12px] text-[#d8f0e1] cursor-pointer">
        <span className="px-3 py-1.5 rounded-md bg-white/[.06] border border-white/[.10] hover:bg-white/[.10]">
          {pending ? "Uploading…" : block.image_r2_key ? "Replace image" : "Choose image"}
        </span>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          disabled={pending}
          onChange={onFileChange}
          className="hidden"
        />
        <span className="text-[10px] text-[#86b69a]">
          PNG / JPEG / WebP / GIF · max 8 MB
        </span>
      </label>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[12px] font-semibold text-[#e6f5ec] mb-1.5">{label}</div>
      {children}
    </label>
  );
}

function Hidden({ operatorSlug, courseSlug }: { operatorSlug: string; courseSlug: string }) {
  return (
    <>
      <input type="hidden" name="operator_slug" value={operatorSlug} />
      <input type="hidden" name="course_slug" value={courseSlug} />
    </>
  );
}

function fmtRelative(unix: number): string {
  const diff = Date.now() / 1000 - unix;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function fmtDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
