"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Brain,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface OverviewCardData {
  label: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: string;
  hint: string;
}

const iconMap: Record<string, LucideIcon> = {
  trendingUp: TrendingUp,
  brain: Brain,
  checkCircle: CheckCircle2,
  clock: Clock,
};

const defaultCards: OverviewCardData[] = [
  {
    label: "Productivity Score",
    value: "—",
    change: "no data",
    trend: "up",
    icon: "trendingUp",
    hint: "connect Notion",
  },
  {
    label: "Pages Edited",
    value: "—",
    change: "no data",
    trend: "up",
    icon: "brain",
    hint: "this week",
  },
  {
    label: "Pages Created",
    value: "—",
    change: "no data",
    trend: "up",
    icon: "checkCircle",
    hint: "this month",
  },
  {
    label: "Stale Pages",
    value: "—",
    change: "no data",
    trend: "up",
    icon: "clock",
    hint: "30+ days idle",
  },
];

export function OverviewCards({ cards }: { cards?: OverviewCardData[] }) {
  const items = cards ?? defaultCards;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((card, i) => {
        const Icon = iconMap[card.icon] ?? TrendingUp;
        return (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.4 }}
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
        >
          <Card className="hover:border-primary/20 transition-colors group h-full">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  {card.label}
                </span>
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-3xl font-bold tracking-tight">
                  {card.value}
                </span>
                <span
                  className={cn(
                    "flex items-center text-xs font-medium",
                    card.trend === "up" ? "text-green-400" : "text-red-400"
                  )}
                >
                  {card.trend === "up" ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  {card.change}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">{card.hint}</p>
            </CardContent>
          </Card>
        </motion.div>
        );
      })}
    </div>
  );
}
