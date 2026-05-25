"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  TrendingUp,
  Compass,
  CheckCircle2,
  Lightbulb,
  Inbox,
  RotateCcw,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Insights — the hero element of the dashboard. Patterns the AI has
 * noticed in the user's workspace, framed supportively.
 *
 * Visual approach: rather than yet another bordered card, the feed lives
 * in a soft brand-gradient surface with rounded-3xl cards inside. When
 * there are several insights and the viewport is wide, items lay out
 * two-up so more is visible without scrolling.
 */

export interface Insight {
  id: string;
  type: "trend" | "warning" | "success" | "tip";
  title: string;
  description: string;
  time: string;
}

// Calm, never alarming. "warning" used to be amber+AlertTriangle which
// reads as scolding — now it's Compass + amber-200 (a "look here" cue).
const config: Record<
  Insight["type"],
  {
    icon: React.ComponentType<{ className?: string }>;
    iconClass: string;
    surfaceClass: string;
  }
> = {
  trend: {
    icon: TrendingUp,
    iconClass: "text-sky-300",
    surfaceClass: "bg-sky-300/10",
  },
  warning: {
    icon: Compass,
    iconClass: "text-amber-300",
    surfaceClass: "bg-amber-300/10",
  },
  success: {
    icon: CheckCircle2,
    iconClass: "text-emerald-300",
    surfaceClass: "bg-emerald-300/10",
  },
  tip: {
    icon: Lightbulb,
    iconClass: "text-primary",
    surfaceClass: "bg-primary/10",
  },
};

const DISMISSED_KEY = "insightx:dismissed-insights";

function readSet(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(DISMISSED_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr)
      ? new Set(arr.filter((x) => typeof x === "string"))
      : new Set();
  } catch {
    return new Set();
  }
}

function writeSet(set: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DISMISSED_KEY, JSON.stringify(Array.from(set)));
  } catch {
    /* fail quietly */
  }
}

export function InsightsFeed({ initial = [] }: { initial?: Insight[] }) {
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setHiddenIds(readSet());
  }, []);

  const insights = initial.filter((i) => !hiddenIds.has(i.id));
  const hasHidden = hiddenIds.size > 0;

  const dismiss = (id: string) => {
    const next = new Set(hiddenIds).add(id);
    setHiddenIds(next);
    writeSet(next);
  };

  const restore = () => {
    setHiddenIds(new Set());
    writeSet(new Set());
  };

  return (
    <div className="relative rounded-3xl overflow-hidden border border-border bg-card">
      <div className="brand-gradient-soft absolute inset-0 pointer-events-none" />

      <div className="relative p-6 md:p-7">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary/25 to-accent/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-semibold tracking-tight">
                Insights for you
              </h2>
              <p className="text-xs md:text-[13px] text-muted-foreground mt-0.5">
                {insights.length > 0
                  ? `${insights.length} pattern${insights.length === 1 ? "" : "s"} we noticed in your workspace`
                  : "We'll surface patterns here as your workspace grows"}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <AnimatePresence mode="popLayout" initial={false}>
          {insights.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-10 text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-3">
                <Inbox className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">You&apos;re all caught up</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                {hasHidden
                  ? "Everything has been read. Want to see them again?"
                  : "We surface insights gently — no daily noise. Check back after a few days of activity."}
              </p>
              {hasHidden && (
                <button
                  onClick={restore}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  <RotateCcw className="w-3 h-3" />
                  Restore dismissed
                </button>
              )}
            </motion.div>
          ) : (
            <motion.ul
              key="list"
              layout
              className="grid grid-cols-1 md:grid-cols-2 gap-3"
            >
              {insights.map((insight, i) => {
                const c = config[insight.type];
                const Icon = c.icon;
                return (
                  <motion.li
                    key={insight.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 30, transition: { duration: 0.2 } }}
                    transition={{ duration: 0.3, delay: i * 0.04 }}
                    className="group relative rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-4 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                          c.surfaceClass
                        )}
                      >
                        <Icon className={cn("w-4 h-4", c.iconClass)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold leading-snug">
                            {insight.title}
                          </p>
                          <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">
                            {insight.time}
                          </span>
                        </div>
                        <p className="text-[13px] text-muted-foreground leading-relaxed mt-1.5">
                          {insight.description}
                        </p>
                        <div className="flex items-center gap-1 mt-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-[11px] px-2.5 rounded-full"
                          >
                            Explore
                          </Button>
                          <button
                            onClick={() => dismiss(insight.id)}
                            className="h-7 px-2.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground rounded-full transition-colors opacity-0 group-hover:opacity-100"
                            aria-label="Dismiss insight"
                          >
                            <X className="w-3 h-3" />
                            Not now
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
