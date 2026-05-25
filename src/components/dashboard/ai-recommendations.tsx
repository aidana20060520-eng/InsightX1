"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Check, ArrowRight, X, RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  action: string;
}

const impactColor = {
  high: "text-red-400 bg-red-400/10",
  medium: "text-amber-400 bg-amber-400/10",
  low: "text-blue-400 bg-blue-400/10",
};

// Persist dismissed/accepted rec IDs in localStorage so they don't reappear
// every time the dashboard refetches data or the user reloads.
const DISMISSED_KEY = "insightx:dismissed-recs";
const ACCEPTED_KEY = "insightx:accepted-recs";

function readSet(key: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr.filter((x) => typeof x === "string")) : new Set();
  } catch {
    return new Set();
  }
}

function writeSet(key: string, set: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(Array.from(set)));
  } catch {
    /* storage full / blocked — fail quietly */
  }
}

export function AiRecommendations({
  initial = [],
}: {
  initial?: Recommendation[];
}) {
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [accepted, setAccepted] = useState<Set<string>>(new Set());

  // Hydrate persisted state once on mount (client-only)
  useEffect(() => {
    setHiddenIds(readSet(DISMISSED_KEY));
    setAccepted(readSet(ACCEPTED_KEY));
  }, []);

  // Recompute visible list each render — derives from props + persisted ids
  const recs = initial.filter((r) => !hiddenIds.has(r.id));

  const persistDismissed = (next: Set<string>) => {
    setHiddenIds(next);
    writeSet(DISMISSED_KEY, next);
  };
  const persistAccepted = (next: Set<string>) => {
    setAccepted(next);
    writeSet(ACCEPTED_KEY, next);
  };

  const handleAccept = (id: string) => {
    // Optimistic: mark accepted immediately, then hide after a beat so the
    // user sees the "Applied" check before the card animates out.
    const nextAccepted = new Set(accepted).add(id);
    persistAccepted(nextAccepted);
    setTimeout(() => {
      const nextHidden = new Set(hiddenIds).add(id);
      persistDismissed(nextHidden);
    }, 600);
  };

  const handleDismiss = (id: string) => {
    const next = new Set(hiddenIds).add(id);
    persistDismissed(next);
  };

  const handleRestore = () => {
    persistDismissed(new Set());
    persistAccepted(new Set());
  };

  const hasHidden = hiddenIds.size > 0;

  return (
    <Card className="h-full">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">AI Recommendations</h3>
            <p className="text-[11px] text-muted-foreground">
              Personalized actions to improve outcomes
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {recs.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-8 text-center"
              >
                <div className="w-10 h-10 rounded-full bg-green-400/10 flex items-center justify-center mb-3">
                  <Check className="w-5 h-5 text-green-400" />
                </div>
                <p className="text-sm font-medium">You&apos;re all set</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {hasHidden
                    ? "All recommendations have been dismissed or applied."
                    : "No new recommendations right now."}
                </p>
                {hasHidden && (
                  <button
                    onClick={handleRestore}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Restore dismissed
                  </button>
                )}
              </motion.div>
            ) : (
              recs.map((rec) => (
                <motion.div
                  key={rec.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{
                    opacity: accepted.has(rec.id) ? 0.5 : 1,
                    y: 0,
                  }}
                  exit={{ opacity: 0, x: 20, transition: { duration: 0.25 } }}
                  transition={{ duration: 0.3 }}
                  className="rounded-xl border border-border bg-muted/30 p-4 group hover:border-primary/20 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wider ${impactColor[rec.impact]}`}
                    >
                      {rec.impact} impact
                    </span>
                    <button
                      onClick={() => handleDismiss(rec.id)}
                      className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Dismiss"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <h4 className="text-[13px] font-semibold mb-1">{rec.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                    {rec.description}
                  </p>
                  <Button
                    size="sm"
                    onClick={() => handleAccept(rec.id)}
                    disabled={accepted.has(rec.id)}
                    className="h-7 text-[11px] gap-1"
                  >
                    {accepted.has(rec.id) ? (
                      <>
                        <Check className="w-3 h-3" />
                        Applied
                      </>
                    ) : (
                      <>
                        {rec.action}
                        <ArrowRight className="w-3 h-3" />
                      </>
                    )}
                  </Button>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
