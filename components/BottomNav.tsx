"use client";

import { motion } from "framer-motion";
import { Clock, Home, ScanLine, User } from "lucide-react";
import { cn } from "@/lib/cn";
import { useApp, type Screen } from "./app-context";

const ITEMS: { key: string; label: string; icon: typeof Home; screen: Screen }[] = [
  { key: "home", label: "Home", icon: Home, screen: "dashboard" },
  { key: "inspect", label: "Inspect", icon: ScanLine, screen: "new" },
  { key: "history", label: "History", icon: Clock, screen: "history" },
  { key: "profile", label: "Profile", icon: User, screen: "profile" },
];

/** Four identical tabs: same size, same icon + label layout, same active indicator. */
export function BottomNav() {
  const { screen, go, startNew } = useApp();
  return (
    <nav
      className="relative z-10 border-t border-line bg-bg px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-1.5"
      aria-label="Main"
    >
      <ul className="grid grid-cols-4">
        {ITEMS.map((it) => {
          const active = screen === it.screen;
          const Icon = it.icon;
          return (
            <li key={it.key}>
              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={() => {
                  if (it.key === "inspect") startNew();
                  go(it.screen);
                }}
                aria-current={active ? "page" : undefined}
                className="flex min-h-14 w-full flex-col items-center justify-center gap-1 rounded-xl"
              >
                <span
                  className={cn(
                    "flex h-7 w-14 items-center justify-center rounded-full transition-colors",
                    active ? "bg-brand/15 text-brand" : "text-muted",
                  )}
                >
                  <Icon size={21} />
                </span>
                <span className={cn("text-[11px] font-medium leading-none", active ? "text-ink" : "text-muted")}>
                  {it.label}
                </span>
              </motion.button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
