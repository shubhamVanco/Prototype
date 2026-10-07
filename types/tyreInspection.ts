/** Backend contract for POST /api/inspect-tyre (OpenAI structured output). */

export type RetreadDecision = "RETREAD_REJECT" | "MANUAL_REVIEW" | "NO_VISIBLE_RETREAD_REJECTION";

export interface ImageQuality {
  usable: boolean;
  /** 0-1 */
  score: number;
  issues: string[];
}

/** A visible condition that matches a CONFIGURED retread rejection criterion. */
export interface RejectionReason {
  criterion_code: string;
  criterion_name: string;
  location: string;
  visual_evidence: string;
  /** 0-1: confidence in the visual observation only */
  confidence: number;
  why_it_meets_rejection_criterion: string;
}

/** A visible condition that does NOT, by itself, trigger rejection. */
export interface Observation {
  name: string;
  location: string;
  visual_evidence: string;
  automatic_rejection: false;
  reason_not_rejection: string;
}

export type Recommendation = RetreadDecision;

export interface TyreInspectionResult {
  decision: RetreadDecision;
  tyre_detected: boolean;
  image_quality: ImageQuality;
  retread_rejection_reasons: RejectionReason[];
  observations_not_automatic_rejection: Observation[];
  areas_not_assessed: string[];
  decision_reason: string;
  required_follow_up: string[];
  limitations: string[];
}

export type InspectTyreResponse =
  | { success: true; inspection: TyreInspectionResult; disclaimer: string; model: string; validated: boolean }
  | { success: false; error: string };
