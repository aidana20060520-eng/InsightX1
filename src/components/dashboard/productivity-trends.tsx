"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const ranges = ["7D", "30D", "90D"] as const;
type Range = (typeof ranges)[number];

export type TrendsDataMap = Record<
  Range,
  Array<{ day: string; tasks: number; focus: number }>
>;

const emptyMap: TrendsDataMap = {
  "7D": Array.from({ length: 7 }, (_, i) => ({
    day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i],
    tasks: 0,
    focus: 0,
  })),
  "30D": Array.from({ length: 30 }, (_, i) => ({
    day: `${i + 1}`,
    tasks: 0,
    focus: 0,
  })),
  "90D": Array.from({ length: 12 }, (_, i) => ({
    day: `W${i + 1}`,
    tasks: 0,
    focus: 0,
  })),
};

interface TooltipPayload {
  active?: boolean;
  payload?: Array<{
    value: number;
    color: string;
    dataKey: string;
    payload: { day: string; tasks: number; focus: number };
  }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: TooltipPayload) => {
  if (!active || !payload?.length) return null;
  const tasks = payload.find((p) => p.dataKey === "tasks")?.value ?? 0;
  const focus = payload.find((p) => p.dataKey === "focus")?.value ?? 0;
  const ratio =
    tasks > 0 ? (focus / tasks).toFixed(1) : null; // hours of focus per task
  return (
    <div className="rounded-2xl border border-border bg-card/95 backdrop-blur-md p-3 shadow-xl min-w-[160px]">
      <p className="text-[11px] font-semibold text-foreground mb-2 uppercase tracking-wider">
        {label}
      </p>
      <div className="space-y-1.5">
        <Row dot="bg-primary" label="Tasks done" value={`${tasks}`} />
        <Row
          dot="bg-accent"
          label="Focus time"
          value={`${focus.toFixed(1)}h`}
        />
        {ratio && (
          <div className="pt-1.5 mt-1.5 border-t border-border">
            <Row
              muted
              label="Per task"
              value={`${ratio}h`}
            />
          </div>
        )}
      </div>
    </div>
  );
};

function Row({
  dot,
  label,
  value,
  muted,
}: {
  dot?: string;
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-[12px]">
      <div className="flex items-center gap-1.5">
        {dot && <span className={cn("w-2 h-2 rounded-full", dot)} />}
        <span className={muted ? "text-muted-foreground" : "text-foreground"}>
          {label}
        </span>
      </div>
      <span className={cn("font-semibold tabular-nums", muted && "text-muted-foreground")}>
        {value}
      </span>
    </div>
  );
}

export function ProductivityTrends({
  data: dataProp,
}: {
  data?: TrendsDataMap;
}) {
  const [range, setRange] = useState<Range>("7D");
  const dataMap = dataProp ?? emptyMap;
  const data = dataMap[range];

  // Aggregates surfaced in the header — gives the reader the takeaway
  // before they parse the chart shapes.
  const stats = useMemo(() => {
    const totalTasks = data.reduce((s, d) => s + d.tasks, 0);
    const totalFocus = data.reduce((s, d) => s + d.focus, 0);
    const avgTasks = data.length > 0 ? totalTasks / data.length : 0;
    const peakDay = data.reduce(
      (best, d) => (d.tasks > best.tasks ? d : best),
      data[0] ?? { day: "—", tasks: 0, focus: 0 }
    );
    return {
      totalTasks,
      totalFocus,
      avgTasks,
      peakDay,
    };
  }, [data]);

  const rangeLabel = useMemo(() => {
    if (range === "7D") return "the last 7 days";
    if (range === "30D") return "the last 30 days";
    return "the last 90 days";
  }, [range]);

  return (
    <Card className="rounded-2xl">
      <CardContent className="p-5 md:p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 flex-wrap mb-5">
          <div>
            <h3 className="text-sm font-semibold">How your week is flowing</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tasks completed and focus time across {rangeLabel}
            </p>
          </div>
          <div className="flex items-center gap-1 p-0.5 rounded-full bg-muted">
            {ranges.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={cn(
                  "px-3 py-1 text-[11px] font-medium rounded-full transition-all",
                  range === r
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Stat strip — the takeaway, before the visual */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          <Stat label="Tasks done" value={`${stats.totalTasks}`} />
          <Stat
            label="Focus hours"
            value={`${stats.totalFocus.toFixed(1)}h`}
          />
          <Stat
            label="Best day"
            value={stats.peakDay.tasks > 0 ? stats.peakDay.day : "—"}
            sub={stats.peakDay.tasks > 0 ? `${stats.peakDay.tasks} tasks` : undefined}
          />
        </div>

        {/* Chart */}
        <motion.div
          key={range}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="h-64"
        >
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="tasksFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="focusFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                stroke="var(--muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke="var(--muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ stroke: "var(--primary)", strokeOpacity: 0.25, strokeWidth: 1 }}
              />
              {/* Average baseline — gives the user a reference for what's
                  normal for them. Hidden when there's no data so we don't
                  draw a flat zero-line over an empty chart. */}
              {stats.avgTasks > 0 && (
                <ReferenceLine
                  y={stats.avgTasks}
                  stroke="var(--muted-foreground)"
                  strokeDasharray="4 4"
                  strokeOpacity={0.4}
                  label={{
                    value: `avg ${stats.avgTasks.toFixed(1)}`,
                    position: "right",
                    fill: "var(--muted-foreground)",
                    fontSize: 10,
                  }}
                />
              )}
              <Area
                type="monotone"
                dataKey="tasks"
                stroke="var(--primary)"
                strokeWidth={2}
                fill="url(#tasksFill)"
                activeDot={{ r: 4, fill: "var(--primary)", stroke: "var(--card)", strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="focus"
                stroke="var(--accent)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "var(--accent)", stroke: "var(--card)", strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Legend */}
        <div className="flex items-center justify-between gap-5 mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-5">
            <LegendDot color="var(--primary)" label="Tasks done" />
            <LegendDot color="var(--accent)" label="Focus hours" />
            <LegendDash label="Your average" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl bg-muted/40 px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
        {label}
      </p>
      <p className="text-base font-semibold mt-0.5 tabular-nums">{value}</p>
      {sub && (
        <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
      )}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="w-2.5 h-2.5 rounded-full"
        style={{ background: color }}
      />
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}

function LegendDash({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-4 h-[1.5px] rounded-full bg-muted-foreground/40 border-t border-dashed border-muted-foreground" />
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}
