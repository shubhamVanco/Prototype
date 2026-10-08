/**
 * Keeps every piece of AI text short enough for 2-3 lines on a phone:
 * at most two sentences and BRIEF_MAX characters, cut at a word boundary.
 */
export const BRIEF_MAX = 140;

export function brief(text: string, max = BRIEF_MAX): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (!t) return t;
  const sentences = t.match(/[^.!?]+[.!?]*/g) ?? [t];
  let out = sentences.slice(0, 2).join("").trim();
  if (out.length > max) {
    const cut = out.slice(0, max - 1);
    out = `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max / 2)).replace(/[\s,;:.-]+$/, "")}…`;
  }
  return out;
}

/** Short list: each item brief, duplicates dropped, at most `n` items. */
export function briefList(items: string[], n = 3): string[] {
  return [...new Set(items.map((i) => brief(i)).filter(Boolean))].slice(0, n);
}
