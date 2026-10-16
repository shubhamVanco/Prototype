/** Backend contract for POST /api/inspect-tyre (OpenAI structured output). */

/** Client rule: the only outcomes are PASS or REJECT (no third "hold" outcome). */
export type RetreadDecision = "PASS" | "REJECT";

/**
 * Why a REJECT happened. RETAKE = the photo/video was not good enough to judge
 * (lighting, distance, blur...): the app re-opens the camera for the flagged views.
 */
export type RejectType = "NONE" | "DEFECT" | "RETAKE";

export type RetakeReason = "NONE" | "LIGHTING" | "CLOSER_LOOK" | "BLUR" | "ANGLE" | "OBSTRUCTED";

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

export interface RetakeRequest {
  reason: RetakeReason;
  /** Exact view names as supplied to the model, e.g. "Tread" or "Video 1 frame 3" */
  views: string[];
  /** One short instruction for the inspector, e.g. "Move closer to the shoulder." */
  instruction: string;
}

export interface TyreInspectionResult {
  decision: RetreadDecision;
  reject_type: RejectType;
  tyre_detected: boolean;
  image_quality: ImageQuality;
  retread_rejection_reasons: RejectionReason[];
  observations_not_automatic_rejection: Observation[];
  retake: RetakeRequest;
  areas_not_assessed: string[];
  decision_reason: string;
  limitations: string[];
}

export type InspectTyreResponse =
  | { success: true; inspection: TyreInspectionResult; disclaimer: string; model: string; validated: boolean }
  | { success: false; error: string; code?: "NOT_A_TYRE"; notTyre?: { view: string; subject: string; confidence: number }[] };
