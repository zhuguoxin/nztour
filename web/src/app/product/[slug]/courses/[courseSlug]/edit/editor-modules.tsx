"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deleteModule,
  createBlock,
  deleteBlock,
  reorderModulesBulk,
  reorderBlocksBulk,
  generateModuleAudioAction,
  removeBlockSlide,
  removeBlockVideo,
} from "../../actions";
import { SortableList, GrabHandle, type DragHandleProps } from "./sortable-list";
import { langLabel } from "@/lib/translate";
import { useTr } from "@/lib/i18n-provider";
import { fmt } from "@/lib/i18n-shared";
import { MediaPicker } from "@/app/_components/media-picker";

export interface VoiceOption {
  id: string;
  name: string;
  provider: string;
  kind: string;
  gender: string | null;
  /** JSON array of BCP-47 codes this voice is native for; null = universal. */
  langs: string | null;
  status: string;
}

/** Voices applicable to a given language: those native for it (langs includes
 *  the lang or its base code) plus universal (langs null — e.g. a cloned voice).
 *  Cloned/universal voices always show so suppliers can use a cloned voice in
 *  any language. */
export function voicesForLang(voices: VoiceOption[], lang: string): VoiceOption[] {
  const base = lang.split("-")[0];
  return voices.filter((v) => {
    if (!v.langs) return true;
    try {
      const arr = JSON.parse(v.langs);
      return Array.isArray(arr) && (arr.includes(lang) || arr.includes(base));
    } catch {
      return true;
    }
  });
}

/** Default voice for a language: the existing entry's voice if set; else for
 *  English the ElevenLabs premade stock voice; else the free MeloTTS voice
 *  (works on any tier) so generation succeeds out of the box. Premium native
 *  ElevenLabs library voices remain selectable but aren't the default. */
export function defaultVoiceFor(applicable: VoiceOption[], lang: string, existing?: string): string {
  if (existing) return existing;
  if (lang.startsWith("en")) {
    const premade = applicable.find((v) => v.provider === "elevenlabs" && v.kind === "stock");
    if (premade) return premade.id;
  }
  // Non-English: prefer MiniMax (premium native, platform key) → then the free
  // MeloTTS fallback → then whatever's available.
  const minimax = applicable.find((v) => v.provider === "minimax");
  if (minimax) return minimax.id;
  const melotts = applicable.find((v) => v.provider === "workers_ai_melotts");
  if (melotts) return melotts.id;
  return applicable[0]?.id ?? "voice_melotts_auto";
}

/** Clean a voice's display name for the editor: drop the provider prefix
 *  ("MiniMax · ", "ElevenLabs · ") and a trailing "(EN, f)" parenthetical, so
 *  only the voice name shows — third-party model names stay hidden. */
export function voiceDisplayName(name: string): string {
  return (
    (name ?? "")
      .replace(/^[^·]*·\s*/, "")
      .replace(/\s*\([^)]*\)\s*$/, "")
      .trim() || name
  );
}

export interface QuizQuestionData {
  id: string;
  prompt: string;
  choices_json: string;
  correct_idx: number;
  explanation: string | null;
  position: number;
}

export interface ModuleData {
  id: string;
  title: string;
  summary: string | null;
  est_minutes: number | null;
  position: number;
  /** JSON {lang: "script"} — module narration script per language. */
  narration_md_i18n?: string | null;
  /** JSON {lang: {r2_key, voice_id, duration_s, generated_at}} — narration audio. */
  narration_audio_i18n?: string | null;
  /** Unix ts set when a background regenerate finished (editor polls it). */
  regen_at?: number | null;
}

export interface BlockData {
  id: string;
  module_id: string;
  position: number;
  kind: string;
  text_md: string | null;
  video_uid: string | null;
  video_r2_key: string | null;
  image_r2_key: string | null;
  images_json: string | null;
  caption: string | null;
  visibility: string;
  narrate: number;
  duration_s: number | null;
  audio_r2_key: string | null;
  audio_voice: string | null;
  audio_duration_s: number | null;
  audio_generated_at: number | null;
}

