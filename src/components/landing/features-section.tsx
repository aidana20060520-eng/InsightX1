"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Brain,
  BarChart3,
  MessageCircle,
  Heart,
  RefreshCw,
  Lock,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Workspace analysis",
    description:
      "Scans every page and database to surface patterns — what you've neglected, where you're moving fast, what's quietly aging out.",
  },
  {
    icon: BarChart3,
    title: "Visual dashboard",
    description:
      "Productivity trends, focus score, project health, and weekly summaries — all auto-generated from your real workspace activity.",
  },
  {
    icon: MessageCircle,
    title: "AI chat with memory",
    description:
      "Ask anything about your workspace. Conversations save automatically and stay across devices, so you can pick up where you left off.",
  },
  {
    icon: Heart,
    title: "Emotionally aware",
    description:
      "The AI reads how you're feeling. Stressed? It listens before suggesting. Excited? It celebrates with you. Not just a productivity bot.",
  },
  {
    icon: RefreshCw,
    title: "One-click sync",
    description:
      "Connect Notion via official OAuth, hit sync, done. Your insights refresh on demand without leaving the app.",
  },
  {
    icon: Lock,
    title: "Private & secure",
    description:
      "HTTPS everywhere. Your Notion access tokens are AES-256 encrypted at rest. Each user's data is fully isolated.",
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
            Real features, shipping today. No fake promises, no roadmap fluff.
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
