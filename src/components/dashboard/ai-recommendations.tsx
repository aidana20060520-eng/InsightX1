"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Check, ArrowRight, X } from "lucide-react";
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

export function AiRecommendations({
  initial = [],
}: {
  initial?: Recommendation[];
}) {
  // Lazy initializer; parent uses `key` to remount when data refreshes.
  const [recs, setRecs] = useState<Recommendation[]>(() => initial);
  const [accepted, setAccepted] = useState<Set<string>>(new Set());

  const handleAccept = (id: string) => {
    // Optimistic UI: immediately mark as accepted
    setAccepted((prev) => new Set(prev).add(id));
    setTimeout(() => {
      setRecs((prev) => prev.filter((r) => r.id !== id));
    }, 600);
  };

  const handleDismiss = (id: string) => {
    setRecs((prev) => prev.filter((r) => r.id !== id));
  };

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
                  No new recommendations right now.
                </p>
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
