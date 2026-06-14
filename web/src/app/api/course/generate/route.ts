/**
 * POST /api/course/generate — turn an uploaded source file (PDF / text /
 * markdown) into a real, structured draft course using Claude.
 *
 * Body (multipart):
 *   operator_slug — the product the course belongs to (auth scope)
 *   file          — PDF or text/markdown, ≤ 20 MB
 *   title         — (optional) a title hint for the course
 *   notes         — (optional) author guidance (focus, audience, language)
 *
 * Flow:
 *   1. Auth (operator membership) + validate the file.
 *   2. Send the file to Claude (native PDF support for PDFs; inline text
 *      otherwise) and ask for a structured course JSON.
 *   3. Create the course + modules + text blocks in D1 (status='draft').
 *   4. Stash the original file in R2 + a source_files row.
 *   5. Return { ok, slug } so the client can open the editor.
 *
 * Returns errors as JSON/text (never an opaque 500) so the UI can show why.
 */
import { db } from "@/lib/db";
import { requireOperatorMembership } from "@/lib/roles";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { isSupportedLang } from "@/lib/translate";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";

const MODEL = "claude-sonnet-4-5-20250929";
const MAX_BYTES = 20 * 1024 * 1024;

function shortId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 60) || `c-${Date.now().toString(36)}`
  );
}

/** Map whatever language code Claude returns (e.g. "en-NZ", "zh", "zh-Hant")
 *  to one of our supported codes; default to English. */
function normalizeLang(raw: unknown): string {
  const c = String(raw ?? "").toLowerCase();
  if (c.startsWith("zh")) return c.includes("tw") || c.includes("hant") ? "zh-TW" : "zh-CN";
  const base = c.split("-")[0];
  if (isSupportedLang(base)) return base;
  if (isSupportedLang(c)) return c;
  return "en";
}

