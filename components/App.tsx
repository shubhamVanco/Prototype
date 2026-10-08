"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { Battery, Signal, Wifi } from "lucide-react";
import { AppProvider, useApp, type Screen } from "./app-context";
import { BottomNav } from "./BottomNav";
import { ToastHost } from "./ui/toast";
import { Splash } from "./Splash";
import { WelcomeScreen } from "@/screens/Welcome";
import { DashboardScreen } from "@/screens/Dashboard";
import { NewInspectionScreen } from "@/screens/NewInspection";
import { CaptureScreen } from "@/screens/Capture";
import { ScanningScreen } from "@/screens/Scanning";
import { ResultScreen } from "@/screens/Result";
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
  // The bottom nav stays on every screen; only the first-run welcome screen goes without it.
  const showNav = screen !== "welcome";

  return (
    // Phones: the app fills the screen. Larger screens: the same phone frame as hyperflux.vanco.ai
    // (white page, 380x800 black frame, 50px corners, 12px bezel, 4px inner border, 40px screen corners).
    <div className="flex min-h-dvh items-center justify-center md:bg-white md:p-6">
      <div className="relative w-full md:h-[800px] md:w-[380px] md:shrink-0 md:rounded-[50px] md:bg-black md:p-3 md:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.4)]">
        <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-bg pt-[env(safe-area-inset-top)] md:h-full md:rounded-[40px] md:border-4 md:border-black md:pt-0">
          <StatusBar />
          <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-ink focus:px-3 focus:py-2 focus:text-bg">
            Skip to content
          </a>
          <ToastHost />
          <AnimatePresence>{showSplash && <Splash key="splash" />}</AnimatePresence>
          {ready && (
            <>
              <main id="main" ref={mainRef} tabIndex={-1} className="relative flex-1 overflow-y-auto overflow-x-hidden overscroll-contain outline-none">
                {/* Each screen starts at the top, not at the previous screen's scroll position */}
                <AnimatePresence mode="wait" initial={false} onExitComplete={() => mainRef.current?.scrollTo(0, 0)}>
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
          {/* Home indicator: 24px strip at the bottom with a 120x4 gesture bar */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 z-[70] hidden h-6 items-center justify-center md:flex">
            <span className="h-1 w-[120px] rounded-[2px] bg-ink opacity-60" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Phone status bar with dynamic island, sized like hyperflux.vanco.ai. Only drawn inside the desktop phone frame. */
function StatusBar() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }));
    tick();
    const t = setInterval(tick, 15_000);
    return () => clearInterval(t);
  }, []);
  return (
    <div aria-hidden="true" className="relative z-[70] hidden h-12 shrink-0 items-center justify-between bg-bg px-6 text-ink md:flex">
      <span className="tabular text-[13px] font-bold tracking-[-0.2px]">{time}</span>
      <span className="absolute left-1/2 top-2.5 h-7 w-[105px] -translate-x-1/2 rounded-[20px] bg-black" />
      <span className="flex items-center gap-1.5">
        <Signal size={12} strokeWidth={2} />
        <Wifi size={12} strokeWidth={2} />
        <Battery size={14} strokeWidth={2} />
      </span>
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
