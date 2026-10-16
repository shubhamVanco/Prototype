/**
 * RETREAD_REJECTION_CRITERIA: the ONLY authority for a defect REJECT.
 *
 * From the client questionnaire (Oct 2026):
 * - 1.2 fail rules: corner cracks; crack/cut diameter or length in excess (RR001, RR002).
 * - 1.3 criteria do NOT differ by tyre brand, type or size.
 * RR003-RR008 are the structural conditions the app already rejected on.
 *
 * !! The client has not yet given a numeric limit for "diameter or length excess", and a photo
 * !! has no scale reference, so RR002 is judged against the tyre's own tread blocks and grooves.
 * !! Override with RETREAD_REJECTION_CRITERIA_JSON (a JSON array of the same shape).
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
    name: "Corner (shoulder) cracks",
    description: "Cracks at the tyre corner, where the tread meets the sidewall (the shoulder).",
    required_visual_evidence: "One or more open cracks clearly visible in the shoulder/corner rubber. Not mould lines, tread grooves, dirt lines or shadows.",
    severity: "CRITICAL",
  },
  {
    code: "RR002",
    name: "Crack or cut too large (diameter or length in excess)",
    description: "A crack, cut or hole anywhere on the tyre whose length or diameter is clearly beyond a small surface nick.",
    required_visual_evidence: "A crack/cut longer than about one tread block, or a hole/penetration wider than about half a tread groove, judged against the tyre's own tread blocks and grooves.",
    severity: "CRITICAL",
  },
  {
    code: "RR003",
    name: "Severe visible sidewall damage",
    description: "Deep cut, tear or crack in the sidewall that clearly penetrates the rubber toward or into the casing plies.",
    required_visual_evidence: "A clearly visible deep, open cut/tear/crack in the sidewall, with depth evident (cord/ply layer visible or rubber visibly separated).",
    severity: "CRITICAL",
  },
  {
    code: "RR004",
    name: "Exposed structural cord",
    description: "Steel or textile casing cord is visible through the rubber.",
    required_visual_evidence: "Cord strands (metallic or fabric) clearly visible through torn or worn-through rubber. Not white marks, dirt, reflections or scratches.",
    severity: "CRITICAL",
  },
  {
    code: "RR005",
    name: "Severe visible bulge or deformation",
    description: "An abnormal outward bulge or distortion of the tyre profile.",
    required_visual_evidence: "A clearly visible localized bulge or profile distortion that is not explained by camera perspective.",
    severity: "CRITICAL",
  },
  {
    code: "RR006",
    name: "Severe visible tread tear or separation",
    description: "A large section of tread rubber is torn, displaced or visibly separating from the casing.",
    required_visual_evidence: "Tread rubber clearly torn, lifted or displaced, leaving a deep irregular damaged region or visible gap, not just uneven or worn tread.",
    severity: "CRITICAL",
  },
  {
    code: "RR007",
    name: "Severe visible bead damage",
    description: "Bead area clearly broken, torn, burnt or deformed.",
    required_visual_evidence: "Bead rubber or bead wire clearly visible as torn, broken, kinked or burnt in the photo.",
    severity: "CRITICAL",
  },
  {
    code: "RR008",
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
