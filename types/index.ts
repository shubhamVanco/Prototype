export type OverallStatus = "ACCEPT" | "REVIEW" | "REJECT";

export type ImageAngle = "full" | "left" | "right" | "tread" | "bead";
export type TyreImages = Partial<Record<ImageAngle, string>>;

export interface TyreInspectionResult {
  overallStatus: OverallStatus;
  /** 0-100 */
  confidence: number;
  /** Short reason for the decision (2-3 lines max) */
  summary: string;
  recommendation: string;
  engine: string;
  /** REAL_AI = model looked at the uploaded photo, UNAVAILABLE = AI failed (no findings) */
  mode: AnalysisMode;
  /** Set when the photos were rejected because no tyre was found in them */
  notATyre?: boolean;
  imageQuality?: { usable: boolean; score: number; issues: string[] };
  areasNotAssessable?: string[];
  /** Conditions matching a configured retread rejection criterion */
  rejectionReasons?: { code: string; name: string; location: string; evidence: string; why: string; confidence: number }[];
  /** Visible conditions that do NOT automatically reject the tyre */
  observations?: { name: string; location: string; evidence: string; reason: string }[];
  followUp?: string[];
  /** What this analysis could not assess (shown to the user) */
  limitations?: string[];
}

export interface TyreInfo {
  tyreId: string;
  brand: string;
  size: string;
  type: "Truck" | "Bus" | "Commercial" | "Passenger";
  dot: string;
  previousRetread: boolean;
}

export type AnalysisMode = "REAL_AI" | "UNAVAILABLE";

export interface InspectionRecord {
  id: string;
  tyre: TyreInfo;
  images: TyreImages;
  result: TyreInspectionResult;
  createdAt: number;
}
