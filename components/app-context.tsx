"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_SETTINGS, loadHistory, loadSettings, saveHistory, saveSettings, type Settings,
} from "@/lib/storage";
import type { InspectionRecord, TyreImages, TyreInfo } from "@/types";

export type Screen =
  | "welcome" | "dashboard" | "new" | "capture" | "scanning"
  | "result" | "history" | "detail" | "profile";

export const TAB_SCREENS: Screen[] = ["dashboard", "history", "profile"];

interface Toast { id: number; message: string; tone: "ok" | "warn" | "bad" | "info" }

interface Ctx {
  ready: boolean;
  screen: Screen;
  go: (s: Screen, opts?: { replace?: boolean }) => void;
  back: () => void;
  settings: Settings;
  updateSettings: (p: Partial<Settings>) => void;
  history: InspectionRecord[];
  nextTyreId: () => string;
  draft: { tyre: TyreInfo; images: TyreImages };
  setTyre: (t: TyreInfo) => void;
  setImages: (i: TyreImages) => void;
  startNew: () => void;
  current: InspectionRecord | null;
  setCurrent: (r: InspectionRecord | null) => void;
  isSaved: (id: string) => boolean;
  saveCurrent: () => boolean;
  toast: Toast | null;
  notify: (message: string, tone?: Toast["tone"]) => void;
}

const AppCtx = createContext<Ctx | null>(null);

export function useApp() {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp outside provider");
  return c;
}

const emptyTyre = (id: string): TyreInfo => ({
  tyreId: id, brand: "", size: "", type: "Truck", dot: "", previousRetread: false,
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [stack, setStack] = useState<Screen[]>(["dashboard"]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [history, setHistory] = useState<InspectionRecord[]>([]);
  const [draft, setDraft] = useState<{ tyre: TyreInfo; images: TyreImages }>({
    tyre: emptyTyre("TV-1025"), images: {},
  });
  const [current, setCurrent] = useState<InspectionRecord | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const s = loadSettings();
    const h = loadHistory();
    setSettings(s);
    setHistory(h);
    setStack([s.welcomed ? "dashboard" : "welcome"]);
    setDraft({ tyre: emptyTyre(nextId(h)), images: {} });
    setReady(true);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme === "light" ? "light" : "dark";
  }, [settings.theme]);

  const screen = stack[stack.length - 1];

  const go = useCallback((s: Screen, opts?: { replace?: boolean }) => {
    setStack((st) => {
      if (s === st[st.length - 1]) return st;
      // tab destinations reset the stack so Back never loops through the flow
      if (TAB_SCREENS.includes(s) || s === "welcome") return [s];
      return opts?.replace ? [...st.slice(0, -1), s] : [...st, s];
    });
  }, []);

  const back = useCallback(() => {
    setStack((st) => (st.length > 1 ? st.slice(0, -1) : ["dashboard"]));
  }, []);

  const updateSettings = useCallback((p: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...p };
      saveSettings(next);
      return next;
    });
  }, []);

  const notify = useCallback((message: string, tone: Toast["tone"] = "info") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), message, tone });
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const nextTyreId = useCallback(() => nextId(history), [history]);

  const startNew = useCallback(() => {
    setDraft({ tyre: emptyTyre(nextId(history)), images: {} });
    setCurrent(null);
  }, [history]);

  const isSaved = useCallback((id: string) => history.some((r) => r.id === id), [history]);

  const saveCurrent = useCallback(() => {
    if (!current) return false;
    if (history.some((r) => r.id === current.id)) {
      notify("Already saved", "info");
      return true;
    }
    const record = { ...current };
    const next = [record, ...history];
    setHistory(next);
    setCurrent(record);
    const ok = saveHistory(next);
    notify(ok ? "Inspection saved" : "Saved for this session (storage full)", ok ? "ok" : "warn");
    return true;
  }, [current, history, notify]);

  const value = useMemo<Ctx>(
    () => ({
      ready, screen, go, back, settings, updateSettings, history, nextTyreId, draft,
      setTyre: (tyre) => setDraft((d) => ({ ...d, tyre })),
      setImages: (images) => setDraft((d) => ({ ...d, images })),
      startNew, current, setCurrent, isSaved, saveCurrent, toast, notify,
    }),
    [ready, screen, go, back, settings, updateSettings, history, nextTyreId, draft, startNew,
      current, isSaved, saveCurrent, toast, notify],
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

function nextId(h: InspectionRecord[]) {
  const max = h.reduce((m, r) => Math.max(m, Number(r.id.replace(/\D/g, "")) || 0), 1024);
  return `TV-${max + 1}`;
}
