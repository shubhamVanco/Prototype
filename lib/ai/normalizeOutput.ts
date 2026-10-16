import { brief, briefList } from "./brief";
import type { RetakeReason, RetakeRequest, TyreInspectionResult } from "@/types/tyreInspection";

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

const NO_RETAKE: RetakeRequest = { reason: "NONE", views: [], instruction: "" };

const RETAKE_TEXT: Record<Exclude<RetakeReason, "NONE">, string> = {
  LIGHTING: "Lighting is not good enough to judge the tyre. Retake with more light and no glare.",
  CLOSER_LOOK: "A closer look is needed to decide. Retake closer to the marked area.",
  BLUR: "The photo is blurred. Hold steady and retake.",
  ANGLE: "The angle hides part of the tyre. Retake square-on to the area.",
  OBSTRUCTED: "Part of the tyre is covered. Clear the area and retake.",
};

/** Best guess of the retake reason from the model's image-quality notes. */
function reasonFromIssues(issues: string[]): Exclude<RetakeReason, "NONE"> {
  const all = issues.join(" ");
  if (/dark|light|glare|exposure|exposed|shadow|bright/i.test(all)) return "LIGHTING";
  if (/blur|focus|motion/i.test(all)) return "BLUR";
  if (/angle|oblique/i.test(all)) return "ANGLE";
  if (/cover|obstruct|block|hidden/i.test(all)) return "OBSTRUCTED";
  return "CLOSER_LOOK";
}

function retakeRequest(r: TyreInspectionResult, weak: Reason[]): RetakeRequest {
  const reason = r.retake.reason !== "NONE"
    ? r.retake.reason
    : weak.length ? "CLOSER_LOOK" : reasonFromIssues(r.image_quality.issues);
  const views = r.retake.views.length ? r.retake.views : weak.map((d) => d.location);
  return {
    reason,
    views: briefList(views, 4),
    instruction: brief(sanitize(r.retake.instruction, RETAKE_TEXT[reason])) || RETAKE_TEXT[reason],
  };
}

/**
 * Conservative post-processing. The prompt is the first line of defence; this enforces the same
 * rules in code. Only two outcomes exist: PASS or REJECT. A REJECT is either a DEFECT or a RETAKE
 * (the views could not support a decision, so the app re-opens the camera).
 *
 * - Any solid rejection reason (confidence >= MIN_REJECT_CONFIDENCE) on a detected tyre => REJECT/DEFECT,
 *   whatever the model's label. One defect in one view is enough; more views never hide it.
 * - A defect claim without a solid reason => REJECT/RETAKE (closer look needed).
 * - A PASS with an unusable image or any candidate reason => REJECT/RETAKE. Never PASS what wasn't seen.
 * - Evidence is never silently thrown away: a reason that cannot support a reject becomes an observation.
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
  const weak = reasons.filter((d) => d.confidence < MIN_REJECT_CONFIDENCE);
  const modelPass = r.decision === "PASS";
  const goodImage = r.tyre_detected && r.image_quality.usable;

  const rejectType = solid ? "DEFECT"
    : modelPass && goodImage && !reasons.length ? "NONE"
      : "RETAKE";
  const decision = rejectType === "NONE" ? "PASS" : "REJECT";
  const retake = rejectType === "RETAKE" ? retakeRequest(r, weak) : NO_RETAKE;

  // Strongest reasons first so the cap never drops the one that decided the outcome.
  const ranked = [...reasons].sort((a, b) => b.confidence - a.confidence);
  const top = ranked[0];
  const fallback = rejectType === "DEFECT" && top ? `${top.criterion_name}: ${top.visual_evidence}`
    : rejectType === "RETAKE" ? retake.instruction
      : "No rejection condition visible in the photos.";
  // If the server changed the model's outcome, the model's own explanation no longer fits.
  const changed = decision !== r.decision || rejectType !== r.reject_type;
  const reason = changed ? brief(fallback) : brief(sanitize(r.decision_reason, fallback)) || brief(fallback);

  // Every text the user sees is kept to 2-3 lines.
  return {
    ...r,
    decision,
    reject_type: rejectType,
    retake,
    image_quality: { ...r.image_quality, issues: briefList(r.image_quality.issues.map((i) => sanitize(i, "Image issue noted."))) },
    // On a RETAKE nothing is confirmed: the candidate reasons are shown as observations instead.
    retread_rejection_reasons: rejectType !== "DEFECT" ? [] : ranked.slice(0, 3).map((d) => ({
      ...d,
      criterion_name: brief(d.criterion_name, 60),
      location: brief(d.location, 60),
      visual_evidence: brief(d.visual_evidence),
      why_it_meets_rejection_criterion: brief(d.why_it_meets_rejection_criterion),
    })),
    observations_not_automatic_rejection: [
      ...(rejectType === "DEFECT" ? [] : weak.map((d) => ({
        name: d.criterion_name, location: d.location, visual_evidence: d.visual_evidence,
        automatic_rejection: false as const, reason_not_rejection: "Not clear enough to confirm. Retake closer.",
      }))),
      ...demoted,
      ...r.observations_not_automatic_rejection,
    ].slice(0, 3).map((o) => ({
      ...o,
      name: brief(o.name, 60),
      location: brief(o.location, 60),
      visual_evidence: brief(sanitize(o.visual_evidence, "Visible feature; confirm by physical inspection.")),
      reason_not_rejection: brief(o.reason_not_rejection),
    })),
    areas_not_assessed: areas,
    decision_reason: reason,
    limitations: briefList(r.limitations, 2),
  };
}
