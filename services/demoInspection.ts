import { decide } from "@/lib/decision";
import type { Defect, DemoScenario, TyreInspectionResult } from "@/types";
import type { InspectionInput } from "./tyreInspection";

/** Deterministic, simulated inference. NOT real AI output. */
const SCENARIOS: Record<DemoScenario, { confidence: number; defects: Defect[] }> = {
  ACCEPT: {
    confidence: 96,
    defects: [
      {
        id: "d1", type: "Tread Wear", severity: "LOW", confidence: 96,
        location: "Centre tread", angle: "tread",
        bbox: { x: 22, y: 30, w: 56, h: 38 },
        description: "Even, minor tread wear consistent with normal service life.",
        recommendation: "No action needed. Suitable for further retreading inspection.",
      },
    ],
  },
  REVIEW: {
    confidence: 89,
    defects: [
      {
        id: "d1", type: "Uneven Tread Wear", severity: "MEDIUM", confidence: 95,
        location: "Outer shoulder", angle: "full",
        bbox: { x: 66, y: 22, w: 22, h: 30 },
        description: "Shoulder wear is noticeably heavier than the centre of the tread.",
        recommendation: "Manual casing inspection recommended.",
      },
      {
        id: "d2", type: "Sidewall Crack", severity: "LOW", confidence: 91,
        location: "Outer sidewall", angle: "left",
        bbox: { x: 14, y: 52, w: 26, h: 16 },
        description: "Small surface crack on the outer sidewall, shallow at this view.",
        recommendation: "Check crack depth during manual casing inspection.",
      },
    ],
  },
  REJECT: {
    confidence: 95,
    defects: [
      {
        id: "d1", type: "Sidewall Crack", severity: "CRITICAL", confidence: 94,
        location: "Outer sidewall", angle: "left",
        bbox: { x: 12, y: 40, w: 34, h: 24 },
        description: "Long, deep crack running along the outer sidewall.",
        recommendation: "Do not send to retreading plant.",
      },
      {
        id: "d2", type: "Exposed Cord", severity: "CRITICAL", confidence: 92,
        location: "Lower sidewall", angle: "full",
        bbox: { x: 56, y: 60, w: 24, h: 22 },
        description: "Cord material is visible through the rubber.",
        recommendation: "Do not send to retreading plant.",
      },
    ],
  },
  SEPARATION: {
    confidence: 82,
    defects: [
      {
        id: "d1", type: "Tread Separation", severity: "HIGH", confidence: 82,
        location: "Tread edge", angle: "tread",
        bbox: { x: 54, y: 24, w: 36, h: 44 },
        description: "Tread surface appears to be lifting away from the belt area.",
        recommendation: "Manual inspection required.",
      },
    ],
  },
};

const RECOMMENDATION_OVERRIDE: Partial<Record<DemoScenario, string>> = {
  SEPARATION: "Manual inspection required.",
};

export function demoResult(scenario: DemoScenario): TyreInspectionResult {
  const s = SCENARIOS[scenario];
  const d = decide(s.defects);
  return {
    overallStatus: d.status,
    confidence: s.confidence,
    defects: s.defects.map((x) => ({ ...x })),
    summary: d.summary,
    recommendation: RECOMMENDATION_OVERRIDE[scenario] ?? d.recommendation,
    engine: "TyreVision Demo AI",
    demo: true,
    mode: "DEMO",
  };
}

export async function runDemoInspection(input: InspectionInput): Promise<TyreInspectionResult> {
  return demoResult(input.scenario);
}
