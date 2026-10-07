"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const styles: Record<Variant, string> = {
  primary: "bg-ink text-bg font-semibold hover:opacity-90",
  secondary: "bg-surface-2 text-ink border border-line hover:bg-ink/10",
  ghost: "text-muted hover:text-ink",
  danger: "bg-bad/10 text-bad border border-bad/30",
};

interface Props extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: Variant;
  full?: boolean;
  children: React.ReactNode;
}

export function Button({ variant = "primary", full = true, className, children, ...rest }: Props) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.08 }}
      className={cn(
        "inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-5 text-[15px] transition-colors disabled:opacity-40",
        full && "w-full",
        styles[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </motion.button>
  );
}
