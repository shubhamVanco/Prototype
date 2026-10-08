"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { useApp } from "@/components/app-context";

const ICON = { ok: CheckCircle2, warn: AlertTriangle, bad: XCircle, info: Info };
const TONE = { ok: "text-ok", warn: "text-warn", bad: "text-bad", info: "text-brand" };

export function ToastHost() {
  const { toast } = useApp();
  return (
    // Top of the screen, so it never covers the pinned action buttons or the bottom nav.
    <div className="pointer-events-none absolute inset-x-0 top-[calc(env(safe-area-inset-top)+12px)] z-50 flex justify-center px-4 md:top-14" aria-live="polite">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ y: -16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -12, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="flex items-center gap-2 rounded-full border border-line bg-surface-2 px-4 py-2.5 text-sm shadow-xl"
          >
            {(() => {
              const I = ICON[toast.tone];
              return <I size={16} className={TONE[toast.tone]} />;
            })()}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
