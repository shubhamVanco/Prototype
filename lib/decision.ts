import type { OverallStatus } from "@/types";

export const DISCLAIMER =
  "AI pre-screening of visible conditions. The plant's physical inspection makes the final call.";

export type Verdict = "YES" | "HOLD" | "NO";

/** Plain operator-facing routing decision. It is a pre-screen outcome, NOT a certified retreadability approval. */
export const ROUTING: Record<OverallStatus, { verdict: Verdict; title: string; note: string }> = {
  ACCEPT: {
    verdict: "YES",
    title: "Send to plant",
    note: "No rejection condition seen. The plant's inspection makes the final call.",
  },
  REVIEW: {
    verdict: "HOLD",
    title: "Hold for manual check",
    note: "Do not send yet. A person must inspect this tyre first.",
  },
  REJECT: {
    verdict: "NO",
    title: "Do not send",
    note: "A retread rejection condition is visible.",
  },
};

/** Every screen (result, dashboard, history, report) uses the same YES / HOLD / NO wording. */
export const STATUS_LABEL: Record<OverallStatus, Verdict> = {
  ACCEPT: ROUTING.ACCEPT.verdict,
  REVIEW: ROUTING.REVIEW.verdict,
  REJECT: ROUTING.REJECT.verdict,
};

export const STATUS_HEADLINE: Record<OverallStatus, string> = {
  ACCEPT: `${ROUTING.ACCEPT.verdict}: ${ROUTING.ACCEPT.title}`,
  REVIEW: `${ROUTING.REVIEW.verdict}: ${ROUTING.REVIEW.title}`,
  REJECT: `${ROUTING.REJECT.verdict}: ${ROUTING.REJECT.title}`,
};

/** HOLD has no verdict to be confident in; show photo quality there instead of a confidence figure. */
export function confidenceLabel(r: { overallStatus: OverallStatus; confidence: number; imageQuality?: { score: number } }): string | null {
  if (r.overallStatus !== "REVIEW") return `${r.confidence}% confidence`;
  return r.imageQuality ? `Photo quality ${Math.round(r.imageQuality.score * 100)}%` : null;
}

/** Routing for photos rejected because no tyre was found in them. */
export const NOT_A_TYRE_ROUTING = {
  verdict: "NO" as Verdict,
  title: "Rejected: not a tyre",
  note: "No tyre was found in the photo.",
  headline: "Not a tyre",
};
