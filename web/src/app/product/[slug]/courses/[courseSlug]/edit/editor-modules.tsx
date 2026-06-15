"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateModule,
  deleteModule,
  createBlock,
  updateBlock,
  deleteBlock,
  generateBlockAudioAction,
  clearBlockAudio,
  reorderModulesBulk,
  reorderBlocksBulk,
  createQuizQuestion,
  deleteQuizQuestion,
  generateModuleQuiz,
} from "../../actions";
import { SortableList, GrabHandle, type DragHandleProps } from "./sortable-list";
import { langLabel } from "@/lib/translate";
import { useTr } from "@/lib/i18n-provider";
import { fmt } from "@/lib/i18n-shared";

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
function voicesForLang(voices: VoiceOption[], lang: string): VoiceOption[] {
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
function defaultVoiceFor(applicable: VoiceOption[], lang: string, existing?: string): string {
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
  primaryLang,
  availableLangs,
  voices,
  modules,
  blocksByModuleId,
  quizByModuleId,
  solo = false,
}: {
  operatorSlug: string;
  courseSlug: string;
  primaryLang: string;
  availableLangs: string[];
  voices: VoiceOption[];
  modules: ModuleData[];
  blocksByModuleId: Record<string, BlockData[]>;
  quizByModuleId: Record<string, QuizQuestionData[]>;
  /** Single-module view (3-column editor): render just the one module,
   *  expanded, no drag handle / reorder list. */
  solo?: boolean;
}) {
  const tr = useTr();
  if (solo) {
    const m = modules[0];
    if (!m) {
      return (
        <div className="px-5 py-8 text-center text-[13px] text-[#86b69a]">{tr.em_no_modules}</div>
      );
    }
    return (
      <ModuleEditor
        module={m}
        solo
        blocks={blocksByModuleId[m.id] ?? []}
        quiz={quizByModuleId[m.id] ?? []}
        operatorSlug={operatorSlug}
        courseSlug={courseSlug}
        primaryLang={primaryLang}
        availableLangs={availableLangs}
        voices={voices}
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
        <div className="px-5 py-8 text-center text-[13px] text-[#86b69a]">
          {tr.em_no_modules}
        </div>
      }
      renderItem={(m, handle) => (
        <ModuleEditor
          module={m}
          handle={handle}
          blocks={blocksByModuleId[m.id] ?? []}
          quiz={quizByModuleId[m.id] ?? []}
          operatorSlug={operatorSlug}
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
  quiz,
  operatorSlug,
  courseSlug,
  primaryLang,
  availableLangs,
  voices,
  solo = false,
}: {
  module: ModuleData;
  handle?: DragHandleProps;
  blocks: BlockData[];
  quiz: QuizQuestionData[];
  operatorSlug: string;
  courseSlug: string;
  primaryLang: string;
  availableLangs: string[];
  voices: VoiceOption[];
  solo?: boolean;
}) {
  const tr = useTr();
  return (
    <details className="group border-b border-white/[.04]" open={solo || blocks.length === 0}>
      <summary
        className={`px-5 py-4 flex items-center gap-3 list-none ${
          solo ? "" : "cursor-pointer hover:bg-white/[.02]"
        }`}
        onClick={solo ? (e) => e.preventDefault() : undefined}
      >
        {!solo && handle ? <GrabHandle handle={handle} /> : null}
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
          <Field label={tr.em_field_title}>
            <input
              name="title"
              defaultValue={module.title}
              required
              maxLength={200}
              className={inputClass}
            />
          </Field>
          <div className="grid grid-cols-[1fr_120px] gap-3">
            <Field label={tr.em_field_summary}>
              <input
                name="summary"
                defaultValue={module.summary ?? ""}
                maxLength={1000}
                className={inputClass}
              />
            </Field>
            <Field label={tr.em_field_minutes}>
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
              {tr.em_save_module}
            </button>
            {/* formAction overrides the form's action for this submit — avoids
                a nested <form> (which corrupts hydration and breaks every form
                in the module subtree). The shared hidden inputs above carry
                operator_slug / course_slug / module_id for deleteModule too. */}
            <button
              type="submit"
              formAction={deleteModule}
              className="px-3 py-1.5 rounded-md border border-rose-400/30 text-rose-300 text-[12px] hover:bg-rose-400/10"
            >
              {tr.em_delete_module}
            </button>
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
              {tr.em_no_blocks_add}
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
                primaryLang={primaryLang}
                availableLangs={availableLangs}
                voices={voices}
              />
            </div>
          )}
        />

        {/* Add-block buttons */}
        <div className="grid grid-cols-2 gap-2 text-[12px]">
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
                className="w-full px-3 py-2 rounded-md border border-white/[.10] text-[#d8f0e1] hover:bg-white/[.06] text-left"
              >
                {label}
              </button>
            </form>
          ))}
        </div>
        <p className="text-[11px] text-[#86b69a] leading-relaxed">
          {fmt(tr.em_block_tip, {
            text: tr.em_block_tip_text,
            callout: tr.em_block_tip_callout,
          })}
        </p>

        {/* End-of-chapter quiz authoring */}
        <ModuleQuizAuthor
          moduleId={module.id}
          questions={quiz}
          operatorSlug={operatorSlug}
          courseSlug={courseSlug}
        />
      </div>
    </details>
  );
}

