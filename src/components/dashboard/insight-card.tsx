"use client";

import React from "react";
import { motion } from "framer-motion";
import { AlertCircle, TrendingUp, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Insight {
  id: number;
  title: string;
  description: string;
  category: string;
  priority: "high" | "medium" | "low";
  timestamp: string;
}

const priorityConfig = {
  high: {
    icon: AlertCircle,
    color: "text-red-400",
    bg: "bg-red-400/10",
    border: "border-red-400/20",
  },
  medium: {
    icon: TrendingUp,
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
    border: "border-yellow-400/20",
  },
  low: {
    icon: Info,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    border: "border-blue-400/20",
  },
};

export function InsightCard({ insight }: { insight: Insight }) {
  const config = priorityConfig[insight.priority];
  const Icon = config.icon;

  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
      <Card className={cn("hover:border-primary/20 transition-all cursor-pointer")}>
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                config.bg
              )}
            >
              <Icon className={cn("w-4 h-4", config.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={cn(
                    "text-[10px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wide",
                    config.bg,
                    config.color
                  )}
                >
                  {insight.category}
                </span>
                <span className="text-xs text-muted-foreground">
                  {insight.timestamp}
                </span>
              </div>
              <h3 className="text-sm font-semibold mb-1">{insight.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                {insight.description}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
