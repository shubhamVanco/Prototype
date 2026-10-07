"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { AppProvider, TAB_SCREENS, useApp, type Screen } from "./app-context";
import { BottomNav } from "./BottomNav";
import { ToastHost } from "./ui/toast";
import { Splash } from "./Splash";
import { WelcomeScreen } from "@/screens/Welcome";
import { DashboardScreen } from "@/screens/Dashboard";
import { NewInspectionScreen } from "@/screens/NewInspection";
import { CaptureScreen } from "@/screens/Capture";
import { ScanningScreen } from "@/screens/Scanning";
import { ResultScreen } from "@/screens/Result";
import { DefectDetailScreen } from "@/screens/DefectDetail";
import { HistoryScreen } from "@/screens/History";
import { DetailScreen } from "@/screens/Detail";
import { ProfileScreen } from "@/screens/Profile";

const SCREENS: Record<Screen, () => React.JSX.Element> = {
  welcome: WelcomeScreen,
  dashboard: DashboardScreen,
  new: NewInspectionScreen,
  capture: CaptureScreen,
  scanning: ScanningScreen,
  result: ResultScreen,
  defect: DefectDetailScreen,
  history: HistoryScreen,
  detail: DetailScreen,
  profile: ProfileScreen,
};

function Shell() {
  const { ready, screen } = useApp();
  const Current = SCREENS[screen];
  const mainRef = useRef<HTMLElement>(null);
  // Move focus to the new screen so keyboard / screen-reader users land on the content
  useEffect(() => {
    if (ready) mainRef.current?.focus({ preventScroll: true });
  }, [screen, ready]);
  // Launch animation: always shown on app open; stays until the app is ready and the animation has played.
  const [minElapsed, setMinElapsed] = useState(false);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = setTimeout(() => setMinElapsed(true), reduce ? 500 : 2000);
    return () => clearTimeout(t);
  }, []);
  const showSplash = !ready || !minElapsed;
  const showNav = TAB_SCREENS.includes(screen) || screen === "new";

  return (
    <div className="flex min-h-dvh items-center justify-center md:p-6">
      <div className="relative flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-bg md:h-[844px] md:max-h-[calc(100dvh-48px)] md:rounded-[40px] md:border md:border-line md:shadow-[0_30px_80px_-40px_rgba(0,0,0,0.7)]">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-ink focus:px-3 focus:py-2 focus:text-bg">
          Skip to content
        </a>
        <ToastHost />
        <AnimatePresence>{showSplash && <Splash key="splash" />}</AnimatePresence>
        {ready && (
          <>
            <main id="main" ref={mainRef} tabIndex={-1} className="relative flex-1 overflow-y-auto overflow-x-hidden outline-none">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={screen}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.16 }}
                  className="min-h-full"
                >
                  <Current />
                </motion.div>
              </AnimatePresence>
            </main>
            {showNav && <BottomNav />}
          </>
        )}
      </div>
    </div>
  );
}

export function App() {
  return (
    <MotionConfig reducedMotion="user">
      <AppProvider>
        <Shell />
      </AppProvider>
    </MotionConfig>
  );
}