function ModuleQuizAuthor({
  moduleId,
  questions,
  operatorSlug,
  courseSlug,
}: {
  moduleId: string;
  questions: QuizQuestionData[];
  operatorSlug: string;
  courseSlug: string;
}) {
  const tr = useTr();
  return (
    <section className="rounded-lg border border-amber-400/20 bg-amber-400/[.04] p-3">
      <div className="flex items-baseline justify-between mb-2">
        <div className="text-[12px] font-semibold text-amber-300">
          {tr.em_quiz_heading}
          <span className="ml-1.5 text-[10px] text-[#86b69a] font-normal">
            {fmt(questions.length === 1 ? tr.em_quiz_count_one : tr.em_quiz_count_many, {
              n: questions.length,
            })}
          </span>
        </div>
        <form action={generateModuleQuiz} className="inline-flex">
          <Hidden operatorSlug={operatorSlug} courseSlug={courseSlug} />
          <input type="hidden" name="module_id" value={moduleId} />
          <input type="hidden" name="count" value="5" />
          <button
            type="submit"
            className="px-2.5 py-1 rounded border border-amber-400/40 text-amber-200 hover:bg-amber-400/10 text-[11px]"
            title={tr.em_quiz_generate_title}
          >
            {tr.em_quiz_gen5}
          </button>
        </form>
      </div>

      {questions.length === 0 ? (
        <div className="text-[11.5px] text-[#86b69a] mb-2">
          {tr.em_quiz_empty}
        </div>
      ) : (
        <ol className="space-y-1.5 mb-2">
          {questions.map((q) => {
            let choices: string[] = [];
            try {
              choices = JSON.parse(q.choices_json);
            } catch {
              // skip
            }
            return (
              <li
                key={q.id}
                className="bg-black/20 rounded border border-white/[.05] px-2.5 py-1.5 flex items-start gap-2"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] text-white truncate">{q.prompt}</div>
                  <div className="text-[10.5px] text-[#86b69a] truncate">
                    {choices.map((c, i) => (
                      <span key={i} className={i === q.correct_idx ? "text-emerald-300" : ""}>
                        {i === q.correct_idx ? "✓ " : ""}
                        {c}
                        {i < choices.length - 1 ? " · " : ""}
                      </span>
                    ))}
                  </div>
                </div>
                <form action={deleteQuizQuestion} className="inline-flex">
                  <Hidden operatorSlug={operatorSlug} courseSlug={courseSlug} />
                  <input type="hidden" name="module_id" value={moduleId} />
                  <input type="hidden" name="question_id" value={q.id} />
                  <button
                    type="submit"
                    className="px-1.5 py-0.5 rounded text-rose-300/80 hover:bg-rose-400/10 text-[10px]"
                    title={tr.em_quiz_delete_q}
                  >
                    ✕
                  </button>
                </form>
              </li>
            );
          })}
        </ol>
      )}

      <NewQuestionForm
        moduleId={moduleId}
        operatorSlug={operatorSlug}
        courseSlug={courseSlug}
      />
    </section>
  );
}

