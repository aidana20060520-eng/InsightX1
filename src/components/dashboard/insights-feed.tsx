"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Inbox,
  RotateCcw,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface Insight {
  id: string;
  type: "trend" | "warning" | "success" | "tip";
  title: string;
  description: string;
  time: string;
}

const config = {
  trend: { icon: TrendingUp, color: "text-blue-400", bg: "bg-blue-400/10" },
  warning: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-400/10" },
  success: { icon: CheckCircle2, color: "text-green-400", bg: "bg-green-400/10" },
  tip: { icon: Zap, color: "text-violet-400", bg: "bg-violet-400/10" },
};

// Persist dismissed insight IDs so they don't reappear on refresh/remount.
const DISMISSED_KEY = "insightx:dismissed-insights";

function readSet(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(DISMISSED_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr.filter((x) => typeof x === "string")) : new Set();
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
    <Card className="h-full flex flex-col">
      <CardContent className="p-5 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">AI Insights Feed</h3>
          </div>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-wider">
            Live
          </span>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto -mx-2 px-2 max-h-[420px]">
          <AnimatePresence mode="popLayout">
            {insights.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
                  <Inbox className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">All caught up</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {hasHidden
                    ? "All insights have been dismissed."
                    : "New insights will appear here as they're generated."}
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
              insights.map((insight) => {
                const c = config[insight.type];
                const Icon = c.icon;
                return (
                  <motion.div
                    key={insight.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 30, transition: { duration: 0.2 } }}
                    transition={{ duration: 0.3 }}
                    className="group flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", c.bg)}>
                      <Icon className={cn("w-4 h-4", c.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[13px] font-medium leading-snug">
                          {insight.title}
                        </p>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {insight.time}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                        {insight.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" className="h-6 text-[11px] px-2">
                          View
                        </Button>
                        <button
                          onClick={() => dismiss(insight.id)}
                          className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
