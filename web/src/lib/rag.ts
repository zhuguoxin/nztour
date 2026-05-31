/**
 * RAG retrieval helpers: embed a query, search Vectorize, hydrate citations
 * from D1 (rag_chunks + courses + operators + modules joins).
 *
 * Used by /api/qa.
 */
import { getCloudflareContext } from "@opennextjs/cloudflare";

const EMBED_MODEL = "@cf/baai/bge-m3";

export interface Citation {
  chunk_id: string;
  text: string;
  score: number;
  operator_id: string;
  operator_name: string;
  course_id: string;
  course_title: string;
  course_slug: string;
  operator_slug: string;
  module_id: string;
  module_title: string;
  module_slug: string;
  lang: string;
}

export interface RetrievalScope {
  operator_id?: string; // restrict to one operator (e.g. on the course page)
  course_id?: string;   // restrict further to a single course
}

export async function embedQuery(query: string): Promise<number[]> {
  const { env } = getCloudflareContext();
  const resp = (await (env.AI as { run: (m: string, i: { text: string[] }) => Promise<{ data: number[][] }> }).run(
    EMBED_MODEL,
    { text: [query] },
  )) as { data: number[][] };
  return resp.data[0];
}

export async function retrieve(
  query: string,
  scope: RetrievalScope = {},
  topK = 5,
): Promise<Citation[]> {
  const { env } = getCloudflareContext();
  const vector = await embedQuery(query);

  // Vectorize doesn't support compound filters cleanly across all index types;
  // we over-fetch and filter in app code. topK*4 is plenty for MVP.
  const result = await env.RAG.query(vector, {
    topK: topK * 4,
    returnMetadata: "all",
  });

  let matches = result.matches ?? [];
  if (scope.operator_id) {
    matches = matches.filter((m) => m.metadata?.operator_id === scope.operator_id);
  }
  if (scope.course_id) {
    matches = matches.filter((m) => m.metadata?.course_id === scope.course_id);
  }
  matches = matches.slice(0, topK);
  if (matches.length === 0) return [];

  const ids = matches.map((m) => m.id);
  const placeholders = ids.map(() => "?").join(",");
  const { results: rows } = await env.DB.prepare(
    `SELECT
       rc.id AS chunk_id, rc.text AS text, rc.lang AS lang,
       rc.operator_id, rc.course_id, rc.module_id,
       o.name AS operator_name, o.slug AS operator_slug,
       c.title AS course_title, c.slug AS course_slug,
       m.title AS module_title, m.slug AS module_slug
     FROM rag_chunks rc
     JOIN operators o ON o.id = rc.operator_id
     JOIN courses c   ON c.id = rc.course_id
     JOIN modules m   ON m.id = rc.module_id
     WHERE rc.id IN (${placeholders})`,
  )
    .bind(...ids)
    .all<{
      chunk_id: string;
      text: string;
      lang: string;
      operator_id: string;
      course_id: string;
      module_id: string;
      operator_name: string;
      operator_slug: string;
      course_title: string;
      course_slug: string;
      module_title: string;
      module_slug: string;
    }>();

  const byId = new Map(rows!.map((r) => [r.chunk_id, r]));
  const citations: Citation[] = [];
  for (const m of matches) {
    const row = byId.get(m.id);
    if (!row) continue;
    citations.push({
      chunk_id: m.id,
      text: row.text,
      score: m.score,
      operator_id: row.operator_id,
      operator_name: row.operator_name,
      course_id: row.course_id,
      course_title: row.course_title,
      course_slug: row.course_slug,
      operator_slug: row.operator_slug,
      module_id: row.module_id,
      module_title: row.module_title,
      module_slug: row.module_slug,
      lang: row.lang,
    });
  }
  return citations;
}

/**
 * Load EVERY chunk for a single course (not a similarity search). A course is
 * small (~10-30 chunks), so for course-scoped Q&A we feed the whole thing to
 * Claude as a STABLE context block. Because it's identical across every
 * follow-up question in that course, it becomes a prompt-cache hit (see
 * buildSystemБlocks) — near-instant, ~10% input cost on the 2nd+ question.
 */
export async function getAllCourseChunks(courseId: string): Promise<Citation[]> {
  const { env } = getCloudflareContext();
  const { results: rows } = await env.DB.prepare(
    `SELECT
       rc.id AS chunk_id, rc.text AS text, rc.lang AS lang,
       rc.operator_id, rc.course_id, rc.module_id,
       o.name AS operator_name, o.slug AS operator_slug,
       c.title AS course_title, c.slug AS course_slug,
       m.title AS module_title, m.slug AS module_slug
     FROM rag_chunks rc
     JOIN operators o ON o.id = rc.operator_id
     JOIN courses c   ON c.id = rc.course_id
     JOIN modules m   ON m.id = rc.module_id
     WHERE rc.course_id = ?
     ORDER BY m.position, rc.id`,
  )
    .bind(courseId)
    .all<{
      chunk_id: string;
      text: string;
      lang: string;
      operator_id: string;
      course_id: string;
      module_id: string;
      operator_name: string;
      operator_slug: string;
      course_title: string;
      course_slug: string;
      module_title: string;
      module_slug: string;
    }>();
  return (rows ?? []).map((row) => ({
    chunk_id: row.chunk_id,
    text: row.text,
    score: 1,
    operator_id: row.operator_id,
    operator_name: row.operator_name,
    course_id: row.course_id,
    course_title: row.course_title,
    course_slug: row.course_slug,
    operator_slug: row.operator_slug,
    module_id: row.module_id,
    module_title: row.module_title,
    module_slug: row.module_slug,
    lang: row.lang,
  }));
}

