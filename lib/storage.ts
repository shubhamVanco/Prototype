import type { InspectionRecord } from "@/types";

const K_HISTORY = "tvai.history.v2";
const K_HISTORY_V1 = "tvai.history.v1";
const K_SETTINGS = "tvai.settings.v2";

export interface Settings {
  theme: "dark" | "light";
  welcomed: boolean;
}

export const DEFAULT_SETTINGS: Settings = { theme: "dark", welcomed: false };

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

type LegacyRecord = Omit<InspectionRecord, "result"> & { user?: boolean; result: Omit<InspectionRecord["result"], "mode"> & { demo?: boolean; mode?: string } };

/** History holds only real inspections saved in this browser. */
export function loadHistory(): InspectionRecord[] {
  const stored = read<InspectionRecord[]>(K_HISTORY);
  if (stored && Array.isArray(stored)) return stored;
  // One-time move from v1: keep the user's own real-AI inspections, drop sample and simulated records.
  const old = read<LegacyRecord[]>(K_HISTORY_V1);
  const kept = Array.isArray(old)
    ? old
        .filter((r) => r.user && !r.result.demo && r.result.mode !== "DEMO")
        .map(({ user: _user, ...r }) => r as unknown as InspectionRecord)
    : [];
  write(K_HISTORY, kept);
  try { localStorage.removeItem(K_HISTORY_V1); } catch { /* ignore */ }
  return kept;
}

/** Persist history. If storage quota is hit, drop images from older records and retry. */
export function saveHistory(records: InspectionRecord[]): boolean {
  if (write(K_HISTORY, records)) return true;
  const slim = records.map((r, i) => (i > 0 ? { ...r, images: {} } : r));
  return write(K_HISTORY, slim);
}

export function loadSettings(): Settings {
  const s = read<Partial<Settings>>(K_SETTINGS) ?? {};
  return { theme: s.theme === "light" ? "light" : "dark", welcomed: !!s.welcomed };
}

export function saveSettings(s: Settings) {
  write(K_SETTINGS, s);
}
