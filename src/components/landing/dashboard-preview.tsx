"use client";

import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, ArrowUpRight } from "lucide-react";
import { GlowOrb } from "./glow-orb";

const stats = [
  { label: "Total Insights", value: "1,284", change: "+24%", color: "#818cf8" },
  { label: "Pages Analyzed", value: "3,847", change: "+12%", color: "#a78bfa" },
  { label: "Actions Taken", value: "642", change: "+31%", color: "#c084fc" },
  { label: "Time Saved", value: "86h", change: "+18%", color: "#818cf8" },
];

const chartBars = [38, 52, 44, 68, 55, 78, 62, 85, 70, 92, 80, 96];

export function DashboardPreview() {
  return (
    <section className="relative py-20 px-6">
      <GlowOrb className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" size="lg" color="mixed" />

      <div className="relative z-10 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="relative"
        >
          {/* Window chrome */}
          <div className="rounded-2xl border border-white/[0.06] bg-[#0c0c12]/80 backdrop-blur-xl p-1.5 shadow-2xl shadow-black/40">
            <div className="rounded-xl bg-[#0f0f16] overflow-hidden">
              {/* Title bar */}
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/[0.04]">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 rounded-md bg-white/[0.04] text-[11px] text-[#71717a]">
                    app.insightx.ai/dashboard
                  </div>
                </div>
                <div className="w-14" />
              </div>

              {/* Dashboard content */}
              <div className="p-6 space-y-5">
                {/* Stats row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {stats.map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 + i * 0.08, duration: 0.5 }}
                      className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-4 group hover:border-white/[0.1] transition-colors"
                    >
                      <p className="text-[11px] text-[#71717a] mb-1 uppercase tracking-wider">
                        {stat.label}
                      </p>
                      <div className="flex items-end justify-between">
                        <span className="text-xl font-bold text-white">{stat.value}</span>
                        <span className="text-[11px] font-medium text-green-400 flex items-center">
                          <ArrowUpRight className="w-3 h-3" />
                          {stat.change}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Chart area */}
                <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-5">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#818cf8]" />
                      <span className="text-sm font-medium text-white">Weekly Insights</span>
                    </div>
                    <div className="flex gap-3">
                      {[
                        { label: "Insights", color: "#818cf8" },
                        { label: "Actions", color: "#a78bfa" },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                          <span className="text-[11px] text-[#71717a]">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="h-44 flex items-end gap-1.5 px-1">
                    {chartBars.map((h, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        whileInView={{ height: `${h}%` }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 + i * 0.04, duration: 0.6, ease: "easeOut" }}
                        className="flex-1 rounded-t-[3px]"
                        style={{
                          background: `linear-gradient(to top, #818cf8, ${i % 2 === 0 ? "#a78bfa" : "#c084fc"})`,
                          opacity: 0.8,
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-2 px-1">
                    {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m) => (
                      <span key={m} className="text-[9px] text-[#52525b] flex-1 text-center">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Outer glow */}
          <div className="absolute -inset-6 bg-gradient-to-r from-primary/15 via-accent/8 to-primary/15 rounded-3xl blur-3xl -z-10" />
        </motion.div>
      </div>
    </section>
  );
}
