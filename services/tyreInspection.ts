import type { DemoScenario, TyreImages, TyreInfo, TyreInspectionResult } from "@/types";
import { INTERNAL_DEFECT_NOTICE } from "@/lib/ai/tyreInspectionPrompt";
import { runDemoInspection } from "./demoInspection";
import { runLlmInspection } from "./llmInspection";

export type {
  TyreInspectionResult, Defect, OverallStatus, Severity,
} from "@/types";

export interface InspectionInput {
  tyre: TyreInfo;
  images: TyreImages;
  /** Only used by the demo engine */
  scenario: DemoScenario;
  /** true ONLY when the user explicitly selected Demo Mode. Default is real AI. */
  demoMode: boolean;
  /** 0-1, real upload progress of the photos (real AI engine only) */
  onUploadProgress?: (fraction: number) => void;
}

export const UNAVAILABLE_MESSAGE = "AI inspection unavailable. Manual inspection required.";

/** Shown when real inference fails. Contains NO defects and is never a simulated result. */
export function unavailableResult(detail?: string): TyreInspectionResult {
  return {
    overallStatus: "REVIEW",
    confidence: 0,
    defects: [],
    summary: UNAVAILABLE_MESSAGE,
    recommendation: "Manual inspection required.",
    engine: "AI unavailable",
    demo: false,
    mode: "UNAVAILABLE",
    limitations: [...(detail ? [detail] : []), INTERNAL_DEFECT_NOTICE],
  };
}

/**
 * Single entry point used by the UI.
 *  - Demo Mode (explicit user choice): simulated scenario, labelled as such.
 *  - Otherwise: the uploaded photo is analysed by the vision model. If that fails the result is an
 *    explicit "AI unavailable" report. Demo data is NEVER substituted for a failed inference.
 */
export async function runTyreInspection(input: InspectionInput): Promise<TyreInspectionResult> {
  if (!Object.values(input.images).some(Boolean)) throw new Error("no-image");
  if (input.demoMode) return runDemoInspection(input);

  try {
    return await runLlmInspection(input);
  } catch (e) {
    const code = e instanceof Error ? e.message : "";
    const detail = code === "no-supported-image"
      ? "The photos could not be analysed. Upload a JPEG, PNG or WEBP photo (placeholder images are not analysed)."
      : /^(http-|network|Failed to fetch|NetworkError|Load failed)/i.test(code) || !code
        ? "The inspection service could not be reached."
        : code;
    return unavailableResult(detail);
  }
}

export { runDemoInspection };
