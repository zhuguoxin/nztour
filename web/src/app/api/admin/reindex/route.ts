/**
 * RAG ingestion endpoint.
 *
 * Walks all published content_blocks, chunks them, embeds via Workers AI
 * (bge-m3, multilingual), upserts into Vectorize index + mirrors metadata
 * into the `rag_chunks` table for citation joins.
 *
 * MVP-only authn: requires a header `x-reindex-token` matching the
 * REINDEX_TOKEN secret. Replace with platform-admin Clerk role check in v0.2.
 *
 * Usage:
 *   curl -X POST -H "x-reindex-token: $TOKEN" http://localhost:3100/api/admin/reindex
 *   curl -X POST -H "x-reindex-token: $TOKEN" https://tourtrain.<acct>.workers.dev/api/admin/reindex
 *
 * Returns:
 *   { ok: true, chunks_processed, chunks_upserted, took_ms }
 */
import { getCloudflareContext } from "@opennextjs/cloudflare";

// Don't declare `runtime = "edge"` — OpenNext's Cloudflare adapter handles
// the runtime, and declaring edge breaks getCloudflareContext binding access
// in `next dev`.
export const dynamic = "force-dynamic";

interface BlockForIndexing {
  block_id: string;
  module_id: string;
  course_id: string;
  operator_id: string;
  text: string;
  caption: string | null;
  kind: string;
  lang: string;
}

interface ChunkRecord {
  id: string;            // rag_chunks.id + vectorize id
  operator_id: string;
  course_id: string;
  module_id: string;
  source_block_id: string;
  lang: string;
  text: string;
  token_count: number;
}

// bge-m3 outputs 1024-d vectors; Vectorize index was created with the same.
const EMBED_MODEL = "@cf/baai/bge-m3";
const MAX_CHUNK_CHARS = 1200; // ~300 tokens for English; conservative for CJK
const MIN_CHUNK_CHARS = 80;

export async function POST(req: Request) {
  const start = Date.now();
  const { env } = getCloudflareContext();

  const tokenHeader = req.headers.get("x-reindex-token");
  if (!tokenHeader || tokenHeader !== env.REINDEX_TOKEN) {
    return Response.json({ ok: false, error: "unauthorised" }, { status: 401 });
  }

  // 1) Pull all indexable blocks from D1.
  const { results: blocks } = await env.DB.prepare(
    `SELECT
       b.id AS block_id, b.module_id, b.kind, b.text_md, b.caption, b.lang,
       m.course_id, c.operator_id
     FROM content_blocks b
     JOIN modules m ON m.id = b.module_id
     JOIN courses c ON c.id = m.course_id
     WHERE c.status = 'published'
       AND (b.text_md IS NOT NULL OR b.caption IS NOT NULL)`,
  ).all<{
    block_id: string;
    module_id: string;
    kind: string;
    text_md: string | null;
    caption: string | null;
    lang: string;
    course_id: string;
    operator_id: string;
  }>();

  const sourceBlocks: BlockForIndexing[] = (blocks ?? []).map((b) => ({
    block_id: b.block_id,
    module_id: b.module_id,
    course_id: b.course_id,
    operator_id: b.operator_id,
    text: b.text_md ?? b.caption ?? "",
    caption: b.caption,
    kind: b.kind,
    lang: b.lang ?? "en",
  }));

  // 2) Chunk.
  const chunks: ChunkRecord[] = [];
  for (const b of sourceBlocks) {
    const pieces = chunkText(b.text, MAX_CHUNK_CHARS, MIN_CHUNK_CHARS);
    pieces.forEach((piece, i) => {
      const text = b.caption && i === 0 ? `${b.caption}\n\n${piece}` : piece;
      chunks.push({
        id: `rc_${b.block_id}_${i.toString().padStart(2, "0")}`,
        operator_id: b.operator_id,
        course_id: b.course_id,
        module_id: b.module_id,
        source_block_id: b.block_id,
        lang: b.lang,
        text: text.trim(),
        token_count: Math.ceil(text.length / 4), // rough
      });
    });
  }

  if (chunks.length === 0) {
    return Response.json({ ok: true, chunks_processed: 0, chunks_upserted: 0, took_ms: Date.now() - start });
  }

  // 3) Embed in batches and upsert to Vectorize + rag_chunks.
  // Workers AI bge-m3 accepts an array of strings (up to ~100). We use 32.
  const EMBED_BATCH = 32;
  let upserted = 0;

  for (let i = 0; i < chunks.length; i += EMBED_BATCH) {
    const batch = chunks.slice(i, i + EMBED_BATCH);
    const inputs = batch.map((c) => c.text);
    // Cloudflare's Workers AI binding shape — `env.AI.run` is the standard.
    // Types may not be fully resolved at compile time; cast as any if needed.
    const embedResp = (await (env.AI as { run: (m: string, i: { text: string[] }) => Promise<{ data: number[][] }> }).run(
      EMBED_MODEL,
      { text: inputs },
    )) as { data: number[][] };

    const vectors = batch.map((c, j) => ({
      id: c.id,
      values: embedResp.data[j],
      metadata: {
        operator_id: c.operator_id,
        course_id: c.course_id,
        module_id: c.module_id,
        source_block_id: c.source_block_id,
        lang: c.lang,
      } as Record<string, string>,
    }));

    await env.RAG.upsert(vectors);

    // Mirror into rag_chunks for citation joins.
    const stmts = batch.map((c) =>
      env.DB.prepare(
        `INSERT OR REPLACE INTO rag_chunks
           (id, operator_id, course_id, module_id, source_file_id, lang, text, token_count)
         VALUES (?, ?, ?, ?, NULL, ?, ?, ?)`,
      ).bind(c.id, c.operator_id, c.course_id, c.module_id, c.lang, c.text, c.token_count),
    );
    await env.DB.batch(stmts);

    upserted += batch.length;
  }

  return Response.json({
    ok: true,
    chunks_processed: chunks.length,
    chunks_upserted: upserted,
    took_ms: Date.now() - start,
  });
}

/**
 * Sentence-aware chunker. Splits on paragraph then sentence, packing into
 * chunks of ~maxChars while keeping at least minChars per chunk where possible.
 * If a single sentence is longer than maxChars, hard-cuts it.
 */
function chunkText(input: string, maxChars: number, minChars: number): string[] {
  const text = input.replace(/\r\n/g, "\n").trim();
  if (!text) return [];
  if (text.length <= maxChars) return [text];

  // Split on paragraphs first.
  const paras = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const sentences: string[] = [];
  for (const p of paras) {
    // Sentence boundaries for EN/CJK.
    const parts = p.split(/(?<=[.!?。！？])\s+/).map((s) => s.trim()).filter(Boolean);
    sentences.push(...parts);
  }

  const out: string[] = [];
  let buf = "";
  for (const s of sentences) {
    if ((buf + " " + s).length > maxChars) {
      if (buf.length >= minChars) {
        out.push(buf.trim());
        buf = s;
      } else {
        buf = (buf + " " + s).trim();
        if (buf.length > maxChars) {
          // Hard cut.
          for (let i = 0; i < buf.length; i += maxChars) {
            out.push(buf.slice(i, i + maxChars));
          }
          buf = "";
        }
      }
    } else {
      buf = buf ? `${buf} ${s}` : s;
    }
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}
