export const DECISIONS = ["PASS", "REJECT"] as const;
export const REJECT_TYPES = ["NONE", "DEFECT", "RETAKE"] as const;
export const RETAKE_REASONS = ["NONE", "LIGHTING", "CLOSER_LOOK", "BLUR", "ANGLE", "OBSTRUCTED"] as const;

const strArray = { type: "array", items: { type: "string" } };

/** Strict JSON schema for the Responses API (every property required, no extras). */
export const TYRE_INSPECTION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "decision", "reject_type", "tyre_detected", "image_quality", "retread_rejection_reasons",
    "observations_not_automatic_rejection", "retake", "areas_not_assessed", "decision_reason", "limitations",
  ],
  properties: {
    decision: { type: "string", enum: [...DECISIONS] },
    reject_type: { type: "string", enum: [...REJECT_TYPES] },
    tyre_detected: { type: "boolean" },
    image_quality: {
      type: "object",
      additionalProperties: false,
      required: ["usable", "score", "issues"],
      properties: {
        usable: { type: "boolean" },
        score: { type: "number" },
        issues: strArray,
      },
    },
    retread_rejection_reasons: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["criterion_code", "criterion_name", "location", "visual_evidence", "confidence", "why_it_meets_rejection_criterion"],
        properties: {
          criterion_code: { type: "string" },
          criterion_name: { type: "string" },
          location: { type: "string" },
          visual_evidence: { type: "string" },
          confidence: { type: "number" },
          why_it_meets_rejection_criterion: { type: "string" },
        },
      },
    },
    observations_not_automatic_rejection: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "location", "visual_evidence", "automatic_rejection", "reason_not_rejection"],
        properties: {
          name: { type: "string" },
          location: { type: "string" },
          visual_evidence: { type: "string" },
          automatic_rejection: { type: "boolean" },
          reason_not_rejection: { type: "string" },
        },
      },
    },
    retake: {
      type: "object",
      additionalProperties: false,
      required: ["reason", "views", "instruction"],
      properties: {
        reason: { type: "string", enum: [...RETAKE_REASONS] },
        views: strArray,
        instruction: { type: "string" },
      },
    },
    areas_not_assessed: strArray,
    decision_reason: { type: "string" },
    limitations: strArray,
  },
} as const;
