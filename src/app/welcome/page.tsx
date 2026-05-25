"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Check,
  Calendar,
  Archive,
  Database,
  TrendingUp,
  Layers,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { MarkdownRenderer } from "@/components/assistant/markdown-renderer";
import { cn } from "@/lib/utils";

interface Insights {
  workspace: string;
  stats: {
    pages: number;
    databases: number;
    editedThisWeek: number;
    createdLast30d: number;
    stale: number;
  };
  summary: string;
  patterns: Array<{ title: string; insight: string; icon: string }>;
  recommendations: Array<{
    title: string;
    description: string;
    impact: "high" | "medium" | "low";
    action: string;
  }>;
}

const analysisSteps = [
  "Connecting to your workspace",
  "Reading pages and databases",
  "Detecting productivity patterns",
  "Generating personalized recommendations",
];

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  calendar: Calendar,
  archive: Archive,
  database: Database,
  "trending-up": TrendingUp,
  layers: Layers,
  sparkles: Sparkles,
};

const impactColor = {
  high: "text-red-400 bg-red-400/10",
  medium: "text-amber-400 bg-amber-400/10",
  low: "text-blue-400 bg-blue-400/10",
};

export default function WelcomePage() {
  const router = useRouter();
  const [phase, setPhase] = useState<"analyzing" | "ready">("analyzing");
  const [stepIndex, setStepIndex] = useState(0);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = useCallback(async () => {
    // Try a few times if sync is still in progress
    for (let attempt = 0; attempt < 8; attempt++) {
      try {
        const res = await fetch("/api/notion/insights", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setInsights(data);
          return;
        }
      } catch (e) {
        console.error("insights fetch failed:", e);
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
    setError(
      "Couldn't load insights yet. Your sync may still be running — try refreshing in a moment."
    );
  }, []);

  // Kick off insights fetch in parallel with the animation
  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  // Advance through analysis steps
  useEffect(() => {
    if (phase !== "analyzing") return;
    if (stepIndex >= analysisSteps.length - 1) {
      // Wait a beat then reveal results (only when insights are loaded)
      if (insights || error) {
        const t = setTimeout(() => setPhase("ready"), 600);
        return () => clearTimeout(t);
      }
      return;
    }
    const timer = setTimeout(() => setStepIndex((i) => i + 1), 1400);
    return () => clearTimeout(timer);
  }, [phase, stepIndex, insights, error]);

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
        {/* Ambient glow */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <motion.div
            animate={{
              x: ["-10%", "10%", "-10%"],
              y: ["-10%", "5%", "-10%"],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/10 blur-3xl"
          />
          <motion.div
            animate={{
              x: ["10%", "-10%", "10%"],
              y: ["10%", "-5%", "10%"],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-accent/10 blur-3xl"
          />
        </div>

        <div className="relative max-w-3xl mx-auto px-6 py-12 md:py-20">
          <AnimatePresence mode="wait">
            {phase === "analyzing" ? (
              <AnalyzingView
                key="analyzing"
                stepIndex={stepIndex}
                insightsReady={!!insights || !!error}
              />
            ) : (
              <ReadyView
                key="ready"
                insights={insights}
                error={error}
                onContinue={() => router.push("/dashboard")}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </ThemeProvider>
  );
}

function AnalyzingView({
  stepIndex,
  insightsReady,
}: {
  stepIndex: number;
  insightsReady: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="flex flex-col items-center text-center pt-12"
    >
      {/* Animated logo */}
      <motion.div
        animate={{
          scale: [1, 1.08, 1],
          rotate: [0, 4, -4, 0],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="relative mb-8"
      >
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary to-accent blur-2xl opacity-50" />
        <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-2xl shadow-primary/30">
          <Sparkles className="w-9 h-9 text-white" />
        </div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-3xl md:text-4xl font-bold tracking-tight mb-3"
      >
        Analyzing your workspace
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-muted-foreground text-base mb-12 max-w-md"
      >
        I&apos;m reading your Notion pages and learning your patterns. This
        takes about 30 seconds.
      </motion.p>

      <div className="w-full max-w-md space-y-3">
        {analysisSteps.map((step, i) => {
          const isDone =
            i < stepIndex || (i === analysisSteps.length - 1 && insightsReady);
          const isActive = i === stepIndex && !isDone;
          return (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * i }}
              className={cn(
                "flex items-center gap-3 p-4 rounded-xl border transition-colors",
                isDone
                  ? "border-primary/30 bg-primary/5"
                  : isActive
                    ? "border-primary/40 bg-primary/10"
                    : "border-border bg-muted/30"
              )}
            >
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors",
                  isDone
                    ? "bg-primary text-primary-foreground"
                    : isActive
                      ? "bg-primary/20"
                      : "bg-muted"
                )}
              >
                {isDone ? (
                  <Check className="w-3.5 h-3.5" />
                ) : isActive ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                ) : (
                  <span className="text-[11px] text-muted-foreground">
                    {i + 1}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "text-sm font-medium text-left",
                  isDone || isActive ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step}
              </span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

function ReadyView({
  insights,
  error,
  onContinue,
}: {
  insights: Insights | null;
  error: string | null;
  onContinue: () => void;
}) {
  if (error || !insights) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center pt-20"
      >
        <h1 className="text-2xl font-bold mb-3">Almost there</h1>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          {error ||
            "We couldn't load your insights right now. Your sync may still be running."}
        </p>
        <Button onClick={onContinue}>Go to dashboard</Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-center pt-6"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-400/10 text-green-400 text-xs font-medium mb-4">
          <Check className="w-3.5 h-3.5" />
          Workspace connected
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
          Here&apos;s what I found
        </h1>
        <p className="text-muted-foreground">
          First insights from{" "}
          <span className="font-semibold text-foreground">
            {insights.workspace}
          </span>
        </p>
      </motion.div>

      {/* Quick stats */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        {[
          { label: "Pages", value: insights.stats.pages },
          { label: "Databases", value: insights.stats.databases },
          { label: "Edits this week", value: insights.stats.editedThisWeek },
          { label: "New (30d)", value: insights.stats.createdLast30d },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold tabular-nums">{s.value}</div>
              <div className="text-[11px] text-muted-foreground uppercase tracking-wider mt-1">
                {s.label}
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-primary/20 bg-gradient-to-br from-card via-card to-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
              </div>
              <h2 className="text-sm font-semibold">AI Summary</h2>
            </div>
            <MarkdownRenderer
              content={insights.summary}
              className="text-[14px]"
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Patterns */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Patterns I detected
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {insights.patterns.map((p, i) => {
            const Icon = iconMap[p.icon] || Sparkles;
            return (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.08 }}
              >
                <Card className="h-full">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-[13px] font-semibold mb-1">
                          {p.title}
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {p.insight}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Recommendations
        </h2>
        <div className="space-y-3">
          {insights.recommendations.map((rec, i) => (
            <motion.div
              key={rec.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + i * 0.08 }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span
                          className={cn(
                            "text-[10px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wider",
                            impactColor[rec.impact]
                          )}
                        >
                          {rec.impact} impact
                        </span>
                      </div>
                      <h3 className="text-[14px] font-semibold mb-1">
                        {rec.title}
                      </h3>
                      <p className="text-[12px] text-muted-foreground leading-relaxed">
                        {rec.description}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" className="shrink-0 gap-1">
                      {rec.action}
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-6"
      >
        <Button size="lg" onClick={onContinue} className="gap-2 w-full sm:w-auto">
          Open dashboard
          <ArrowRight className="w-4 h-4" />
        </Button>
        <p className="text-xs text-muted-foreground">
          Your full workspace insights are ready
        </p>
      </motion.div>
    </motion.div>
  );
}