const SYSTEM_INSTRUCTIONS = `You are Libretour's product assistant for New Zealand travel agents.
Your job: answer the agent's question concisely and practically, in the SAME LANGUAGE they used to ask.
Tone: professional, direct, knowledgeable. No marketing fluff.

When the answer is grounded in a snippet below, cite it inline using bracketed markers like [^1], [^2]. Do NOT cite snippets that don't actually support your statement.

If the snippets don't contain enough information to answer, say so clearly and offer what you do know — or suggest the agent ask the operator directly.

Keep answers under 200 words unless a longer answer is genuinely needed.`;

/** Anthropic system param: array of text blocks. The snippets block carries
 *  cache_control so the (stable) instructions + context prefix is cached. */
type SystemBlock = {
  type: "text";
  text: string;
  cache_control?: { type: "ephemeral" };
};

function renderSnippets(citations: Citation[]): string {
  return citations
    .map(
      (c, i) =>
        `[Source ${i + 1}] (Operator: ${c.operator_name} · Course: ${c.course_title} · Module: ${c.module_title})\n${c.text}`,
    )
    .join("\n\n");
}

/**
 * Structured system blocks for the Anthropic SDK with prompt caching.
 *
 * `cacheable=true` (course-scoped, stable full-course context) → mark the
 * snippets block with cache_control so the whole prefix is cached for 5 min.
 * `cacheable=false` (hero search, snippets vary per query) → no cache marker.
 */
export function buildSystemBlocks(citations: Citation[], cacheable: boolean): SystemBlock[] {
  const snippetsBlock: SystemBlock = {
    type: "text",
    text: `=== SNIPPETS ===\n${renderSnippets(citations)}\n=== END SNIPPETS ===`,
  };
  if (cacheable) {
    snippetsBlock.cache_control = { type: "ephemeral" };
  }
  return [{ type: "text", text: SYSTEM_INSTRUCTIONS }, snippetsBlock];
}

// ===========================================================================
//  Tavily web fallback — used when RAG returns 0 hits (or no operator content
//  was provided yet). Results are wrapped as "web citations" with a `kind`
//  discriminator so the client renders them with a different chip (globe icon
//  + external link).
// ===========================================================================

export interface WebCitation {
  kind: "web";
  id: string;
  score: number;
  url: string;
  title: string;
  snippet: string;
}

interface TavilyResponse {
  answer?: string;
  results?: Array<{ title: string; url: string; content: string; score?: number }>;
}

/** Calls Tavily search. Returns [] silently if no key configured. */
export async function tavilyWebSearch(
  query: string,
  maxResults = 5,
): Promise<WebCitation[]> {
  const { env } = getCloudflareContext();
  const key = (env as { TAVILY_API_KEY?: string }).TAVILY_API_KEY;
  if (!key) return [];

  try {
    const r = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        api_key: key,
        query,
        search_depth: "basic",
        max_results: maxResults,
        include_answer: false,
      }),
    });
    if (!r.ok) return [];
    const data = (await r.json()) as TavilyResponse;
    return (data.results ?? []).map((res, i) => ({
      kind: "web" as const,
      id: `web_${i}`,
      score: res.score ?? 0,
      url: res.url,
      title: res.title,
      snippet: res.content.slice(0, 400),
    }));
  } catch {
    return [];
  }
}

const WEB_SYSTEM_INSTRUCTIONS = `You are Libretour's product assistant for New Zealand travel agents.
You were not able to find an answer in any operator's course content, so the snippets below come from a public web search.
Answer in the SAME LANGUAGE the agent used. Be concise (under 200 words).

Cite sources inline using bracketed markers [^1], [^2] — these correspond to the numbered web snippets below.
Begin your answer with a brief one-sentence caveat that the information is from the public web, not from a verified Libretour operator. Use the agent's own language for the caveat (e.g. "以下信息来自公开网络…" in Chinese, "Heads up — this is from the public web…" in English).`;

/** Build system blocks for the Tavily web fallback path. Not cacheable: each
 *  query yields fresh snippets and we want a low-friction one-shot call. */
export function buildWebSystemBlocks(web: WebCitation[]): SystemBlock[] {
  const snippets = web
    .map((c, i) => `[Web Source ${i + 1}] ${c.title}\nURL: ${c.url}\n${c.snippet}`)
    .join("\n\n");
  return [
    { type: "text", text: WEB_SYSTEM_INSTRUCTIONS },
    { type: "text", text: `=== WEB SNIPPETS ===\n${snippets}\n=== END SNIPPETS ===` },
  ];
}

/** Back-compat string builder (no caching). Kept for the no-citation path. */
export function buildSystemPrompt(citations: Citation[]): string {
  return `${SYSTEM_INSTRUCTIONS}\n\n=== SNIPPETS ===\n${renderSnippets(citations)}\n=== END SNIPPETS ===`;
}