function toBase64(bytes: Uint8Array): string {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

const SYSTEM = `You are an instructional designer for the New Zealand tourism industry. You turn a supplier's source material (brochures, decks, fact sheets, rate cards) into a structured B2B training course that travel agents study to sell the product confidently.

Principles:
- Be faithful to the source. Never invent prices, dates, altitudes, distances, or policies that aren't in the material.
- Organise into a logical learning flow: overview first, then the details an agent needs (product, terrain/experience, logistics, booking, selling points).
- Write for a professional travel agent, not a tourist. Concise, factual, skimmable.
- Each content block is a self-contained markdown passage. You may use ## subheadings, **bold**, and bullet lists.`;

interface GeneratedCourse {
  title?: string;
  summary?: string;
  emoji?: string;
  est_minutes?: number;
  primary_lang?: string;
  modules?: Array<{
    title?: string;
    summary?: string;
    blocks?: Array<{ text_md?: string; text?: string }>;
  }>;
}

export async function POST(req: Request) {
  const { env } = getCloudflareContext();
  if (!env.ANTHROPIC_API_KEY) {
    return new Response("ANTHROPIC_API_KEY not configured.", { status: 503 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return new Response("invalid multipart body", { status: 400 });
  }

  const operatorSlug = String(form.get("operator_slug") ?? "");
  const titleHint = String(form.get("title") ?? "").trim().slice(0, 200);
  const notes = String(form.get("notes") ?? "").trim().slice(0, 500);
  const file = form.get("file");
  if (!operatorSlug || !(file instanceof Blob)) {
    return new Response("missing required fields", { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return new Response(`file exceeds ${MAX_BYTES} bytes`, { status: 413 });
  }
  const filename = (file as File).name ?? "source";
  const mime = file.type || "application/octet-stream";
  const isPdf = mime === "application/pdf" || /\.pdf$/i.test(filename);
  const isText = mime.startsWith("text/") || /\.(txt|md|markdown)$/i.test(filename);
  if (!isPdf && !isText) {
    return new Response("Upload a PDF or a text / markdown file.", { status: 415 });
  }

  let access;
  try {
    access = await requireOperatorMembership(operatorSlug);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "forbidden";
    return new Response(msg, { status: msg === "unauthorised" ? 401 : 403 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());

  const userText = [
    `Create a training course from the attached source material${
      titleHint ? ` (working title: "${titleHint}")` : ""
    }.`,
    notes ? `Author notes: ${notes}` : "",
    "",
    'Return ONLY a JSON object of this exact shape:',
    '{"title": string, "summary": string, "emoji": string, "est_minutes": number, "primary_lang": string, "modules": [{"title": string, "summary": string, "blocks": [{"text_md": string}]}]}',
    "",
    "Rules:",
    "- 4 to 7 modules; each module has 2 to 4 blocks.",
    "- Each block.text_md is a self-contained markdown passage.",
    '- primary_lang is the BCP-47 code of the source language (e.g. "en", "zh-CN", "ja").',
    "- emoji is a single emoji that fits the product.",
    "- est_minutes is the total reading time in minutes.",
    "- Output valid JSON only — no markdown fences, no commentary.",
  ]
    .filter(Boolean)
    .join("\n");

  const content: Anthropic.MessageParam["content"] = isPdf
    ? [
        {
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data: toBase64(bytes) },
        },
        { type: "text", text: userText },
      ]
    : `${userText}\n\nSOURCE MATERIAL:\n${new TextDecoder().decode(bytes).slice(0, 100_000)}`;

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  let resp;
  try {
    resp = await client.messages.create({
      model: MODEL,
      max_tokens: 8192,
      system: SYSTEM,
      messages: [
        { role: "user", content },
        { role: "assistant", content: "{" }, // prefill → forces a bare JSON object
      ],
    });
  } catch (e) {
    const status = (e as { status?: number })?.status;
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(`Claude error${status ? ` (${status})` : ""}: ${msg}`, { status: 502 });
  }

  if (resp.stop_reason === "max_tokens") {
    return new Response(
      "The source is too large to convert in one pass — try a shorter document.",
      { status: 502 },
    );
  }

  const text = resp.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  let obj: GeneratedCourse | null = null;
  for (const cand of ["{" + text, text]) {
    try {
      const v = JSON.parse(cand);
      if (v && typeof v === "object") {
        obj = v as GeneratedCourse;
        break;
      }
    } catch {
      /* try next */
    }
  }
  if (!obj) {
    return new Response(`Could not parse the generated course: ${text.slice(0, 160)}`, {
      status: 502,
    });
  }

  const modules = Array.isArray(obj.modules) ? obj.modules : [];
  if (modules.length === 0) {
    return new Response("No modules were generated from this source.", { status: 502 });
  }

  // ---- Course fields --------------------------------------------------------
  const title = (String(obj.title || titleHint || "Untitled course").trim() || "Untitled course").slice(0, 200);
  const summary = obj.summary ? String(obj.summary).trim().slice(0, 1000) : null;
  const emoji = obj.emoji ? String(obj.emoji).trim().slice(0, 8) : null;
  const primaryLang = normalizeLang(obj.primary_lang);
  const est =
    typeof obj.est_minutes === "number" && Number.isFinite(obj.est_minutes)
      ? Math.min(600, Math.max(1, Math.round(obj.est_minutes)))
      : null;

  const courseId = shortId("c");
  let slug = slugify(title);
  const exists = await db()
    .prepare(`SELECT 1 FROM courses WHERE operator_id = ? AND slug = ?`)
    .bind(access.operatorId, slug)
    .first();
  if (exists) slug = `${slug}-${courseId.slice(-4)}`;

  await db()
    .prepare(
      `INSERT INTO courses
         (id, operator_id, slug, title, summary, emoji, primary_lang, status, est_minutes, position)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', ?, 0)`,
    )
    .bind(courseId, access.operatorId, slug, title, summary, emoji, primaryLang, est)
    .run();

  // ---- Modules + blocks -----------------------------------------------------
  const stmts: ReturnType<ReturnType<typeof db>["prepare"]>[] = [];
  modules.slice(0, 12).forEach((m, mi) => {
    const modId = shortId("m");
    const modTitle = String(m.title || `Module ${mi + 1}`).trim().slice(0, 200);
    const modSummary = m.summary ? String(m.summary).trim().slice(0, 1000) : null;
    const modSlug = `${slugify(modTitle) || "module"}-${mi + 1}`;
    stmts.push(
      db()
        .prepare(
          `INSERT INTO modules (id, course_id, slug, title, summary, position)
           VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .bind(modId, courseId, modSlug, modTitle, modSummary, mi),
    );
    const blocks = Array.isArray(m.blocks) ? m.blocks : [];
    let pos = 0;
    blocks.slice(0, 10).forEach((b) => {
      const txt = String(b.text_md ?? b.text ?? "").trim().slice(0, 8000);
      if (!txt) return;
      stmts.push(
        db()
          .prepare(
            `INSERT INTO content_blocks (id, module_id, position, kind, text_md, lang, visibility)
             VALUES (?, ?, ?, 'text', ?, ?, 'training')`,
          )
          .bind(shortId("b"), modId, pos++, txt, primaryLang),
      );
    });
  });
  if (stmts.length > 0) await db().batch(stmts);

  // ---- Stash the source file -----------------------------------------------
  try {
    const ext = isPdf ? "pdf" : "txt";
    const r2Key = `sources/${access.operatorId}/${shortId("src")}.${ext}`;
    await env.ASSETS_BUCKET.put(r2Key, bytes, { httpMetadata: { contentType: mime } });
    await db()
      .prepare(
        `INSERT INTO source_files
           (id, operator_id, course_id, filename, r2_key, mime, bytes, parse_status, parse_notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'done', ?)`,
      )
      .bind(
        shortId("src"),
        access.operatorId,
        courseId,
        filename.slice(0, 200),
        r2Key,
        mime,
        bytes.length,
        `Generated ${modules.length} modules via Claude`,
      )
      .run();
  } catch {
    /* source archiving is best-effort; the course is already created */
  }

  return Response.json({ ok: true, slug });
}
