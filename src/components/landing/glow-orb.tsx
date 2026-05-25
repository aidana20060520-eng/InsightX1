"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlowOrbProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  color?: "primary" | "accent" | "mixed";
}

const sizeMap = { sm: "w-48 h-48", md: "w-72 h-72", lg: "w-96 h-96" };

const colorMap = {
  primary: "from-primary/30 to-primary/5",
  accent: "from-accent/30 to-accent/5",
  mixed: "from-primary/20 via-accent/15 to-primary/5",
};

export function GlowOrb({
  className,
  size = "md",
  color = "mixed",
}: GlowOrbProps) {
  return (
    <motion.div
      animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.6, 0.4] }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      className={cn(
        "absolute rounded-full blur-3xl bg-gradient-to-br pointer-events-none",
        sizeMap[size],
        colorMap[color],
        className
      )}
    />
  );
}
