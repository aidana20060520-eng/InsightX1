"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  PolarAngleAxis,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Brain } from "lucide-react";

export interface FocusScoreData {
  score: number;
  breakdown: Array<{ label: string; value: number; color: string }>;
}

const defaultData: FocusScoreData = {
  score: 0,
  breakdown: [
    { label: "Deep work", value: 0, color: "#818cf8" },
    { label: "Consistency", value: 0, color: "#a78bfa" },
    { label: "Freshness", value: 0, color: "#c084fc" },
  ],
};

export function FocusScore({ data: input }: { data?: FocusScoreData }) {
  const { score, breakdown } = input ?? defaultData;
  const data = [{ name: "Focus", value: score, fill: "url(#focusGradient)" }];
  return (
    <Card className="h-full">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Focus Score</h3>
        </div>

        <div className="relative h-44">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              innerRadius="70%"
              outerRadius="100%"
              data={data}
              startAngle={90}
              endAngle={-270}
            >
              <defs>
                <linearGradient id="focusGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#c084fc" />
                </linearGradient>
              </defs>
              <PolarAngleAxis
                type="number"
                domain={[0, 100]}
                tick={false}
                axisLine={false}
              />
              <RadialBar background={{ fill: "var(--muted)" }} dataKey="value" cornerRadius={20} />
            </RadialBarChart>
          </ResponsiveContainer>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="absolute inset-0 flex flex-col items-center justify-center"
          >
            <span className="text-4xl font-bold tracking-tight">{score}</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
              out of 100
            </span>
          </motion.div>
        </div>

        <div className="space-y-3 mt-4 pt-4 border-t border-border">
          {breakdown.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.1, duration: 0.4 }}
              className="space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {item.label}
                </span>
                <span className="text-xs font-medium">{item.value}%</span>
              </div>
              <div className="h-1 rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.value}%` }}
                  transition={{ delay: 0.5 + i * 0.1, duration: 0.6, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ background: item.color }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
