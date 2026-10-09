import { brief, briefList } from "./brief";
import type { RetreadDecision, TyreInspectionResult } from "@/types/tyreInspection";

export const MIN_REJECT_CONFIDENCE = 0.7;

const FORBIDDEN = /approved for retreading|(?:tyre|tire) is (?:completely |totally )?safe|suitable for retreading|no internal damage|all defects (?:have been|were) detected|100% accurate|definitely unsafe|unsafe tyre|bad tyre|defective tyre/i;

/** If the model uses a forbidden claim, discard its sentence and use a fixed safe one. */
function sanitize(s: string, safe: string): string {
  return FORBIDDEN.test(s) ? safe : s;
}

// Hidden-damage claims (e.g. "internal belt separation") cannot be seen in an RGB photo.
const INTERNAL_CLAIM = /\b(internal|belt|casing|ply|plies)\b/i;
const DAMAGE_WORD = /(damage|separation|failure|broken|fractur)/i;
const HEDGED = /(possible|possibly|may|might|could|cannot|can't|not (?:confirmed|assessed|assessable|visible|determin)|unable|unclear)/i;
// ...but a casing/ply word next to something the camera DID see is a visible defect, not a hidden claim.
const VISIBLE_DAMAGE = /\b(visible|exposed|torn|tear|crack|cut|gash|missing|chunk|gap|lifted|displaced|cords?|strands?|wires?|bulge|burnt|melted|open)/i;

/** True when a rejection rests only on inferred internal damage with no visible defect described. */
export function isHiddenDamageClaim(evidence: string, why: string): boolean {
  const all = `${evidence} ${why}`;
  return INTERNAL_CLAIM.test(all) && DAMAGE_WORD.test(all) && !HEDGED.test(all) && !VISIBLE_DAMAGE.test(evidence);
}

type Reason = TyreInspectionResult["retread_rejection_reasons"][number];
type Observation = TyreInspectionResult["observations_not_automatic_rejection"][number];

function reasonText(decision: RetreadDecision, kept: Reason[], modelDecision: RetreadDecision): string {
  if (decision === "RETREAD_REJECT") {
    const top = [...kept].sort((a, b) => b.confidence - a.confidence)[0];
    return top ? `${top.criterion_name}: ${top.visual_evidence}` : "A retread rejection condition is clearly visible.";
  }
  if (decision === "NO_VISIBLE_RETREAD_REJECTION") return "No rejection condition visible in the photos.";
  if (kept.length) return "A possible rejection condition was seen but is not clear enough. A person must inspect this tyre.";
  if (modelDecision === "RETREAD_REJECT") return "The AI's rejection could not be tied to visible evidence. A person must inspect this tyre.";
  return "Some areas could not be confirmed from the photos. A person must inspect this tyre.";
}

/**
 * Conservative post-processing. The prompt is the first line of defence; this enforces the same
 * rules in code. Evidence is never silently thrown away: a reason that cannot support a reject is
 * shown as an observation instead.
 *
 * Decision rules:
 * - Any solid rejection reason (confidence >= MIN_REJECT_CONFIDENCE) on a detected tyre => RETREAD_REJECT,
 *   whatever the model's overall label. One defect in one photo is enough; more photos never hide it.
 * - A reject without a solid reason => MANUAL_REVIEW.
 * - A pass with an unusable image, any candidate reason or open follow-up => MANUAL_REVIEW.
 */
export function normalizeOutput(r: TyreInspectionResult): TyreInspectionResult {
  const hidden = r.retread_rejection_reasons.filter((d) => isHiddenDamageClaim(d.visual_evidence, d.why_it_meets_rejection_criterion));
  const reasons = r.retread_rejection_reasons.filter((d) => d.visual_evidence.trim() && !hidden.includes(d));
  const demoted: Observation[] = hidden.map((d) => ({
    name: d.criterion_name,
    location: d.location,
    visual_evidence: d.visual_evidence,
    automatic_rejection: false,
    reason_not_rejection: "Internal damage cannot be confirmed from a photo. Check physically.",
  }));

  const areas = briefList(r.areas_not_assessed, 4);
  if (!areas.some((a) => /internal/i.test(a))) areas.push("Internal casing condition");

  const solid = r.tyre_detected && reasons.some((d) => d.confidence >= MIN_REJECT_CONFIDENCE);
  let decision: RetreadDecision = r.decision;
  if (solid) decision = "RETREAD_REJECT";
  else if (decision === "RETREAD_REJECT") decision = "MANUAL_REVIEW";
  if (decision === "NO_VISIBLE_RETREAD_REJECTION") {
    const goodImage = r.tyre_detected && r.image_quality.usable;
    if (!goodImage || reasons.length || hidden.length || r.required_follow_up.length) decision = "MANUAL_REVIEW";
  }

  const fallback = reasonText(decision, reasons, r.decision);
  // If the server changed the model's decision, the model's own explanation no longer fits.
  const reason = decision !== r.decision ? brief(fallback) : brief(sanitize(r.decision_reason, fallback)) || brief(fallback);

  // Strongest reasons first so the cap never drops the one that decided the outcome.
  const ranked = [...reasons].sort((a, b) => b.confidence - a.confidence);

  // Every text the user sees is kept to 2-3 lines.
  return {
    ...r,
    decision,
    image_quality: { ...r.image_quality, issues: briefList(r.image_quality.issues.map((i) => sanitize(i, "Image issue noted."))) },
    retread_rejection_reasons: ranked.slice(0, 3).map((d) => ({
      ...d,
      criterion_name: brief(d.criterion_name, 60),
      location: brief(d.location, 60),
      visual_evidence: brief(d.visual_evidence),
      why_it_meets_rejection_criterion: brief(d.why_it_meets_rejection_criterion),
    })),
    observations_not_automatic_rejection: [...demoted, ...r.observations_not_automatic_rejection].slice(0, 3).map((o) => ({
      ...o,
      name: brief(o.name, 60),
      location: brief(o.location, 60),
      visual_evidence: brief(sanitize(o.visual_evidence, "Visible feature; confirm by physical inspection.")),
      reason_not_rejection: brief(o.reason_not_rejection),
    })),
    areas_not_assessed: areas,
    decision_reason: reason,
    required_follow_up: briefList(r.required_follow_up, 2),
    limitations: briefList(r.limitations, 2),
  };
}