function NewQuestionForm({
  moduleId,
  operatorSlug,
  courseSlug,
}: {
  moduleId: string;
  operatorSlug: string;
  courseSlug: string;
}) {
  const tr = useTr();
  return (
    <form
      action={createQuizQuestion}
      className="grid grid-cols-1 gap-1.5 text-[12px] mt-2"
    >
      <Hidden operatorSlug={operatorSlug} courseSlug={courseSlug} />
      <input type="hidden" name="module_id" value={moduleId} />
      <input
        type="text"
        name="prompt"
        required
        maxLength={500}
        placeholder={tr.em_quiz_q_ph}
        className={inputClass + " text-[12.5px]"}
      />
      <div className="grid grid-cols-[1fr_1fr] gap-1.5">
        <input
          type="text"
          name="c0"
          required
          placeholder={tr.em_quiz_choice_a}
          className={inputClass + " text-[12.5px]"}
        />
        <input
          type="text"
          name="c1"
          required
          placeholder={tr.em_quiz_choice_b}
          className={inputClass + " text-[12.5px]"}
        />
      </div>
      <div className="grid grid-cols-[1fr_1fr] gap-1.5">
        <input
          type="text"
          name="c2"
          placeholder={tr.em_quiz_choice_c}
          className={inputClass + " text-[12.5px]"}
        />
        <input
          type="text"
          name="c3"
          placeholder={tr.em_quiz_choice_d}
          className={inputClass + " text-[12.5px]"}
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-[11px] text-[#a7d4b6]">{tr.em_quiz_correct}:</label>
        <select name="correct_idx" defaultValue="0" className={inputClass + " w-20 text-[12px]"}>
          <option value="0">A</option>
          <option value="1">B</option>
          <option value="2">C</option>
          <option value="3">D</option>
        </select>
        <input
          type="text"
          name="explanation"
          placeholder={tr.em_quiz_explanation_ph}
          maxLength={1000}
          className={inputClass + " flex-1 text-[12px]"}
        />
        <SubmitChoicesAsJson />
        <button
          type="submit"
          className="px-3 py-1.5 rounded bg-amber-400 text-[#04241e] font-semibold text-[12px] hover:bg-amber-300 shrink-0"
        >
          {tr.em_quiz_add_short}
        </button>
      </div>
    </form>
  );
}

/** Bundle c0..c3 inputs into choices_json before form submit. The server
 *  action expects a single `choices_json` field; we pack non-empty choices
 *  on the client via a tiny render-time hidden input. */
function SubmitChoicesAsJson() {
  return (
    <input
      type="hidden"
      name="choices_json"
      defaultValue=""
      ref={(node) => {
        if (!node) return;
        const form = node.form;
        if (!form) return;
        form.addEventListener(
          "submit",
          () => {
            const choices = (["c0", "c1", "c2", "c3"] as const)
              .map((n) => (form.elements.namedItem(n) as HTMLInputElement | null)?.value?.trim() ?? "")
              .filter((s) => s.length > 0);
            node.value = JSON.stringify(choices);
          },
          { once: true },
        );
      }}
    />
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
  courseSlug,
  moduleId,
  primaryLang,
  availableLangs,
  voices,
}: {
  block: BlockData;
  handle: DragHandleProps;
  operatorSlug: string;
  courseSlug: string;
  moduleId: string;
  primaryLang: string;
  availableLangs: string[];
  voices: VoiceOption[];
}) {
  const tr = useTr();
  const isNarratable = block.kind === "text" || block.kind === "callout";
  const hasAudio = !!block.audio_r2_key;
  const audioI18n = parseAudioI18n(
    (block as unknown as { audio_i18n?: string | null }).audio_i18n ?? null,
  );
  // Show one row per available language with its current audio state.
  const langsWithAudio = availableLangs.slice().sort((a, b) => (a === primaryLang ? -1 : b === primaryLang ? 1 : a.localeCompare(b)));
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
              title={tr.em_block_training}
            >
              {tr.em_ai_only}
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
            {tr.em_block_delete_short}
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
            placeholder={tr.em_block_text_ph}
            className={inputClass + " resize-y"}
          />
        ) : null}

        {block.kind === "video" ? (
          <input
            name="video_uid"
            defaultValue={block.video_uid ?? ""}
            placeholder={tr.em_block_video_ph}
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
            placeholder={tr.em_block_caption_ph}
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
            {tr.em_ai_only_hide}
          </label>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-md bg-white/[.06] border border-white/[.10] text-[#e6f5ec] text-[12px] hover:bg-white/[.10]"
          >
            {tr.em_save_block}
          </button>
        </div>
      </form>

      {isNarratable ? (
        <div className="rounded-md border border-emerald-400/15 bg-emerald-400/[.04] p-2.5 space-y-2">
          <div className="flex items-center gap-1.5 text-emerald-300 font-semibold text-[11px]">
            🎙️ {tr.em_audio_heading}
            <span className="text-[10px] text-[#86b69a] font-normal">
              {tr.em_audio_one_per_lang}
            </span>
          </div>

          {langsWithAudio.map((lang) => {
            const entry = lang === primaryLang
              ? (hasAudio
                  ? {
                      r2_key: block.audio_r2_key!,
                      voice_id: block.audio_voice ?? "voice_melotts_auto",
                      duration_s: block.audio_duration_s ?? 0,
                      generated_at: block.audio_generated_at ?? 0,
                    }
                  : audioI18n[lang])
              : audioI18n[lang];
            return (
              <AudioLangRow
                key={lang}
                lang={lang}
                isPrimary={lang === primaryLang}
                entry={entry ?? null}
                blockId={block.id}
                moduleId={moduleId}
                operatorSlug={operatorSlug}
                courseSlug={courseSlug}
                voices={voices}
              />
            );
          })}

          {hasAudio ? (
            <form action={clearBlockAudio} className="inline-flex">
              <Hidden operatorSlug={operatorSlug} courseSlug={courseSlug} />
              <input type="hidden" name="module_id" value={moduleId} />
              <input type="hidden" name="block_id" value={block.id} />
              <button
                type="submit"
                className="text-[10px] text-rose-300/80 hover:underline"
                title={tr.em_audio_delete_title}
              >
                {tr.em_audio_clear_primary}
              </button>
            </form>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function AudioLangRow({
  lang,
  isPrimary,
  entry,
  blockId,
  moduleId,
  operatorSlug,
  courseSlug,
  voices,
}: {
  lang: string;
  isPrimary: boolean;
  entry: AudioI18nEntry | null;
  blockId: string;
  moduleId: string;
  operatorSlug: string;
  courseSlug: string;
  voices: VoiceOption[];
}) {
  const tr = useTr();
  const has = !!entry;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  // Only voices native for this language (plus universal/cloned ones).
  const applicableVoices = voicesForLang(voices, lang);
  const [voiceId, setVoiceId] = useState(defaultVoiceFor(applicableVoices, lang, entry?.voice_id));
  const [err, setErr] = useState<string | null>(null);

  function generate() {
    setErr(null);
    startTransition(async () => {
      try {
        const res = await generateBlockAudioAction({
          operatorSlug,
          courseSlug,
          moduleId,
          blockId,
          lang,
          voiceId,
        });
        if (res.ok) router.refresh();
        else setErr(res.error ?? tr.em_gen_failed);
      } catch (e) {
        setErr(e instanceof Error ? e.message : tr.em_gen_failed);
      }
    });
  }

  return (
    <div className="rounded border border-white/[.06] bg-black/[.10] p-2">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="px-1.5 py-0.5 rounded bg-emerald-400/10 border border-emerald-400/30 text-emerald-200 text-[10px] font-mono uppercase">
          {langLabel(lang)}
          {isPrimary ? tr.em_audio_primary_suffix : ""}
        </span>
        {has ? (
          <span className="text-[10px] text-[#86b69a] font-mono">
            {entry!.duration_s}s · {entry!.voice_id}
          </span>
        ) : (
          <span className="text-[10px] text-[#86b69a]">{tr.em_audio_not_generated}</span>
        )}
      </div>
      {has ? (
        <audio
          controls
          preload="none"
          src={
            isPrimary
              ? `/api/audio?id=${blockId}&t=${entry!.generated_at}`
              : `/api/audio?id=${blockId}&lang=${encodeURIComponent(lang)}&t=${entry!.generated_at}`
          }
          className="w-full h-8 mb-1.5"
        />
      ) : null}
      <div className="flex items-center gap-1.5">
        <select
          value={voiceId}
          onChange={(e) => setVoiceId(e.target.value)}
          disabled={pending}
          className={inputClass + " flex-1 text-[11.5px] py-1"}
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
          className="px-2.5 py-1 rounded bg-emerald-400 text-[#04241e] font-semibold text-[11.5px] hover:bg-emerald-300 shrink-0 disabled:opacity-50"
        >
          {pending ? "…" : has ? "↻" : tr.em_audio_gen_short}
        </button>
      </div>
      {err ? (
        <div className="mt-1.5 text-[10.5px] text-rose-300 bg-rose-950/40 border border-rose-500/30 rounded px-2 py-1 break-words">
          {err}
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
  const tr = useTr();
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
        const msg = await r.text().catch(() => tr.ui_upload_failed);
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
          {tr.em_img_none}
        </div>
      )}
      <label className="flex items-center gap-2 text-[12px] text-[#d8f0e1] cursor-pointer">
        <span className="px-3 py-1.5 rounded-md bg-white/[.06] border border-white/[.10] hover:bg-white/[.10]">
          {pending ? tr.em_uploading : block.image_r2_key ? tr.em_replace_image : tr.em_choose_image}
        </span>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          disabled={pending}
          onChange={onFileChange}
          className="hidden"
        />
        <span className="text-[10px] text-[#86b69a]">
          {tr.em_img_formats}
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
