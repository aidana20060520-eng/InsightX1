"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Filter,
  RefreshCw,
  Plug,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/layout/page-transition";
import { InsightsSkeleton } from "@/components/shared/loading-skeleton";
import { cn } from "@/lib/utils";

type InsightType = "all" | "opportunity" | "warning" | "success";

interface Insight {
  id: string;
  type: "opportunity" | "warning" | "success";
  title: string;
  description: string;
  confidence: number;
  impact: "high" | "medium" | "low";
  metric: string;
}

interface InsightsResponse {
  connected: boolean;
  workspace?: string;
  insights: Insight[];
  fallback?: boolean;
}

const typeConfig = {
  opportunity: {
    icon: TrendingUp,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    label: "Opportunity",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    label: "Warning",
  },
  success: {
    icon: CheckCircle2,
    color: "text-green-400",
    bg: "bg-green-400/10",
    label: "Success",
  },
};

export default function InsightsPage() {
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [filter, setFilter] = useState<InsightType>("all");
  const [data, setData] = useState<InsightsResponse | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRegenerating(true);
    try {
      const res = await fetch("/api/insights", { cache: "no-store" });
      const json = (await res.json()) as InsightsResponse;
      setData(json);
    } catch {
      setData({ connected: false, insights: [] });
    } finally {
      setLoading(false);
      setRegenerating(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <InsightsSkeleton />;

  const filtered =
    filter === "all"
      ? data?.insights ?? []
      : (data?.insights ?? []).filter((i) => i.type === filter);

  const connected = data?.connected ?? false;

  return (
    <PageTransition className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-bold">AI Insights</h1>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            {connected
              ? `Generated from ${data?.workspace ?? "your workspace"}${data?.fallback ? " (AI fallback)" : ""}`
              : "Connect Notion to generate insights from your real workspace."}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {connected && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => load(true)}
              disabled={regenerating}
              className="gap-2"
            >
              <RefreshCw
                className={cn(
                  "w-3.5 h-3.5",
                  regenerating && "animate-spin"
                )}
              />
              {regenerating ? "Regenerating..." : "Regenerate"}
            </Button>
          )}
          {connected && (
            <>
              <Filter className="w-4 h-4 text-muted-foreground" />
              {(
                ["all", "opportunity", "warning", "success"] as InsightType[]
              ).map((type) => (
                <Button
                  key={type}
                  variant={filter === type ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setFilter(type)}
                  className="text-xs capitalize"
                >
                  {type}
                </Button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Not connected state */}
      {!connected && (
        <Card className="border-primary/30 bg-gradient-to-br from-card via-card to-primary/10">
          <CardContent className="p-8 flex flex-col items-center text-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <Plug className="w-6 h-6 text-primary" />
            </div>
            <div className="max-w-md">
              <h3 className="text-base font-semibold mb-1">
                Connect Notion to see real insights
              </h3>
              <p className="text-sm text-muted-foreground">
                AI Insights analyzes your synced Notion data and surfaces
                patterns, risks, and opportunities — personalized to your
                workspace.
              </p>
            </div>
            <Link href="/settings">
              <Button className="gap-2">
                <Plug className="w-4 h-4" />
                Connect Notion
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Empty filter state */}
      {connected && filtered.length === 0 && data && data.insights.length > 0 && (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No {filter} insights right now. Try a different filter.
          </CardContent>
        </Card>
      )}

      {/* No insights generated state */}
      {connected && (data?.insights?.length ?? 0) === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No insights yet. Click <strong>Regenerate</strong> to try again.
          </CardContent>
        </Card>
      )}

      {/* Insights Grid */}
      {connected && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((insight, i) => {
            const config = typeConfig[insight.type];
            const Icon = config.icon;
            return (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                whileHover={{ y: -4 }}
              >
                <Card className="h-full hover:border-primary/20 transition-all">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div
                        className={cn(
                          "flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wide",
                          config.bg,
                          config.color
                        )}
                      >
                        <Icon className="w-3 h-3" />
                        {config.label}
                      </div>
                      <span
                        className={cn(
                          "text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full",
                          insight.impact === "high"
                            ? "bg-red-400/10 text-red-400"
                            : insight.impact === "medium"
                              ? "bg-amber-400/10 text-amber-400"
                              : "bg-muted text-muted-foreground"
                        )}
                      >
                        {insight.impact} impact
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold leading-snug">
                      {insight.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {insight.description}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <span className="text-xs font-medium text-primary">
                        {insight.metric}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${insight.confidence}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground tabular-nums">
                          {insight.confidence}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </PageTransition>
  );
}
