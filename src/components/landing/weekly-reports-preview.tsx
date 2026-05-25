"use client";

import React from "react";
import { motion } from "framer-motion";
import { LayoutDashboard, RefreshCw, TrendingUp, CheckCircle2, AlertTriangle } from "lucide-react";
import { GlowOrb } from "./glow-orb";

const reportItems = [
  {
    icon: TrendingUp,
    color: "text-green-400",
    bg: "bg-green-400/10",
    title: "Revenue up 18% week-over-week",
    sub: "Enterprise segment driving growth",
  },
  {
    icon: CheckCircle2,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    title: "14 tasks completed ahead of schedule",
    sub: "Engineering velocity improving",
  },
  {
    icon: AlertTriangle,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    title: "3 projects at risk of deadline slip",
    sub: "Design review is the bottleneck",
  },
];

export function WeeklyReportsPreview() {
  return (
    <section className="relative py-28 px-6 overflow-hidden">
      <GlowOrb className="-left-32 top-1/3" size="md" color="primary" />

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Report mockup */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative order-2 lg:order-1"
          >
            <div className="rounded-2xl border border-white/[0.06] bg-[#0c0c12]/80 backdrop-blur-xl p-6">
              {/* Report header */}
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/[0.05]">
                <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
                  <LayoutDashboard className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    This week&apos;s summary
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <RefreshCw className="w-3 h-3 text-[#52525b]" />
                    <span className="text-[11px] text-[#52525b]">
                      Refreshes on your dashboard whenever you visit
                    </span>
                  </div>
                </div>
              </div>

              {/* Report items */}
              <div className="space-y-4">
                {reportItems.map((item, i) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.12, duration: 0.5 }}
                    className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-colors"
                  >
                    <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center shrink-0`}>
                      <item.icon className={`w-4 h-4 ${item.color}`} />
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-white">{item.title}</p>
                      <p className="text-[11px] text-[#71717a] mt-0.5">{item.sub}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Summary bar */}
              <div className="mt-5 pt-4 border-t border-white/[0.05] flex items-center justify-between">
                <span className="text-[11px] text-[#52525b]">
                  Analyzed 847 pages &middot; 12 databases
                </span>
                <span className="text-[11px] text-primary font-medium cursor-pointer hover:underline">
                  View full report →
                </span>
              </div>
            </div>

            <div className="absolute -inset-4 bg-gradient-to-br from-primary/10 to-accent/8 rounded-3xl blur-3xl -z-10" />
          </motion.div>

          {/* Copy */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="order-1 lg:order-2"
          >
            <span className="text-xs uppercase tracking-[0.2em] text-primary font-medium mb-4 block">
              Weekly Summary
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-5 tracking-tight leading-tight">
              The week, in
              <br />
              <span className="text-[#71717a]">one glance</span>
            </h2>
            <p className="text-[#a1a1aa] text-base leading-relaxed max-w-md mb-8">
              Your dashboard auto-generates a weekly summary from your Notion
              activity — wins, risks, what got neglected. No setup. Refresh
              with one click.
            </p>
            <div className="flex flex-wrap gap-2">
              {["Auto-generated", "Wins & risks", "On your dashboard"].map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs text-[#a1a1aa]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
