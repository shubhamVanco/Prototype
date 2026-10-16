export type OverallStatus = "ACCEPT" | "REVIEW" | "REJECT";

export type ImageAngle = "full" | "left" | "right" | "tread" | "bead";
export type TyreImages = Partial<Record<ImageAngle, string>>;

/** Two 360° scan videos. Only sampled frames (JPEG data URLs) are kept and sent to the AI. */
export type VideoSlot = "video1" | "video2";
export type TyreVideos = Partial<Record<VideoSlot, string[]>>;

export type RetakeReason = "LIGHTING" | "CLOSER_LOOK" | "BLUR" | "ANGLE" | "OBSTRUCTED";

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
  /**
   * Set when the AI rejected because the views were not good enough to decide (lighting,
   * closer look needed...). The app re-opens the camera for `views`.
   */
  retake?: { reason: RetakeReason; views: string[]; instruction: string };
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
  /** Absent on records saved before video capture existed */
  videos?: TyreVideos;
  result: TyreInspectionResult;
  createdAt: number;
}
