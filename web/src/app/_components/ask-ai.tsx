"use client";

import { useState, useRef, useEffect } from "react";

interface CitationView {
  id: string;
  score: number;
  operator_name: string;
  operator_slug: string;
  course_title: string;
  course_slug: string;
  module_title: string;
  module_slug: string;
  snippet: string;
}

interface AskAIResult {
  question: string;
  answer: string;
  citations: CitationView[];
  source_kind?: "rag" | "no_answer";
  latency_ms?: number;
}

export interface AskAIScope {
  operator_id?: string;
  course_id?: string;
}

/**
 * AskAI: single-turn streaming Q&A widget. Two layouts:
 *  - variant="hero": homepage hero bar; renders inline below the input.
 *  - variant="sidebar": course-detail right panel; multi-turn transcript.
 *
 * Calls POST /api/qa, parses SSE events:
 *   citations -> populate citations
 *   text      -> append delta
 *   done      -> finalize
 */
export function AskAI({
  variant = "hero",
  scope,
  placeholder = "Ask anything about the operators…",
  examples = [],
  sidebarTitle = "Ask about this course",
  sidebarSubtitle = "Grounded in operator content · EN / 中",
  emptyState = "Try asking about this course. Examples below.",
  thinkingText = "Thinking…",
  noAnswerWarning = "⚠ Not found in operator content. Answer is from general knowledge.",
  askLabel = "Ask",
}: {
  variant?: "hero" | "sidebar";
  scope?: AskAIScope;
  placeholder?: string;
  examples?: string[];
  sidebarTitle?: string;
  sidebarSubtitle?: string;
  emptyState?: string;
  thinkingText?: string;
  noAnswerWarning?: string;
  askLabel?: string;
}) {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<AskAIResult[]>([]);
  const [current, setCurrent] = useState<AskAIResult | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (variant === "sidebar") bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [current?.answer, history.length, variant]);

  async function ask(question: string) {
    const q = question.trim();
    if (!q || pending) return;
    setError(null);
    setInput("");
    setPending(true);

    const result: AskAIResult = { question: q, answer: "", citations: [] };
    setCurrent(result);

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const resp = await fetch("/api/qa", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: q, scope }),
        signal: ctrl.signal,
      });
      if (!resp.ok || !resp.body) {
        const text = await resp.text().catch(() => "");
        throw new Error(`HTTP ${resp.status}: ${text.slice(0, 200)}`);
      }

      const reader = resp.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;
        let nl: number;
        while ((nl = buffer.indexOf("\n\n")) !== -1) {
          const chunk = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 2);
          const event = parseSSE(chunk);
          if (!event) continue;
          if (event.event === "citations") {
            const d = event.data as { citations: CitationView[] };
            result.citations = d.citations;
            setCurrent({ ...result });
          } else if (event.event === "text") {
            result.answer += (event.data as { delta: string }).delta;
            setCurrent({ ...result });
          } else if (event.event === "done") {
            const data = event.data as { source_kind: "rag" | "no_answer"; latency_ms: number };
            result.source_kind = data.source_kind;
            result.latency_ms = data.latency_ms;
            setCurrent({ ...result });
          }
        }
      }

      // Promote to history in sidebar mode.
      if (variant === "sidebar") {
        setHistory((h) => [...h, result]);
        setCurrent(null);
      }
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  }

  if (variant === "sidebar") {
    return (
      <div className="flex flex-col h-full bg-[#062b22]/40">
        <div className="px-5 py-4 border-b border-white/[.06] flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-emerald-400/15 border border-emerald-400/30 flex items-center justify-center">
            <Sparkle />
          </div>
          <div className="flex-1">
            <div className="text-[14px] font-semibold text-white">{sidebarTitle}</div>
            <div className="text-[11px] text-[#86b69a]">{sidebarSubtitle}</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {history.map((h, i) => (
            <ConversationTurn
              key={i}
              item={h}
              thinkingText={thinkingText}
              noAnswerWarning={noAnswerWarning}
            />
          ))}
          {current ? (
            <ConversationTurn
              item={current}
              streaming={pending}
              thinkingText={thinkingText}
              noAnswerWarning={noAnswerWarning}
            />
          ) : null}
          {error ? (
            <div className="text-[12px] text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-md px-3 py-2">
              {error}
            </div>
          ) : null}
          <div ref={bottomRef} />
          {history.length === 0 && !current && !pending ? (
            <div className="text-[13px] text-[#86b69a] text-center pt-8">{emptyState}</div>
          ) : null}
        </div>

        <div className="p-3 border-t border-white/[.06]">
          <Composer
            value={input}
            onChange={setInput}
            onSubmit={() => ask(input)}
            pending={pending}
            placeholder={placeholder}
          />
          {examples.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {examples.map((ex) => (
                <button
                  key={ex}
                  onClick={() => ask(ex)}
                  disabled={pending}
                  className="px-2 py-1 rounded-full bg-white/[.04] border border-white/[.08] text-[#c4e9d3] text-[11px] hover:bg-white/[.08] disabled:opacity-50"
                >
                  {ex}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  // === hero variant ===
  return (
    <div className="max-w-2xl mx-auto">
      <div className="rounded-2xl border border-white/[.08] bg-[#0a3a2f]/80 backdrop-blur shadow-[0_4px_24px_rgba(0,0,0,.25),0_1px_0_rgba(255,255,255,.04)_inset] p-3 sm:p-4">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="w-9 h-9 sm:w-11 sm:h-11 shrink-0 rounded-lg bg-emerald-400/15 border border-emerald-400/30 flex items-center justify-center">
            <Sparkle />
          </div>
          <div className="flex-1 text-left min-w-0">
            <div className="text-[12px] sm:text-[13px] text-[#86b69a] mb-1">Ask the agent assistant</div>
            <Composer
              value={input}
              onChange={setInput}
              onSubmit={() => ask(input)}
              pending={pending}
              placeholder={placeholder}
              variant="hero"
            />
          </div>
          <button
            onClick={() => ask(input)}
            disabled={pending || !input.trim()}
            className="self-stretch px-3 sm:px-5 rounded-md bg-emerald-400 text-[#04241e] font-semibold hover:bg-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed text-[13px] sm:text-[14px]"
          >
            {pending ? "…" : askLabel}
          </button>
        </div>
        {examples.length > 0 && !current ? (
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-3 sm:mt-4 sm:pl-[60px]">
            {examples.map((ex) => (
              <button
                key={ex}
                onClick={() => ask(ex)}
                disabled={pending}
                className="px-2.5 py-1 rounded-full bg-white/[.04] border border-white/[.08] text-[#c4e9d3] text-[11px] sm:text-[12px] hover:bg-white/[.08]"
              >
                {ex}
              </button>
            ))}
          </div>
        ) : null}
        {error ? (
          <div className="mt-3 text-[12px] text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-md px-3 py-2">
            {error}
          </div>
        ) : null}
      </div>

      {current ? (
        <div className="mt-4 rounded-2xl border border-white/[.08] bg-[#0a3a2f]/60 p-4 text-left">
          <ConversationTurn
            item={current}
            streaming={pending}
            thinkingText={thinkingText}
            noAnswerWarning={noAnswerWarning}
          />
        </div>
      ) : null}
    </div>
  );
}

function ConversationTurn({
  item,
  streaming = false,
  thinkingText = "Thinking…",
  noAnswerWarning = "⚠ Not found in operator content. Answer is from general knowledge.",
}: {
  item: AskAIResult;
  streaming?: boolean;
  thinkingText?: string;
  noAnswerWarning?: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <div className="bg-emerald-700/40 border border-emerald-400/20 rounded-lg rounded-tr-sm px-3 py-2 max-w-[85%] text-[13px] text-white">
          {item.question}
        </div>
      </div>
      {item.answer || streaming ? (
        <div className="bg-[#0d4538] border border-white/[.06] rounded-lg rounded-tl-sm px-3.5 py-2.5 max-w-[92%] text-[13.5px] text-[#e6f5ec] leading-relaxed whitespace-pre-wrap">
          {renderAnswerWithCitations(item.answer, item.citations)}
          {streaming && !item.answer ? <span className="opacity-60">{thinkingText}</span> : null}
          {streaming && item.answer ? <span className="inline-block w-1.5 h-3 bg-emerald-300 align-middle ml-0.5 animate-pulse" /> : null}
        </div>
      ) : null}
      {item.citations.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 max-w-[92%]">
          {item.citations.slice(0, 5).map((c, i) => (
            <a
              key={c.id}
              href={`/learn/${c.operator_slug}/${c.course_slug}?m=${c.module_slug}`}
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-400/10 border border-emerald-400/30 text-emerald-200 text-[11px] hover:bg-emerald-400/20"
              title={c.snippet}
            >
              <span className="font-mono">[{i + 1}]</span>
              <span>{c.operator_name} · {c.course_title}</span>
            </a>
          ))}
        </div>
      ) : item.source_kind === "no_answer" ? (
        <div className="text-[11px] text-amber-300/80">{noAnswerWarning}</div>
      ) : null}
    </div>
  );
}

function Composer({
  value,
  onChange,
  onSubmit,
  pending,
  placeholder,
  variant = "default",
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  pending: boolean;
  placeholder?: string;
  variant?: "default" | "hero";
}) {
  if (variant === "hero") {
    return (
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
          }
        }}
        disabled={pending}
        placeholder={placeholder}
        className="w-full bg-transparent text-[14px] sm:text-[16px] text-white outline-none placeholder:text-[#5d9279]"
      />
    );
  }
  return (
    <div className="rounded-lg border border-white/[.08] bg-[#0a3a2f] flex items-center gap-2 px-3 py-2">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
          }
        }}
        disabled={pending}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-[13.5px] text-white outline-none placeholder:text-[#5d9279]"
      />
      <button
        onClick={onSubmit}
        disabled={pending || !value.trim()}
        className="px-2 py-0.5 rounded-md text-[11px] font-mono text-[#04241e] bg-emerald-400 disabled:opacity-50"
      >
        ↵
      </button>
    </div>
  );
}

