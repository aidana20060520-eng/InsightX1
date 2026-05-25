"use client";

import React from "react";
import { motion } from "framer-motion";
import { HeartPulse, Compass, Wrench } from "lucide-react";

/**
 * Not real testimonials — InsightX is in beta. This section explains the
 * design philosophy instead. We'll add real quotes once we have real users.
 */
const principles = [
  {
    icon: HeartPulse,
    title: "Built for humans, not metrics",
    body:
      "Most productivity tools treat you like a machine. InsightX listens for how you actually feel — stressed, scattered, proud — and responds like a person would, not a dashboard.",
  },
  {
    icon: Compass,
    title: "Honest over impressive",
    body:
      "No fake stats, no invented confidence scores. If we don't have data to answer something, the AI says so. Trust comes from showing your work, not hiding it.",
  },
  {
    icon: Wrench,
    title: "Useful from day one",
    body:
      "Connect Notion, see real signals about your workspace within minutes. No setup wizards, no configuration files, no 14-day onboarding. It just works.",
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-xs uppercase tracking-[0.2em] text-primary font-medium mb-4 block">
            Built for users like you
          </span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            How we think
            <br />
            <span className="text-[#71717a]">about this product</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {principles.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-6 hover:border-white/[0.1] transition-all duration-300"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/15 to-accent/10 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-[15px] font-semibold text-white mb-2">
                  {p.title}
                </h3>
                <p className="text-[13px] text-[#a1a1aa] leading-relaxed">
                  {p.body}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
