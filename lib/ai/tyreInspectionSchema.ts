export const DECISIONS = ["RETREAD_REJECT", "MANUAL_REVIEW", "NO_VISIBLE_RETREAD_REJECTION"] as const;

const strArray = { type: "array", items: { type: "string" } };

/** Strict JSON schema for the Responses API (every property required, no extras). */
export const TYRE_INSPECTION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "decision", "tyre_detected", "image_quality", "retread_rejection_reasons",
    "observations_not_automatic_rejection", "areas_not_assessed", "decision_reason",
    "required_follow_up", "limitations",
  ],
  properties: {
    decision: { type: "string", enum: [...DECISIONS] },
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
    areas_not_assessed: strArray,
    decision_reason: { type: "string" },
    required_follow_up: strArray,
    limitations: strArray,
  },
} as const;
