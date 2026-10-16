import type { OverallStatus } from "@/types";

export const DISCLAIMER =
  "AI pre-screening of visible conditions. The plant's physical inspection makes the final call.";

/**
 * Client rule: the only verdicts are PASS and REJECT.
 * RETRY is not a verdict: it is shown only when the AI could not give a result at all
 * (service down / unreadable output) and for records saved before this rule.
 */
export type Verdict = "PASS" | "REJECT" | "RETRY";

/** Plain operator-facing routing decision. It is a pre-screen outcome, NOT a certified retreadability approval. */
export const ROUTING: Record<OverallStatus, { verdict: Verdict; title: string; note: string }> = {
  ACCEPT: {
    verdict: "PASS",
    title: "Send to plant",
    note: "No rejection condition seen. The plant's inspection makes the final call.",
  },
  REVIEW: {
    verdict: "RETRY",
    title: "No result yet",
    note: "The AI could not give a result. Analyze again.",
  },
  REJECT: {
    verdict: "REJECT",
    title: "Do not send",
    note: "A retread rejection condition is visible.",
  },
};

/** Every screen (result, dashboard, history, report) uses the same PASS / REJECT wording. */
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

/** REJECT because the views were not good enough to decide; the app re-opens the camera. */
export const RETAKE_ROUTING = {
  verdict: "REJECT" as Verdict,
  title: "Retake needed",
  note: "The photos were not clear enough to decide. Retake the flagged view.",
};

export const RETAKE_REASON_LABEL = {
  LIGHTING: "Poor lighting",
  CLOSER_LOOK: "Closer look needed",
  BLUR: "Blurred",
  ANGLE: "Wrong angle",
  OBSTRUCTED: "Area covered",
} as const;

/** A retake or a "no result" has no verdict to be confident in; show photo quality there instead. */
export function confidenceLabel(r: {
  overallStatus: OverallStatus; confidence: number; imageQuality?: { score: number }; retake?: unknown;
}): string | null {
  if (r.overallStatus !== "REVIEW" && !r.retake) return `${r.confidence}% confidence`;
  return r.imageQuality ? `Photo quality ${Math.round(r.imageQuality.score * 100)}%` : null;
}

/** Routing for photos rejected because no tyre was found in them. */
export const NOT_A_TYRE_ROUTING = {
  verdict: "REJECT" as Verdict,
  title: "Rejected: not a tyre",
  note: "No tyre was found in the photo.",
  headline: "Not a tyre",
};
