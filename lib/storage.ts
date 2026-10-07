import type { DemoScenario, InspectionRecord } from "@/types";
import { seedRecords } from "./seed";

const K_HISTORY = "tvai.history.v1";
const K_SETTINGS = "tvai.settings.v2";

export interface Settings {
  theme: "dark" | "light";
  demoMode: boolean;
  scenario: DemoScenario;
  welcomed: boolean;
}

export const DEFAULT_SETTINGS: Settings = { theme: "dark", demoMode: false, scenario: "REVIEW", welcomed: false };

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function loadHistory(): InspectionRecord[] {
  const stored = read<InspectionRecord[]>(K_HISTORY);
  if (stored && Array.isArray(stored) && stored.length) return stored;
  const seeded = seedRecords();
  write(K_HISTORY, seeded);
  return seeded;
}

/** Persist history. If storage quota is hit, drop images from the oldest user records and retry. */
export function saveHistory(records: InspectionRecord[]): boolean {
  if (write(K_HISTORY, records)) return true;
  const slim = records.map((r, i) => (i > 0 && r.user ? { ...r, images: {} } : r));
  return write(K_HISTORY, slim);
}

export function loadSettings(): Settings {
  // Demo mode is never restored from storage: real AI is the default (opt in with ?demo=SCENARIO).
  return { ...DEFAULT_SETTINGS, ...(read<Partial<Settings>>(K_SETTINGS) ?? {}), demoMode: false };
}

export function saveSettings(s: Settings) {
  write(K_SETTINGS, s);
}