function Sparkle() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3l1.8 4.7L18 9.5l-4.2 1.8L12 16l-1.8-4.7L6 9.5l4.2-1.8L12 3z"
        fill="#34d399"
        stroke="#10b981"
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Replace [^1], [^2] in the answer with superscript chips linking to the citation.
 */
function renderAnswerWithCitations(text: string, citations: CitationView[]): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const re = /\[\^?(\d+)\]/g;
  let lastIdx = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > lastIdx) parts.push(text.slice(lastIdx, m.index));
    const n = parseInt(m[1], 10);
    const c = citations[n - 1];
    parts.push(
      c ? (
        <a
          key={`c-${m.index}`}
          href={`/learn/${c.operator_slug}/${c.course_slug}?m=${c.module_slug}`}
          className="inline-block align-super text-[10px] font-mono px-1 rounded bg-emerald-400/20 text-emerald-200 hover:bg-emerald-400/40"
          title={c.snippet}
        >
          {n}
        </a>
      ) : (
        <span key={`c-${m.index}`} className="align-super text-[10px] opacity-50">[{n}]</span>
      ),
    );
    lastIdx = re.lastIndex;
  }
  if (lastIdx < text.length) parts.push(text.slice(lastIdx));
  return parts;
}

function parseSSE(chunk: string): { event: string; data: unknown } | null {
  let event = "message";
  const dataLines: string[] = [];
  for (const line of chunk.split("\n")) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
  }
  if (dataLines.length === 0) return null;
  try {
    return { event, data: JSON.parse(dataLines.join("\n")) };
  } catch {
    return null;
  }
}
