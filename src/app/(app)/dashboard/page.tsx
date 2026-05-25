"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plug, RefreshCw } from "lucide-react";
import { PageTransition } from "@/components/layout/page-transition";
import { DashboardSkeleton } from "@/components/shared/loading-skeleton";
import {
  OverviewCards,
  OverviewCardData,
} from "@/components/dashboard/overview-cards";
import {
  ProductivityTrends,
  TrendsDataMap,
} from "@/components/dashboard/productivity-trends";
import {
  FocusScore,
  FocusScoreData,
} from "@/components/dashboard/focus-score";
import {
  InsightsFeed,
  Insight,
} from "@/components/dashboard/insights-feed";
import {
  ProjectHealth,
  Project,
} from "@/components/dashboard/project-health";
import {
  AiRecommendations,
  Recommendation,
} from "@/components/dashboard/ai-recommendations";
import {
  WeeklySummary,
  WeeklySummaryData,
} from "@/components/dashboard/weekly-summary";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface DashboardData {
  connected: boolean;
  workspace?: string;
  overviewCards?: OverviewCardData[];
  productivityTrends?: TrendsDataMap;
  focusScore?: FocusScoreData;
  projectHealth?: Project[];
  insights?: Insight[];
  recommendations?: Recommendation[];
  weeklySummary?: WeeklySummaryData;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/dashboard/data", { cache: "no-store" });
        if (!res.ok) throw new Error("fetch failed");
        const json = (await res.json()) as DashboardData;
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setData({ connected: false });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <DashboardSkeleton />;

  return (
    <PageTransition className="p-6 space-y-6 max-w-[1600px]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-start justify-between gap-4 flex-wrap"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {data?.connected
              ? `${data.workspace ?? "Your workspace"} · live data from Notion`
              : "Connect Notion to see your live workspace insights"}
          </p>
        </div>
        {data?.connected && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setLoading(true);
              fetch("/api/notion/sync", { method: "POST" }).finally(() => {
                fetch("/api/dashboard/data", { cache: "no-store" })
                  .then((r) => r.json())
                  .then((j) => setData(j))
                  .finally(() => setLoading(false));
              });
            }}
            className="gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Sync Notion
          </Button>
        )}
      </motion.div>

      {/* Connection banner */}
      {!data?.connected && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="border-primary/30 bg-gradient-to-br from-card via-card to-primary/10">
            <CardContent className="p-5 flex items-center gap-4 flex-wrap">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0">
                <Plug className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-[200px]">
                <h3 className="text-sm font-semibold">Not connected yet</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Connect your Notion workspace to see real productivity
                  trends, project health, and AI recommendations here.
                </p>
              </div>
              <Link href="/settings">
                <Button size="sm" className="gap-2">
                  <Plug className="w-3.5 h-3.5" />
                  Connect Notion
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* HERO: Insights take priority. They're the reason the user is here. */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <InsightsFeed
          key={`insights-${data?.insights?.length ?? 0}`}
          initial={data?.insights}
        />
      </motion.div>

      {/* Quick stats — supporting context, not the main story */}
      <OverviewCards cards={data?.overviewCards} />

      {/* Weekly summary spans full width */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
      >
        <WeeklySummary data={data?.weeklySummary} />
      </motion.div>

      {/* Trends chart + Focus score side by side on wide screens */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="lg:col-span-2"
        >
          <ProductivityTrends data={data?.productivityTrends} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
        >
          <FocusScore data={data?.focusScore} />
        </motion.div>
      </div>

      {/* Project list + Suggestions side-by-side. Two cols (was three with
          Insights) so each gets more room to breathe. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <ProjectHealth projects={data?.projectHealth} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
        >
          <AiRecommendations
            key={`recs-${data?.recommendations?.length ?? 0}`}
            initial={data?.recommendations}
          />
        </motion.div>
      </div>
    </PageTransition>
  );
}
