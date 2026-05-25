"use client";

import React from "react";
import { motion } from "framer-motion";
import { Calendar, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export interface WeeklySummaryData {
  range: string;
  highlights: Array<{ label: string; value: string; change: string }>;
  wins: string[];
  opportunities: string[];
}

const defaultData: WeeklySummaryData = {
  range: "—",
  highlights: [
    { label: "Pages edited", value: "0", change: "0" },
    { label: "Pages created", value: "0", change: "0" },
    { label: "Databases", value: "0", change: "—" },
    { label: "Stale pages", value: "0", change: "—" },
  ],
  wins: ["Connect Notion to see real wins"],
  opportunities: ["Connect Notion to see opportunities"],
};

export function WeeklySummary({ data }: { data?: WeeklySummaryData }) {
  const { range, highlights, wins, opportunities } = data ?? defaultData;
  return (
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-card via-card to-primary/5">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Weekly Summary</h3>
              <p className="text-[11px] text-muted-foreground">{range}</p>
            </div>
          </div>
          <button className="text-[11px] text-primary hover:underline flex items-center gap-1">
            Full report
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Highlight stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {highlights.map((h, i) => (
            <motion.div
              key={h.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="rounded-lg bg-muted/40 border border-border p-3"
            >
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                {h.label}
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold tabular-nums">
                  {h.value}
                </span>
                <span
                  className={`text-[10px] font-medium ${
                    h.change.startsWith("-")
                      ? "text-red-400"
                      : "text-green-400"
                  }`}
                >
                  {h.change}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Wins + Opportunities */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            <h4 className="text-[11px] font-semibold text-green-400 uppercase tracking-wider mb-2">
              Wins
            </h4>
            <ul className="space-y-1.5">
              {wins.map((w, i) => (
                <li
                  key={i}
                  className="text-[12px] text-muted-foreground flex items-start gap-2"
                >
                  <span className="text-green-400 mt-0.5">•</span>
                  {w}
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            <h4 className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider mb-2">
              Opportunities
            </h4>
            <ul className="space-y-1.5">
              {opportunities.map((o, i) => (
                <li
                  key={i}
                  className="text-[12px] text-muted-foreground flex items-start gap-2"
                >
                  <span className="text-amber-400 mt-0.5">•</span>
                  {o}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
}
