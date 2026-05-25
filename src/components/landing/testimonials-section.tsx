"use client";

import React from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    quote:
      "InsightX replaced three tools for us. We finally see our Notion data as a strategic asset, not just a knowledge base.",
    name: "Sarah Chen",
    role: "VP of Product, Lumen",
    initials: "SC",
  },
  {
    quote:
      "The weekly reports alone saved our leadership team 4 hours per week. The AI assistant is genuinely magical.",
    name: "Marcus Rivera",
    role: "CTO, Tidepool",
    initials: "MR",
  },
  {
    quote:
      "We connected 6 workspaces and had actionable insights within 30 minutes. Nothing else comes close.",
    name: "Aisha Patel",
    role: "Head of Ops, Grandline",
    initials: "AP",
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
            Testimonials
          </span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Loved by teams who
            <br />
            <span className="text-[#71717a]">live in Notion</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-6 hover:border-white/[0.1] transition-all duration-300"
            >
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: 5 }).map((_, si) => (
                  <Star
                    key={si}
                    className="w-3.5 h-3.5 text-amber-400 fill-amber-400"
                  />
                ))}
              </div>
              <p className="text-[13px] text-[#d4d4d8] leading-relaxed mb-6">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-white/[0.05]">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-[11px] font-bold text-primary">
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{t.name}</p>
                  <p className="text-[11px] text-[#52525b]">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
