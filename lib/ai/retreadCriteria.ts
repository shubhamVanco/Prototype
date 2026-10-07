/**
 * RETREAD_REJECTION_CRITERIA: the ONLY authority for a RETREAD_REJECT decision.
 *
 * !! These defaults are STARTER PLACEHOLDERS, not your plant's spec. Replace them with the
 * !! organization's approved criteria, either by editing this list or by setting the
 * !! RETREAD_REJECTION_CRITERIA_JSON environment variable to a JSON array of the same shape.
 *
 * Keep them specific and visual: the model can only reject when the photo shows the
 * `required_visual_evidence`.
 */

export interface RetreadCriterion {
  code: string;
  name: string;
  description: string;
  required_visual_evidence: string;
  severity: "CRITICAL" | "HIGH";
}

const DEFAULTS: RetreadCriterion[] = [
  {
    code: "RR001",
    name: "Severe visible sidewall damage",
    description: "Deep cut, tear or crack in the sidewall that clearly penetrates the rubber toward or into the casing plies.",
    required_visual_evidence: "A clearly visible deep, open cut/tear/crack in the sidewall, with depth evident (cord/ply layer visible or rubber visibly separated).",
    severity: "CRITICAL",
  },
  {
    code: "RR002",
    name: "Exposed structural cord",
    description: "Steel or textile casing cord is visible through the rubber.",
    required_visual_evidence: "Cord strands (metallic or fabric) clearly visible through torn or worn-through rubber. Not white marks, dirt, reflections or scratches.",
    severity: "CRITICAL",
  },
  {
    code: "RR003",
    name: "Severe visible bulge or deformation",
    description: "An abnormal outward bulge or distortion of the tyre profile.",
    required_visual_evidence: "A clearly visible localized bulge or profile distortion that is not explained by camera perspective.",
    severity: "CRITICAL",
  },
  {
    code: "RR004",
    name: "Severe visible tread tear or separation",
    description: "A large section of tread rubber is torn, displaced or visibly separating from the casing.",
    required_visual_evidence: "Tread rubber clearly torn, lifted or displaced, leaving a deep irregular damaged region or visible gap, not just uneven or worn tread.",
    severity: "CRITICAL",
  },
  {
    code: "RR005",
    name: "Severe visible bead damage",
    description: "Bead area clearly broken, torn, burnt or deformed.",
    required_visual_evidence: "Bead rubber or bead wire clearly visible as torn, broken, kinked or burnt in the photo.",
    severity: "CRITICAL",
  },
  {
    code: "RR006",
    name: "Visible run-flat or heat damage",
    description: "Signs the tyre was driven deflated or severely overheated.",
    required_visual_evidence: "Clearly visible burnt, melted, blistered or heavily scuffed/discoloured rubber consistent with deflated running.",
    severity: "CRITICAL",
  },
];

function load(): RetreadCriterion[] {
  const raw = process.env.RETREAD_REJECTION_CRITERIA_JSON;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as RetreadCriterion[];
      if (Array.isArray(parsed) && parsed.length && parsed.every((c) => c.code && c.name)) return parsed;
    } catch {
      /* fall through to defaults */
    }
  }
  return DEFAULTS;
}

export const getRetreadCriteria = load;