const inputClass =
  "w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-small text-slate-900 outline-none focus:border-emerald-400/60";

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
  supplierSlug,
  courseSlug,
  primaryLang,
  availableLangs,
  voices,
  modules,
  blocksByModuleId,
  solo = false,
  moduleOptionsSlot,
}: {
  operatorSlug: string;
  /** Owning supplier slug — for the media library (image blocks). */
  supplierSlug: string | null;
  courseSlug: string;
  primaryLang: string;
  availableLangs: string[];
  voices: VoiceOption[];
  modules: ModuleData[];
  blocksByModuleId: Record<string, BlockData[]>;
  /** Single-module view (3-column editor): render just the one module,
   *  expanded, no drag handle / reorder list. */
  solo?: boolean;
  /** Solo only: rendered inside the module, under its title fields and before
   *  the first block (e.g. the per-module language & narration panel). */
  moduleOptionsSlot?: React.ReactNode;
}) {
  const tr = useTr();
  if (solo) {
    const m = modules[0];
    if (!m) {
      return (
        <div className="px-5 py-8 text-center text-small text-slate-500">{tr.em_no_modules}</div>
      );
    }
    return (
      <ModuleEditor
        module={m}
        solo
        blocks={blocksByModuleId[m.id] ?? []}
        operatorSlug={operatorSlug}
        supplierSlug={supplierSlug}
        courseSlug={courseSlug}
        primaryLang={primaryLang}
        availableLangs={availableLangs}
        voices={voices}
        optionsSlot={moduleOptionsSlot}
      />
    );
  }
  return (
    <SortableList
      items={modules}
      onReorder={(orderedIds) =>
        reorderModulesBulk({ operatorSlug, courseSlug, orderedIds })
      }
      emptyState={
        <div className="px-5 py-8 text-center text-small text-slate-500">
          {tr.em_no_modules}
        </div>
      }
      renderItem={(m, handle) => (
        <ModuleEditor
          module={m}
          handle={handle}
          blocks={blocksByModuleId[m.id] ?? []}
          operatorSlug={operatorSlug}
          supplierSlug={supplierSlug}
          courseSlug={courseSlug}
          primaryLang={primaryLang}
          availableLangs={availableLangs}
          voices={voices}
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
  supplierSlug,
  courseSlug,
  primaryLang,
  availableLangs,
  voices,
  solo = false,
  optionsSlot,
}: {
  module: ModuleData;
  handle?: DragHandleProps;
  blocks: BlockData[];
  operatorSlug: string;
  supplierSlug: string | null;
  courseSlug: string;
  primaryLang: string;
  availableLangs: string[];
  voices: VoiceOption[];
  solo?: boolean;
  optionsSlot?: React.ReactNode;
}) {
  const tr = useTr();
  return (
    <details className="group border-b border-slate-100" open={solo || blocks.length === 0}>
      <summary
        className={`px-5 py-4 flex items-center gap-3 list-none ${
          solo ? "" : "cursor-pointer hover:bg-slate-50"
        }`}
        onClick={solo ? (e) => e.preventDefault() : undefined}
      >
        {!solo && handle ? <GrabHandle handle={handle} /> : null}
        <span className="text-slate-700 text-small font-mono w-8">M{module.position}</span>
        <div className="flex-1 min-w-0">
          <div className="text-small font-medium text-slate-900 truncate">{module.title}</div>
          <div className="text-caption text-slate-500">
            {blocks.length} block{blocks.length === 1 ? "" : "s"}
          </div>
        </div>
        <span className="text-slate-600 text-caption ml-1 group-open:rotate-180 transition-transform inline-block">
          ⌄
        </span>
      </summary>

      <div className="px-5 pb-5 space-y-4">
        {/* Module meta — title only. Saved with the single page "Save changes"
            via inputs associated to form="course-form". */}
        <div className="space-y-3 bg-slate-50 rounded-lg p-3">
          <Field label={tr.em_field_title}>
            <input
              form="course-form"
              name={`mod:${module.id}:title`}
              defaultValue={module.title}
              maxLength={200}
              className={inputClass}
            />
          </Field>
          <form action={deleteModule} className="flex justify-end">
            <Hidden operatorSlug={operatorSlug} courseSlug={courseSlug} />
            <input type="hidden" name="module_id" value={module.id} />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-md border border-rose-200 text-rose-600 text-caption hover:bg-rose-400/10"
            >
              {tr.em_delete_module}
            </button>
          </form>
        </div>

        {/* Per-module language & narration options (solo view) — sits under the
            module's title fields, before the first block. */}
        {optionsSlot}

        {/* Blocks — nested sortable */}
        <SortableList
          items={blocks}
          onReorder={(orderedIds) =>
            reorderBlocksBulk({ operatorSlug, courseSlug, moduleId: module.id, orderedIds })
          }
          emptyState={
            <div className="text-caption text-slate-500 text-center py-3">
              {tr.em_no_blocks_add}
            </div>
          }
          renderItem={(b, h) => (
            <div className="mb-3">
              <BlockEditor
                block={b}
                handle={h}
                operatorSlug={operatorSlug}
                supplierSlug={supplierSlug}
                courseSlug={courseSlug}
                moduleId={module.id}
              />
            </div>
          )}
        />

        {/* Add-block buttons */}
        <div className="grid grid-cols-2 gap-2 text-caption">
          {(
            [
              ["text", tr.em_add_block_text],
              ["callout", tr.em_add_block_callout],
              ["video", tr.em_add_block_video],
              ["image", tr.em_add_block_image],
            ] as const
          ).map(([kind, label]) => (
            <form key={kind} action={createBlock} className="inline-flex">
              <Hidden operatorSlug={operatorSlug} courseSlug={courseSlug} />
              <input type="hidden" name="module_id" value={module.id} />
              <input type="hidden" name="kind" value={kind} />
              <button
                type="submit"
                className="w-full px-3 py-2 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 text-left"
              >
                {label}
              </button>
            </form>
          ))}
        </div>
        <p className="text-micro text-slate-500 leading-relaxed">
          {fmt(tr.em_block_tip, {
            text: tr.em_block_tip_text,
            callout: tr.em_block_tip_callout,
          })}
        </p>
      </div>
    </details>
  );
}

interface AudioI18nEntry {
  r2_key: string;
  voice_id: string;
  duration_s: number;
  generated_at: number;
}

function parseAudioI18n(json: string | null | undefined): Record<string, AudioI18nEntry> {
  if (!json) return {};
  try {
    const v = JSON.parse(json);
    return v && typeof v === "object" && !Array.isArray(v) ? v : {};
  } catch {
    return {};
  }
}

function BlockEditor({
  block,
  handle,
  operatorSlug,
  supplierSlug,
  courseSlug,
  moduleId,
}: {
  block: BlockData;
  handle: DragHandleProps;
  operatorSlug: string;
  supplierSlug: string | null;
  courseSlug: string;
  moduleId: string;
}) {
  const tr = useTr();
  const isNarratable = block.kind === "text" || block.kind === "callout";
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-3">
      <div className="flex items-center justify-between text-micro">
        <div className="flex items-center gap-2">
          <GrabHandle handle={handle} />
          <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 uppercase font-mono">
            {block.kind}
          </span>
          {block.duration_s ? (
            <span className="text-micro text-slate-700 font-mono">
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
            className="px-2 py-0.5 rounded text-rose-600/80 hover:bg-rose-400/10 text-micro"
          >
            {tr.em_block_delete_short}
          </button>
        </form>
      </div>

      {/* Editable fields — uncontrolled, but associated to the single page form
          (form="course-form") so one "Save changes" persists every block. The
          hidden _present marker lets the save action store an unchecked narrate
          box (absent key) as 0. */}
      <div className="space-y-2">
        <input type="hidden" form="course-form" name={`blk:${block.id}:_present`} value="1" />

        {isNarratable ? (
          <textarea
            form="course-form"
            name={`blk:${block.id}:text_md`}
            rows={3}
            defaultValue={block.text_md ?? ""}
            placeholder={tr.em_block_text_ph}
            className={inputClass + " resize-y"}
          />
        ) : null}

        {block.kind === "video" ? (
          <VideoEditor
            block={block}
            operatorSlug={operatorSlug}
            courseSlug={courseSlug}
            moduleId={moduleId}
          />
        ) : null}

        {block.kind === "image" ? (
          <ImageUploader
            block={block}
            operatorSlug={operatorSlug}
            supplierSlug={supplierSlug}
            courseSlug={courseSlug}
            moduleId={moduleId}
          />
        ) : null}

        {block.kind === "image" || block.kind === "video" || block.kind === "pdf" ? (
          <input
            form="course-form"
            name={`blk:${block.id}:caption`}
            defaultValue={block.caption ?? ""}
            placeholder={tr.em_block_caption_ph}
            className={inputClass}
          />
        ) : null}

        {isNarratable ? (
          <label className="flex items-center gap-2 text-caption text-slate-600 select-none">
            <input
              type="checkbox"
              form="course-form"
              name={`blk:${block.id}:narrate`}
              defaultChecked={block.narrate !== 0}
              className="accent-emerald-400"
            />
            {tr.em_block_narrate}
          </label>
        ) : null}
      </div>

    </div>
  );
}

/**
 * Module-level narration (voice-over). One script per module, authored in the
 * course's primary language; the "Import" button seeds it from the module's
 * text/callout blocks. Audio generates per language (other languages auto-
 * translate the primary script — Scheme A). 🎧 chips play generated audio.
 */
export function ModuleNarration({
  moduleId,
  operatorSlug,
  courseSlug,
  primaryLang,
  availableLangs,
  voices,
  narrationAudioI18n,
  blocks,
}: {
  moduleId: string;
  operatorSlug: string;
  courseSlug: string;
  primaryLang: string;
  availableLangs: string[];
  voices: VoiceOption[];
  narrationAudioI18n: string | null;
  blocks: BlockData[];
}) {
  const tr = useTr();
  const router = useRouter();
  const audioByLang = parseAudioI18n(narrationAudioI18n);
  // Narration auto-tracks the module's text — built from the text/callout
  // blocks (no manual import, no separately-maintained script).
  const derivedScript = blocks
    .filter(
      (b) =>
        (b.kind === "text" || b.kind === "callout") &&
        b.narrate !== 0 &&
        (b.text_md ?? "").trim(),
    )
    .map((b) => (b.text_md ?? "").trim())
    .join("\n\n");

  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);
  const [genLang, setGenLang] = useState(primaryLang);
  const [voiceId, setVoiceId] = useState(() =>
    defaultVoiceFor(voicesForLang(voices, primaryLang), primaryLang, audioByLang[primaryLang]?.voice_id),
  );
  const [pending, startGen] = useTransition();
  const [genErr, setGenErr] = useState<string | null>(null);

  const langsWithAudio = availableLangs.filter((l) => audioByLang[l]);
  const applicableVoices = voicesForLang(voices, genLang);

  function pickLang(l: string) {
    setGenLang(l);
    setVoiceId(defaultVoiceFor(voicesForLang(voices, l), l, audioByLang[l]?.voice_id));
  }

  function generate() {
    setGenErr(null);
    // Narration is derived from the module's text — nothing to narrate yet.
    if (!derivedScript.trim()) {
      setGenErr(tr.em_narration_need_text);
      return;
    }
    startGen(async () => {
      try {
        const res = await generateModuleAudioAction({
          operatorSlug,
          courseSlug,
          moduleId,
          lang: genLang,
          voiceId,
        });
        if (res.ok) {
          setOpen(false);
          router.refresh();
        } else setGenErr(res.error ?? tr.em_gen_failed);
      } catch (e) {
        setGenErr(e instanceof Error ? e.message : tr.em_gen_failed);
      }
    });
  }

  return (
    <section className="rounded-lg border border-emerald-400/20 bg-emerald-600/[.04] p-3 space-y-2.5">
      <div className="text-caption font-semibold text-slate-900">
        🎧 {tr.em_narration_heading}
      </div>

      {derivedScript.trim() ? (
        <div className="space-y-1">
          <div className="text-micro text-slate-500">{tr.em_narration_auto}</div>
          <div className="max-h-32 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2 text-caption leading-relaxed text-slate-600 whitespace-pre-wrap">
            {derivedScript}
          </div>
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-2.5 py-3 text-caption text-slate-400">
          {tr.em_narration_need_text}
        </div>
      )}

      {/* Voice-over: per-language audio chips + generate popover */}
      <div className="relative flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-200">
        <span className="text-micro text-slate-500 mr-1">{tr.em_audio_heading}:</span>
        {langsWithAudio.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setPlaying(playing === l ? null : l)}
            className={`px-1.5 py-0.5 rounded-full border text-micro font-medium ${
              playing === l
                ? "bg-emerald-600 border-emerald-400 text-slate-900"
                : "bg-emerald-600/15 border-emerald-400/30 text-slate-900 hover:bg-emerald-600/25"
            }`}
          >
            🎧 {langLabel(l)}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="px-2 py-0.5 rounded-full border border-slate-300 text-slate-600 text-micro hover:bg-slate-50"
        >
          + {tr.em_audio_gen_short}
        </button>

        {playing && audioByLang[playing] ? (
          <div className="absolute left-0 top-7 z-20 flex items-center gap-1 rounded-md border border-slate-300 bg-white p-1 shadow-xl">
            <audio
              autoPlay
              controls
              preload="none"
              src={`/api/module-audio?id=${moduleId}&lang=${encodeURIComponent(playing)}&t=${audioByLang[playing].generated_at}`}
              className="w-64 h-8"
            />
            <button
              type="button"
              onClick={() => setPlaying(null)}
              aria-label={tr.mp_close}
              title={tr.mp_close}
              className="w-6 h-6 shrink-0 rounded text-slate-600 hover:bg-slate-100 flex items-center justify-center text-caption"
            >
              ✕
            </button>
          </div>
        ) : null}

        {open ? (
          <div className="absolute left-0 top-7 z-30 w-64 rounded-lg border border-slate-300 bg-white p-2.5 space-y-2 shadow-xl">
            <select
              value={genLang}
              onChange={(e) => pickLang(e.target.value)}
              className={inputClass + " text-caption py-1.5"}
            >
              {availableLangs.map((l) => (
                <option key={l} value={l}>
                  {langLabel(l)}
                  {audioByLang[l] ? " ✓" : ""}
                </option>
              ))}
            </select>
            <select
              value={voiceId}
              onChange={(e) => setVoiceId(e.target.value)}
              className={inputClass + " text-caption py-1.5"}
            >
              {applicableVoices.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                  {v.kind === "cloned" ? " · cloned" : ""}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={generate}
              disabled={pending}
              className="w-full px-2.5 py-1.5 rounded bg-emerald-600 text-white font-semibold text-caption hover:bg-emerald-700 disabled:opacity-50"
            >
              {pending
                ? tr.em_audio_generating
                : audioByLang[genLang]
                  ? tr.em_audio_regenerate
                  : tr.em_audio_gen_short}
            </button>
            {genErr ? (
              <div className="text-micro text-rose-600 bg-rose-950/40 border border-rose-500/30 rounded px-2 py-1 break-words">
                {genErr}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

/**
 * Image block picker. Image blocks now pull from the supplier media library
 * (pick existing or upload-new) via the shared MediaPicker, which writes the
 * block's image_r2_key (block target).
 */
function VideoEditor({
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
  const tr = useTr();
  const [pending, startTransition] = useTransition();
  const [progress, setProgress] = useState<number | null>(null);

  // Files ≤ 50 MB go in one request (proven path); larger files use chunked R2
  // multipart upload so they sail past the Worker's ~100 MB body limit, up to a
  // 2 GB cap. R2 needs every part except the last to be the same size — a fixed
  // 50 MB slice guarantees that.
  const SINGLE_MAX = 50 * 1024 * 1024;
  const CHUNK = 50 * 1024 * 1024;
  const HARD_MAX = 2 * 1024 * 1024 * 1024;

  async function uploadMultipart(file: File) {
    const ids = {
      operator_slug: operatorSlug,
      course_slug: courseSlug,
      module_id: moduleId,
      block_id: block.id,
    };
    const cr = await fetch("/api/upload/video/multipart?phase=create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...ids, content_type: file.type, size: file.size }),
    });
    if (!cr.ok) throw new Error(await cr.text());
    const { key, uploadId } = (await cr.json()) as { key: string; uploadId: string };
    const total = Math.ceil(file.size / CHUNK);
    const parts: { partNumber: number; etag: string }[] = new Array(total);
    setProgress(0);
    try {
      // Upload parts with bounded concurrency (4 at a time). Each part is a
      // separate Worker invocation, so this saturates the uploader's bandwidth
      // and gets close to direct-to-R2 speed — without any S3 credentials.
      const CONCURRENCY = 4;
      let nextIdx = 0;
      let completed = 0;
      const worker = async () => {
        for (;;) {
          const i = nextIdx++;
          if (i >= total) break;
          const blob = file.slice(i * CHUNK, Math.min((i + 1) * CHUNK, file.size));
          const q = new URLSearchParams({
            key,
            uploadId,
            part: String(i + 1),
            operator_slug: operatorSlug,
          });
          const pr = await fetch(`/api/upload/video/multipart?phase=part&${q}`, {
            method: "POST",
            body: blob,
          });
          if (!pr.ok) throw new Error(await pr.text());
          const { etag } = (await pr.json()) as { etag: string };
          parts[i] = { partNumber: i + 1, etag };
          completed++;
          setProgress(Math.round((completed / total) * 100));
        }
      };
      await Promise.all(Array.from({ length: Math.min(CONCURRENCY, total) }, worker));

      const co = await fetch("/api/upload/video/multipart?phase=complete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...ids, key, uploadId, parts }),
      });
      if (!co.ok) throw new Error(await co.text());
    } catch (err) {
      // best-effort: discard the half-finished upload so it doesn't linger in R2
      fetch("/api/upload/video/multipart?phase=abort", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ operator_slug: operatorSlug, key, uploadId }),
      }).catch(() => {});
      throw err;
    }
  }

  // Fastest path: browser PUTs the file STRAIGHT to R2 via a presigned URL — no
  // Worker in the data path. Throws on any failure (incl. CORS) so onFile can
  // fall back to the Worker upload routes.
  async function uploadDirect(file: File) {
    const ids = {
      operator_slug: operatorSlug,
      course_slug: courseSlug,
      module_id: moduleId,
      block_id: block.id,
    };
    const pr = await fetch("/api/upload/video/direct?phase=presign", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...ids, content_type: file.type, size: file.size }),
    });
    if (!pr.ok) throw new Error(await pr.text());
    const { url, key } = (await pr.json()) as { url: string; key: string };
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", url);
      if (file.type) xhr.setRequestHeader("Content-Type", file.type);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () =>
        xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`R2 PUT ${xhr.status}`));
      xhr.onerror = () => reject(new Error("direct PUT network/CORS error"));
      xhr.send(file);
    });
    const at = await fetch("/api/upload/video/direct?phase=attach", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...ids, key }),
    });
    if (!at.ok) throw new Error(await at.text());
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > HARD_MAX) {
      alert(tr.ui_video_too_large.replace("{mb}", String(Math.round(file.size / 1024 / 1024))));
      return;
    }
    startTransition(async () => {
      try {
        let ok = false;
        try {
          setProgress(0);
          await uploadDirect(file);
          ok = true;
        } catch (directErr) {
          // Direct-to-R2 unavailable (no S3 creds, CORS, network) → Worker path.
          console.warn("direct R2 upload failed, falling back", directErr);
        }
        if (!ok) {
          setProgress(null);
          if (file.size <= SINGLE_MAX) {
            const fd = new FormData();
            fd.append("file", file);
            fd.append("operator_slug", operatorSlug);
            fd.append("course_slug", courseSlug);
            fd.append("module_id", moduleId);
            fd.append("block_id", block.id);
            const r = await fetch("/api/upload/video", { method: "POST", body: fd });
            if (!r.ok) throw new Error(await r.text());
          } else {
            await uploadMultipart(file);
          }
        }
        window.location.reload();
      } catch (err) {
        alert((err instanceof Error ? err.message : tr.ui_upload_failed).slice(0, 300));
      } finally {
        setProgress(null);
      }
    });
  }

  return (
    <div className="space-y-2">
      {/* YouTube share link (saved with the page "Save changes"). */}
      <input
        form="course-form"
        name={`blk:${block.id}:video_uid`}
        defaultValue={block.video_uid ?? ""}
        placeholder={tr.em_block_video_yt_ph}
        className={inputClass + " text-caption"}
      />

      {block.video_r2_key ? (
        <div className="flex items-center gap-2 text-caption text-slate-700 bg-slate-50 border border-slate-200 rounded-md px-3 py-2">
          <span>🎬 {tr.em_video_uploaded}</span>
          <form action={removeBlockVideo} className="ml-auto">
            <Hidden operatorSlug={operatorSlug} courseSlug={courseSlug} />
            <input type="hidden" name="module_id" value={moduleId} />
            <input type="hidden" name="block_id" value={block.id} />
            <button type="submit" className="text-rose-600 hover:underline text-caption">
              {tr.em_video_remove}
            </button>
          </form>
        </div>
      ) : (
        <label className="inline-flex items-center gap-2 text-caption text-slate-700 cursor-pointer">
          <span className="px-3 py-1.5 rounded-md border border-slate-300 hover:bg-slate-50">
            {pending ? (progress !== null ? `${tr.at_uploading} ${progress}%` : tr.at_uploading) : tr.em_video_upload}
          </span>
          <span className="text-micro text-slate-500">{tr.em_video_hint}</span>
          <input
            type="file"
            accept="video/mp4,video/webm,video/quicktime,video/ogg"
            disabled={pending}
            onChange={onFile}
            className="hidden"
          />
        </label>
      )}
    </div>
  );
}

