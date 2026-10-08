import type { TyreImages, TyreInfo, TyreInspectionResult } from "@/types";
import { INTERNAL_DEFECT_NOTICE } from "@/lib/ai/tyreInspectionPrompt";
import { runAiInspection } from "./aiInspection";

export type { TyreInspectionResult, OverallStatus } from "@/types";

export interface InspectionInput {
  tyre: TyreInfo;
  images: TyreImages;
  /** 0-1, real upload progress of the photos */
  onUploadProgress?: (fraction: number) => void;
}

export const UNAVAILABLE_MESSAGE = "AI inspection unavailable. Manual inspection required.";

/** Shown when real inference fails. Contains no findings. */
export function unavailableResult(detail?: string): TyreInspectionResult {
  return {
    overallStatus: "REVIEW",
    confidence: 0,
    summary: UNAVAILABLE_MESSAGE,
    recommendation: "Manual inspection required.",
    engine: "AI unavailable",
    mode: "UNAVAILABLE",
    limitations: [...(detail ? [detail] : []), INTERNAL_DEFECT_NOTICE],
  };
}

/** Single entry point used by the UI: the photos are always analysed by the real vision model. */
export async function runTyreInspection(input: InspectionInput): Promise<TyreInspectionResult> {
  if (!Object.values(input.images).some(Boolean)) throw new Error("no-image");
  try {
    return await runAiInspection(input);
  } catch (e) {
    const code = e instanceof Error ? e.message : "";
    const detail = code === "no-supported-image"
      ? "Upload a JPEG, PNG or WEBP photo."
      : /^(http-|network|Failed to fetch|NetworkError|Load failed)/i.test(code) || !code
        ? "The inspection service could not be reached."
        : code;
    return unavailableResult(detail);
  }
}
