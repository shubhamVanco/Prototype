import type { OverallStatus } from "@/types";

export const DISCLAIMER =
  "AI pre-screening of visible conditions. The plant's physical inspection makes the final call.";

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

/** Routing for photos rejected because no tyre was found in them. */
export const NOT_A_TYRE_ROUTING = {
  verdict: "NO" as Verdict,
  title: "Rejected: not a tyre",
  note: "No tyre was found in the photo.",
  headline: "Not a tyre",
};
