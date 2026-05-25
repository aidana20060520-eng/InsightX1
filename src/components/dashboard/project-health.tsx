"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Folder } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface Project {
  name: string;
  health: number;
  status: "healthy" | "at-risk" | "critical";
  tasks: { done: number; total: number };
}

const statusConfig = {
  healthy: { label: "Healthy", color: "text-green-400", bg: "bg-green-400/10", bar: "bg-green-400" },
  "at-risk": { label: "At Risk", color: "text-amber-400", bg: "bg-amber-400/10", bar: "bg-amber-400" },
  critical: { label: "Critical", color: "text-red-400", bg: "bg-red-400/10", bar: "bg-red-400" },
};

export function ProjectHealth({ projects = [] }: { projects?: Project[] }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Folder className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">Project Health</h3>
          </div>
          <button className="text-[11px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            View all
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-3">
          {projects.length === 0 && (
            <div className="text-center py-8 text-xs text-muted-foreground">
              No top-level projects detected.
              <br />
              Add top-level pages or databases in Notion to track them here.
            </div>
          )}
          {projects.map((p, i) => {
            const c = statusConfig[p.status];
            return (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.3 }}
                whileHover={{ x: 2 }}
                className="group p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-medium truncate">
                    {p.name}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ml-2",
                      c.bg,
                      c.color
                    )}
                  >
                    {c.label}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${p.health}%` }}
                      transition={{ delay: 0.2 + i * 0.06, duration: 0.7, ease: "easeOut" }}
                      className={cn("h-full rounded-full", c.bar)}
                    />
                  </div>
                  <span className="text-[11px] text-muted-foreground tabular-nums w-20 text-right">
                    {p.tasks.done}/{p.tasks.total} tasks
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
