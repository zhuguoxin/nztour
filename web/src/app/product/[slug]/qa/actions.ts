"use server";

import { db } from "@/lib/db";
import { requireOperatorMembership } from "@/lib/roles";
import { revalidatePath } from "next/cache";
import Anthropic from "@anthropic-ai/sdk";
import { getCloudflareContext } from "@opennextjs/cloudflare";

const MODEL = "claude-sonnet-4-5-20250929";

interface ExistingTheme {
  id: string;
  label: string;
  description: string | null;
}

interface CategorizationResult {
  assignments: Array<{ id: string; theme_label: string }>;
  new_themes: Array<{ label: string; description: string }>;
}

/**
 * Categorize uncategorized Q&A logs for an operator inside an optional
 * date window. Existing themes are passed to Claude so similar questions
 * get re-used labels (themes don't fragment over time). New themes are
 * inserted; theme_id is written back per row.
 *
 * One Claude call per batch of up to ~80 questions. We cap the per-run
 * total at 200 to keep cost predictable; operators can click Refresh
 * again to process the next batch.
 *
 * Returns counts so the UI can show a summary.
 */
export async function categorizeQuestionsAction(input: {
  operatorSlug: string;
  from?: number;
  to?: number;
}): Promise<{ processed: number; new_themes: number; remaining: number }> {
  const access = await requireOperatorMembership(input.operatorSlug);
  const now = Math.floor(Date.now() / 1000);
  const from = input.from ?? now - 30 * 86400;
  const to = input.to ?? now;
  const HARD_CAP = 200;
  const BATCH = 80;

  const { env } = getCloudflareContext();
  if (!env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not configured");
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  // Load existing themes — Claude will be told to RE-USE labels when fit.
  const { results: existing = [] } = await db()
    .prepare(
      `SELECT id, label, description FROM qa_themes
       WHERE operator_id = ? ORDER BY question_count DESC, label`,
    )
    .bind(access.operatorId)
    .all<ExistingTheme>();

  const labelToId = new Map<string, string>(existing.map((t) => [t.label.toLowerCase(), t.id]));
  let newThemesCreated = 0;
  let processed = 0;

  while (processed < HARD_CAP) {
    const remaining = HARD_CAP - processed;
    const { results: batch = [] } = await db()
      .prepare(
        `SELECT id, question FROM qa_logs
         WHERE operator_id = ? AND theme_id IS NULL
           AND created_at >= ? AND created_at <= ?
         ORDER BY created_at DESC
         LIMIT ?`,
      )
      .bind(access.operatorId, from, to, Math.min(BATCH, remaining))
      .all<{ id: string; question: string }>();
    if (batch.length === 0) break;

    const existingList =
      existing.length === 0
        ? "(none yet — propose the first set)"
        : existing
            .map((t, i) => `${i + 1}. "${t.label}"${t.description ? ` — ${t.description}` : ""}`)
            .join("\n");

    const systemPrompt = `You categorize travel-trade Q&A questions for one tourism supplier's training analytics dashboard.

Existing themes (for this supplier):
${existingList}

Rules:
- For each question, assign it to ONE existing theme by exact label if a clear fit exists; otherwise propose a NEW theme.
- Themes are nouns, 2–5 words, Title Case. Examples: "Refund Policy", "Lift Hours", "Group Discounts".
- Generic / off-topic / single-word / non-tourism questions go to theme "General Inquiry".
- Prefer re-using existing themes over creating near-duplicates. If a question lightly overlaps with an existing theme, use that label.
- Cap new themes at 8 per batch. If you'd create the 9th, fold it into an existing theme instead.
- Output ONLY valid JSON, no markdown fences, no preamble.`;

    const userPrompt = `Questions to categorize:
${batch.map((b, i) => `[${i + 1}] ${b.question}`).join("\n")}

Output a JSON object shaped:
{
  "assignments": [
    { "id": "<question id>", "theme_label": "<theme label, existing or new>" },
    ...
  ],
  "new_themes": [
    { "label": "<exact label used in assignments>", "description": "<one sentence>" },
    ...
  ]
}

Assignments MUST be in the same order as input, one per question, using the exact ids: ${batch
      .map((b) => `"${b.id}"`)
      .join(", ")}.`;

    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });
    const text = resp.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    const cleaned = text.replace(/^\s*```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
    let parsed: CategorizationResult;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      throw new Error("Categorizer returned invalid JSON");
    }
    if (!parsed?.assignments || !Array.isArray(parsed.assignments)) {
      throw new Error("Categorizer response missing assignments[]");
    }

    // Create any genuinely new themes (label not already in map). Insert one
    // row each, register their id in labelToId.
    for (const t of parsed.new_themes ?? []) {
      const key = t.label?.toLowerCase();
      if (!key || labelToId.has(key)) continue;
      const id = `thm_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
      await db()
        .prepare(
          `INSERT INTO qa_themes (id, operator_id, label, description) VALUES (?, ?, ?, ?)`,
        )
        .bind(id, access.operatorId, t.label.slice(0, 80), (t.description ?? "").slice(0, 500))
        .run();
      labelToId.set(key, id);
      newThemesCreated += 1;
    }

    // Apply assignments. Anything unknown falls back to a "General Inquiry"
    // theme (created on demand).
    let generalId: string | null = labelToId.get("general inquiry") ?? null;
    const stmts: ReturnType<ReturnType<typeof db>["prepare"]>[] = [];
    for (const a of parsed.assignments) {
      let themeId = labelToId.get((a.theme_label ?? "").toLowerCase()) ?? null;
      if (!themeId) {
        if (!generalId) {
          generalId = `thm_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
          await db()
            .prepare(
              `INSERT INTO qa_themes (id, operator_id, label, description) VALUES (?, ?, ?, ?)`,
            )
            .bind(generalId, access.operatorId, "General Inquiry", "Catch-all for questions that don't fit a specific theme.")
            .run();
          labelToId.set("general inquiry", generalId);
          newThemesCreated += 1;
        }
        themeId = generalId;
      }
      stmts.push(
        db()
          .prepare(`UPDATE qa_logs SET theme_id = ? WHERE id = ? AND operator_id = ?`)
          .bind(themeId, a.id, access.operatorId),
      );
    }
    if (stmts.length > 0) await db().batch(stmts);
    processed += batch.length;

    // Loop only if we hit the full batch — partial means we drained.
    if (batch.length < BATCH) break;
  }

  // Refresh denormalized counts for every touched theme.
  await db()
    .prepare(
      `UPDATE qa_themes
         SET question_count = (
           SELECT COUNT(*) FROM qa_logs WHERE theme_id = qa_themes.id
         ),
         updated_at = unixepoch()
       WHERE operator_id = ?`,
    )
    .bind(access.operatorId)
    .run();

  // Remaining uncategorized count (helps operator decide whether to refresh again)
  const { results: rem = [] } = await db()
    .prepare(
      `SELECT COUNT(*) AS n FROM qa_logs
       WHERE operator_id = ? AND theme_id IS NULL
         AND created_at >= ? AND created_at <= ?`,
    )
    .bind(access.operatorId, from, to)
    .all<{ n: number }>();
  const remainingCount = rem[0]?.n ?? 0;

  revalidatePath(`/product/${input.operatorSlug}/qa`);
  revalidatePath(`/product/${input.operatorSlug}`);
  return { processed, new_themes: newThemesCreated, remaining: remainingCount };
}
