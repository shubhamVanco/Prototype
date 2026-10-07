import { DECISIONS } from "./tyreInspectionSchema";
import type { RetreadCriterion } from "./retreadCriteria";
import type { TyreInspectionResult } from "@/types/tyreInspection";

type Check = { ok: true; value: TyreInspectionResult } | { ok: false; reason: string };

const isStr = (x: unknown): x is string => typeof x === "string";
const isStrArr = (x: unknown): x is string[] => Array.isArray(x) && x.every(isStr);
const isProb = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x) && x >= 0 && x <= 1;

// Physical measurements cannot be read from a photo without a reference object.
const MEASUREMENT = /\b\d+(?:\.\d+)?\s?(?:mm|cm|millimet(?:er|re)s?|centimet(?:er|re)s?|inch(?:es)?|in\.|psi|bar|kpa|%|percent)\b/i;
// Tyre spec strings, e.g. 295/80 R22.5 or 11R22.5
const TYRE_SIZE = /\b\d{2,3}\/\d{2}\s?Z?R\s?\d{2}(?:\.5)?\b|\b\d{1,2}(?:\.\d{2})?\s?R\s?\d{2}(?:\.5)?\b/i;
const DOT_CODE = /\bDOT\s?[A-Z0-9]{2,}/i;

/**
 * Strict validation of the model's JSON. Anything off => the caller returns MANUAL_REVIEW with
 * "AI output could not be validated reliably." (never a silent demo substitute).
 * Rejection codes must exist in the configured criteria: codes are never invented.
 */
export function validateModelOutput(x: unknown, operatorContext: string, criteria: RetreadCriterion[]): Check {
  const bad = (reason: string): Check => ({ ok: false, reason });
  const r = x as TyreInspectionResult;
  if (!r || typeof r !== "object") return bad("not an object");
  if (!(DECISIONS as readonly string[]).includes(r.decision)) return bad("unknown decision");
  if (typeof r.tyre_detected !== "boolean") return bad("tyre_detected");
  const q = r.image_quality;
  if (!q || typeof q.usable !== "boolean" || !isProb(q.score) || !isStrArr(q.issues)) return bad("image_quality");
  if (!isStr(r.decision_reason)) return bad("missing decision_reason");
  if (!isStrArr(r.areas_not_assessed) || !isStrArr(r.limitations) || !isStrArr(r.required_follow_up)) return bad("arrays");
  if (!Array.isArray(r.retread_rejection_reasons) || !Array.isArray(r.observations_not_automatic_rejection)) return bad("lists");

  const byCode = new Map(criteria.map((c) => [c.code, c]));
  for (const d of r.retread_rejection_reasons) {
    if (!d || !byCode.has(d.criterion_code)) return bad("invented rejection code");
    if (!isProb(d.confidence)) return bad("confidence out of range");
    if (!isStr(d.location) || !isStr(d.criterion_name)) return bad("missing fields");
    if (!isStr(d.visual_evidence) || !d.visual_evidence.trim()) return bad("missing evidence");
    if (!isStr(d.why_it_meets_rejection_criterion) || !d.why_it_meets_rejection_criterion.trim()) return bad("missing criterion justification");
  }
  for (const o of r.observations_not_automatic_rejection) {
    if (!o || !isStr(o.name) || !o.name.trim()) return bad("observation name");
    if (!isStr(o.location) || !isStr(o.visual_evidence) || !o.visual_evidence.trim()) return bad("observation evidence");
    if (o.automatic_rejection !== false) return bad("observation flagged as automatic rejection");
    if (!isStr(o.reason_not_rejection)) return bad("observation reason");
  }

  const text = [
    r.decision_reason, ...r.limitations, ...r.areas_not_assessed, ...r.required_follow_up,
    ...r.retread_rejection_reasons.flatMap((d) => [d.visual_evidence, d.location, d.why_it_meets_rejection_criterion]),
    ...r.observations_not_automatic_rejection.flatMap((o) => [o.name, o.visual_evidence, o.location, o.reason_not_rejection]),
  ].join("\n");
  if (MEASUREMENT.test(text)) return bad("invented measurement");
  for (const re of [TYRE_SIZE, DOT_CODE]) {
    const m = text.match(re);
    if (m && !operatorContext.toLowerCase().includes(m[0].toLowerCase())) return bad("unsupported tyre metadata");
  }
  return { ok: true, value: r };
}
