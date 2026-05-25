"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Brain,
  BarChart3,
  Bell,
  Layers,
  Zap,
  Lock,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Deep Analysis",
    description:
      "Scans every page, database, and note in your workspace to surface patterns you'd never spot manually.",
  },
  {
    icon: BarChart3,
    title: "Visual Dashboards",
    description:
      "Auto-generated charts and dashboards that update as your Notion workspace evolves.",
  },
  {
    icon: Bell,
    title: "Smart Alerts",
    description:
      "Get notified when key metrics shift, deadlines approach, or opportunities emerge from your data.",
  },
  {
    icon: Layers,
    title: "Multi-Workspace",
    description:
      "Connect multiple Notion workspaces and get a unified view across teams and projects.",
  },
  {
    icon: Zap,
    title: "Instant Sync",
    description:
      "Real-time sync with your Notion pages — every change is reflected in your insights within seconds.",
  },
  {
    icon: Lock,
    title: "Private & Secure",
    description:
      "Your data never leaves the pipeline. SOC 2 Type II compliant with end-to-end encryption.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-xs uppercase tracking-[0.2em] text-primary font-medium mb-4 block">
            Features
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
            Intelligence built for
            <br />
            <span className="text-[#71717a]">how you actually work</span>
          </h2>
          <p className="text-[#a1a1aa] max-w-lg mx-auto text-base">
            Six powerful capabilities that turn your Notion workspace into a
            competitive advantage.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
              className="group rounded-2xl border border-white/[0.05] bg-white/[0.02] p-6 hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300 cursor-default"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/15 to-accent/10 flex items-center justify-center mb-4 group-hover:from-primary/25 group-hover:to-accent/20 transition-all duration-300">
                <feature.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-[15px] mb-2 text-white">
                {feature.title}
              </h3>
              <p className="text-sm text-[#71717a] leading-relaxed group-hover:text-[#a1a1aa] transition-colors">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
