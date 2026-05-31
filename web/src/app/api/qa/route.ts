/**
 * AI Q&A endpoint.
 *
 * POST { question: string, scope?: { operator_id?: string, course_id?: string } }
 *
 * Returns a streaming SSE response:
 *   - event: "citations"  data: { citations: [...] }   (sent first, all retrieval metadata)
 *   - event: "text"       data: { delta: "..." }       (streamed Claude tokens)
 *   - event: "done"       data: { latency_ms, source_kind }
 *
 * Auth: Clerk session (must be signed in). We log every Q to qa_logs for the
 * operator-dashboard insights panel (D9).
 */
import Anthropic from "@anthropic-ai/sdk";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import {
  retrieve,
  getAllCourseChunks,
  buildSystemBlocks,
  tavilyWebSearch,
  buildWebSystemBlocks,
  type Citation,
  type WebCitation,
} from "@/lib/rag";

export const dynamic = "force-dynamic";

interface QARequest {
  question?: string;
  scope?: { operator_id?: string; course_id?: string };
}

const MODEL = "claude-sonnet-4-5-20250929"; // current as of MVP build; update with the latest fast Sonnet

export async function POST(req: Request) {
  const start = Date.now();
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ ok: false, error: "unauthorised" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as QARequest;
  const question = (body.question ?? "").trim();
  if (!question || question.length > 1000) {
    return Response.json({ ok: false, error: "invalid_question" }, { status: 400 });
  }
  const scope = body.scope ?? {};

  const { env } = getCloudflareContext();

  // Citations shown to the user = top relevant snippets (always a similarity search).
  const citations = await retrieve(question, scope, 5);

  // If operator content has nothing, try Tavily web search as a fallback.
  let webCitations: WebCitation[] = [];
  if (citations.length === 0) {
    webCitations = await tavilyWebSearch(question, 5);
  }

  const sourceKind: "rag" | "web" | "no_answer" =
    citations.length > 0 ? "rag" : webCitations.length > 0 ? "web" : "no_answer";

  // Context fed to Claude:
  //   - course-scoped + RAG hit → the WHOLE course (stable across follow-ups → prompt-cache hit)
  //   - RAG hit, no course scope → the top relevant snippets from retrieval
  //   - no RAG hit, web hit       → Tavily web snippets
  //   - nothing → minimal no-answer system prompt
  const cacheable = !!scope.course_id && citations.length > 0;
  let contextCitations = citations;
  if (cacheable) {
    const all = await getAllCourseChunks(scope.course_id!);
    if (all.length > 0) contextCitations = all;
  }

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const systemBlocks =
    contextCitations.length > 0
      ? buildSystemBlocks(contextCitations, cacheable)
      : webCitations.length > 0
        ? buildWebSystemBlocks(webCitations)
        : [
            {
              type: "text" as const,
              text: `You are Libretour's product assistant for New Zealand travel agents. Answer in the same language as the question. We could not find relevant operator content or web information for this question — be honest about that and offer general knowledge if useful.`,
            },
          ];

  // Pull user lang preference for logs (not used by Claude — it auto-detects).
  const user = await currentUser().catch(() => null);
  const detectedLang = guessLang(question);

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      function send(event: string, data: unknown) {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      }

      // Unified citation list — RAG chips first, then web chips. The client
      // tells them apart via the `kind` field.
      const ragPayload = citations.map(toCitationPayload);
      const webPayload = webCitations.map(toWebCitationPayload);
      send("citations", { citations: [...ragPayload, ...webPayload] });

      let answerText = "";
      let cacheRead = 0;
      let cacheWrite = 0;
      try {
        const claudeStream = client.messages.stream({
          model: MODEL,
          max_tokens: 800,
          system: systemBlocks,
          messages: [{ role: "user", content: question }],
        });
        for await (const event of claudeStream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            const delta = event.delta.text;
            answerText += delta;
            send("text", { delta });
          }
          // Capture cache usage from the message_start / message_delta usage fields.
          if (event.type === "message_start") {
            const u = event.message.usage as {
              cache_read_input_tokens?: number;
              cache_creation_input_tokens?: number;
            };
            cacheRead = u.cache_read_input_tokens ?? 0;
            cacheWrite = u.cache_creation_input_tokens ?? 0;
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        send("text", { delta: `\n\n_(LLM error: ${msg})_` });
      }

      const latency_ms = Date.now() - start;
      send("done", {
        latency_ms,
        source_kind: sourceKind,
        cache: { read: cacheRead, write: cacheWrite, hit: cacheRead > 0 },
      });
      controller.close();

      // Best-effort log; don't fail the response on db hiccup.
      try {
        const logId = `qa_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
        await env.DB.prepare(
          `INSERT INTO qa_logs
             (id, user_id, course_id, operator_id, question, question_lang,
              answer, answer_lang, source_kind, citations_json, latency_ms)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
          .bind(
            logId,
            userId,
            scope.course_id ?? null,
            scope.operator_id ?? citations[0]?.operator_id ?? null,
            question,
            detectedLang,
            answerText,
            detectedLang,
            sourceKind,
            JSON.stringify([
              ...citations.map((c) => ({ chunk_id: c.chunk_id, snippet: c.text.slice(0, 200) })),
              ...webCitations.map((c) => ({ url: c.url, title: c.title, snippet: c.snippet.slice(0, 200) })),
            ]),
            latency_ms,
          )
          .run();
      } catch {
        // swallow — logging is not on the critical path
      }
      void user; // tsc-noUnusedLocals silence
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      "x-accel-buffering": "no",
    },
  });
}

function toCitationPayload(c: Citation) {
  return {
    kind: "rag" as const,
    id: c.chunk_id,
    score: c.score,
    operator_name: c.operator_name,
    operator_slug: c.operator_slug,
    course_title: c.course_title,
    course_slug: c.course_slug,
    module_title: c.module_title,
    module_slug: c.module_slug,
    snippet: c.text.slice(0, 180),
  };
}

function toWebCitationPayload(c: WebCitation) {
  return {
    kind: "web" as const,
    id: c.id,
    score: c.score,
    url: c.url,
    title: c.title,
    snippet: c.snippet.slice(0, 180),
  };
}

/**
 * Cheap language guess for logging purposes only. Claude's own detection is
 * authoritative for the answer itself.
 */
function guessLang(s: string): string {
  if (/[一-鿿]/.test(s)) return /[぀-ゟ゠-ヿ]/.test(s) ? "ja" : "zh";
  if (/[぀-ゟ゠-ヿ]/.test(s)) return "ja";
  if (/[가-힯]/.test(s)) return "ko";
  return "en";
}
