import type { Defect, OverallStatus } from "@/types";

export const DISCLAIMER =
  "AI pre-screening detects visible defects. Final retreadability must be confirmed through the organization's approved inspection process.";

export interface Decision {
  status: OverallStatus;
  summary: string;
  recommendation: string;
}

/**
 * Pre-screening decision policy (shared by every engine):
 *  - any CRITICAL visible defect        -> REJECT
 *  - HIGH / MEDIUM / uncertain defect   -> REVIEW
 *  - only minor (LOW) defects           -> ACCEPT (for further inspection only)
 */
export function decide(defects: Defect[]): Decision {
  if (defects.some((d) => d.severity === "CRITICAL")) {
    return {
      status: "REJECT",
      summary: "Critical visible defects detected.",
      recommendation: "Do not send to retreading plant.",
    };
  }
  if (defects.some((d) => d.severity === "HIGH" || d.severity === "MEDIUM" || d.confidence < 85)) {
    return {
      status: "REVIEW",
      summary: "Defects that need a human decision were detected.",
      recommendation: "Do not automatically reject. Send tyre for manual casing inspection.",
    };
  }
  return {
    status: "ACCEPT",
    summary: "No critical visible defects detected.",
    recommendation: "Suitable for further retreading inspection.",
  };
}

export const STATUS_LABEL: Record<OverallStatus, string> = {
  ACCEPT: "Accept",
  REVIEW: "Review",
  REJECT: "Reject",
};

export const STATUS_HEADLINE: Record<OverallStatus, string> = {
  ACCEPT: "No visible retread rejection",
  REVIEW: "Manual review required",
  REJECT: "Retread reject",
};

export const INTERNAL_NOTE =
  "Simulated findings for demonstration only. Not derived from the photo.";

export type Verdict = "YES" | "HOLD" | "NO";

/** Plain operator-facing routing decision. It is a pre-screen outcome, NOT a certified retreadability approval. */
export const ROUTING: Record<OverallStatus, { verdict: Verdict; title: string; note: string }> = {
  ACCEPT: {
    verdict: "YES",
    title: "Send to plant",
    note: "No configured rejection condition seen. The plant's own inspection still makes the final call.",
  },
  REVIEW: {
    verdict: "HOLD",
    title: "Hold for manual check",
    note: "Do not send yet. A person must inspect this tyre first.",
  },
  REJECT: {
    verdict: "NO",
    title: "Do not send",
    note: "A configured retread rejection condition is visible. Escalate per your inspection procedure.",
  },
};