function ImageUploader({
  block,
  operatorSlug,
  supplierSlug,
  courseSlug,
  moduleId,
}: {
  block: BlockData;
  operatorSlug: string;
  supplierSlug: string | null;
  courseSlug: string;
  moduleId: string;
}) {
  const tr = useTr();
  const [pending, startTransition] = useTransition();
  const slides: string[] = (() => {
    try {
      const v = JSON.parse(block.images_json ?? "[]");
      return Array.isArray(v) ? v.filter((s): s is string => typeof s === "string") : [];
    } catch {
      return [];
    }
  })();

  function addSlide(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    // Upload sequentially: the append route does a read-modify-write on
    // images_json, so parallel uploads would clobber each other's entries.
    startTransition(async () => {
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("operator_slug", operatorSlug);
        fd.append("course_slug", courseSlug);
        fd.append("module_id", moduleId);
        fd.append("block_id", block.id);
        fd.append("append", "1");
        const r = await fetch("/api/upload/image", { method: "POST", body: fd });
        if (!r.ok) {
          alert((await r.text().catch(() => tr.ui_upload_failed)).slice(0, 200));
          break;
        }
      }
      window.location.reload();
    });
    e.target.value = "";
  }

  if (!supplierSlug) {
    return <div className="text-micro text-slate-500">{tr.em_img_none}</div>;
  }

  return (
    <div className="space-y-2">
      <MediaPicker
        supplierSlug={supplierSlug}
        target={{ target: "block", operatorSlug, blockId: block.id }}
        currentUrl={block.image_r2_key ? `/api/image?id=${block.id}` : null}
        aspect="video"
        theme="light"
      />

      {/* Extra slides — turns the block into a slider. 1 image = single, 2+ =
          slides on the learner side. */}
      <div className="flex items-center gap-2 flex-wrap">
        {slides.map((key, i) => (
          <div key={key} className="relative w-16 h-16 rounded-md overflow-hidden border border-slate-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/image?id=${block.id}&n=${i}&k=${key.slice(-10)}`}
              alt=""
              className="w-full h-full object-cover"
            />
            <form action={removeBlockSlide} className="absolute top-0 right-0">
              <Hidden operatorSlug={operatorSlug} courseSlug={courseSlug} />
              <input type="hidden" name="module_id" value={moduleId} />
              <input type="hidden" name="block_id" value={block.id} />
              <input type="hidden" name="key" value={key} />
              <button
                type="submit"
                className="w-5 h-5 bg-black/50 text-white text-micro flex items-center justify-center hover:bg-black/70"
                title={tr.em_slide_remove}
              >
                ✕
              </button>
            </form>
          </div>
        ))}
        <label className="w-16 h-16 rounded-md border border-dashed border-slate-300 text-slate-400 hover:border-emerald-400 hover:text-slate-900 flex items-center justify-center cursor-pointer text-h3">
          {pending ? "…" : "+"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            multiple
            disabled={pending}
            onChange={addSlide}
            className="hidden"
          />
        </label>
      </div>
      <div className="text-micro text-slate-500">{tr.em_slide_hint}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-caption font-semibold text-slate-700 mb-1.5">{label}</div>
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
