export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "NOT_DETERMINABLE";
export type OverallStatus = "ACCEPT" | "REVIEW" | "REJECT";

export type DefectType =
  | "Sidewall Crack"
  | "Sidewall Cut"
  | "Bulge"
  | "Ozone Crack"
  | "Tread Wear"
  | "Uneven Tread Wear"
  | "Tread Chunking"
  | "Exposed Cord"
  | "Shoulder Damage"
  | "Bead Damage"
  | "Tread Separation"
  | "Foreign Object"
  | "Liner Damage"
  | "Ply Separation"
  | "Run-flat Damage"
  | "Tread Damage"
  | "Abnormal Deformation"
  | "Groove Cracking"
  | "Puncture"
  | "Rib Damage"
  | "Impact Damage"
  | "Shoulder Wear";

export type ImageAngle = "full" | "left" | "right" | "tread" | "bead";
export type TyreImages = Partial<Record<ImageAngle, string>>;

/** Bounding box in percent (0-100) of the displayed image. */
export interface BBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Defect {
  id: string;
  type: DefectType;
  severity: Severity;
  /** 0-100 */
  confidence: number;
  location: string;
  description: string;
  recommendation: string;
  /** Set by the AI engine: only CONFIRMED_VISIBLE has clear visual evidence */
  status?: "CONFIRMED_VISIBLE" | "POSSIBLE";
  /** Which captured image the box refers to */
  angle?: ImageAngle;
  bbox?: BBox;
}

export interface TyreInspectionResult {
  overallStatus: OverallStatus;
  /** 0-100 */
  confidence: number;
  defects: Defect[];
  summary: string;
  recommendation: string;
  engine: string;
  demo: boolean;
  /** REAL_AI = model looked at the uploaded photo, DEMO = simulated, UNAVAILABLE = AI failed (no findings) */
  mode?: AnalysisMode;
  /** The model's reasoning for the recommendation */
  reason?: string;
  imageQuality?: { usable: boolean; score: number; issues: string[] };
  areasNotAssessable?: string[];
  /** Real-AI results: conditions matching a configured retread rejection criterion */
  rejectionReasons?: { code: string; name: string; location: string; evidence: string; why: string; confidence: number }[];
  /** Real-AI results: visible conditions that do NOT automatically reject the tyre */
  observations?: { name: string; location: string; evidence: string; reason: string }[];
  followUp?: string[];
  /** What this analysis could not assess (shown to the user) */
  limitations?: string[];
  /** Set when a real engine failed and the app fell back to Demo Mode */
  fallbackReason?: string;
}

export interface TyreInfo {
  tyreId: string;
  brand: string;
  size: string;
  type: "Truck" | "Bus" | "Commercial" | "Passenger";
  dot: string;
  previousRetread: boolean;
}

export type AnalysisMode = "REAL_AI" | "DEMO" | "UNAVAILABLE";

export type DemoScenario = "ACCEPT" | "REVIEW" | "REJECT" | "SEPARATION";

export interface InspectionRecord {
  id: string;
  tyre: TyreInfo;
  images: TyreImages;
  result: TyreInspectionResult;
  createdAt: number;
  /** created by the user in this browser (vs seeded demo data) */
  user?: boolean;
}
