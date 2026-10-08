"use client";

import { motion } from "framer-motion";

/** Launch animation: a tyre rolls in, the name appears, a loader fills. */
export function Splash({ duration = 2000 }: { duration?: number }) {
  return (
    <motion.div
      role="status"
      aria-label="TyreVision AI is loading"
      className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-bg"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <motion.div
        className="relative size-36 text-ink"
        initial={{ x: -150, rotate: -270 }}
        animate={{ x: 0, rotate: 0 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      >
        <svg viewBox="0 0 200 200" className="size-full" aria-hidden="true">
          <circle cx="100" cy="100" r="94" fill="none" stroke="currentColor" strokeWidth="14" />
          <circle cx="100" cy="100" r="94" fill="none" stroke="var(--color-bg)" strokeWidth="14" strokeDasharray="9 7" opacity="0.55" />
          <circle cx="100" cy="100" r="68" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
          <circle cx="100" cy="100" r="44" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
          <circle cx="100" cy="100" r="9" fill="currentColor" />
        </svg>
      </motion.div>

      <motion.h1
        className="mt-8 font-display text-4xl font-bold tracking-tight"
        initial={{ y: 14, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        TyreVision AI
      </motion.h1>
      <motion.p
        className="mt-1.5 text-base text-muted"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        AI-powered tyre pre-inspection
      </motion.p>

      <div className="absolute bottom-16 h-1 w-40 overflow-hidden rounded-full bg-ink/10">
        <motion.div
          className="h-full rounded-full bg-ink"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: duration / 1000, ease: "easeInOut" }}
        />
      </div>
    </motion.div>
  );
}
