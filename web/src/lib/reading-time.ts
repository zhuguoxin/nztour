/**
 * Rough course-duration estimate (minutes) from its text content.
 *
 * Mixed-script aware: Latin/numeric words are counted by whitespace and read at
 * ~200 wpm; CJK (Chinese/Japanese/Korean) characters are counted individually
 * and read at ~350 cpm. The two contributions are summed, rounded, floored at 1.
 *
 * This is the learner-facing "~N min" you see on cards and in the editor — a
 * reading estimate, distinct from the generated-narration audio length.
 */
const LATIN_WPM = 200;
const CJK_CPM = 350;
const CJK_RE = /[㐀-鿿぀-ヿ가-힯ｦ-ﾝ]/g;
const LATIN_WORD_RE = /[A-Za-z0-9][A-Za-z0-9'’\-]*/g;

export function estimateReadingMinutes(texts: (string | null | undefined)[]): number {
  let cjkChars = 0;
  let latinWords = 0;
  for (const t of texts) {
    if (!t) continue;
    cjkChars += (t.match(CJK_RE) || []).length;
    const latinOnly = t.replace(CJK_RE, " ");
    latinWords += (latinOnly.match(LATIN_WORD_RE) || []).length;
  }
  const minutes = latinWords / LATIN_WPM + cjkChars / CJK_CPM;
  if (minutes <= 0) return 0;
  return Math.max(1, Math.round(minutes));
}
