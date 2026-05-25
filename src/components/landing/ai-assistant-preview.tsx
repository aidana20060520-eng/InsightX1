"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, User } from "lucide-react";
import { GlowOrb } from "./glow-orb";

const messages = [
  {
    role: "user" as const,
    content: "What were the main blockers for Q4 product launches?",
  },
  {
    role: "assistant" as const,
    content:
      "Based on your Notion workspace, I found 3 key blockers:\n\n1. **Design review bottleneck** — 14 tasks waited 5+ days for approval\n2. **API dependency** — Payment integration was blocked by the vendor for 2 weeks\n3. **QA capacity** — Only 2 testers for 23 release items\n\nWant me to generate a risk mitigation plan for Q1?",
  },
  {
    role: "user" as const,
    content: "Yes, and flag any similar patterns forming now.",
  },
];

export function AiAssistantPreview() {
  return (
    <section className="relative py-28 px-6 overflow-hidden">
      <GlowOrb className="-right-32 top-20" size="lg" color="accent" />

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Copy */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-xs uppercase tracking-[0.2em] text-primary font-medium mb-4 block">
              AI Assistant
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-5 tracking-tight leading-tight">
              Ask anything about
              <br />
              <span className="text-[#71717a]">your workspace</span>
            </h2>
            <p className="text-[#a1a1aa] text-base leading-relaxed max-w-md mb-8">
              A conversational AI that understands every page, database, and
              comment in your Notion. Ask questions in plain English and get
              structured, actionable answers.
            </p>
            <div className="flex flex-wrap gap-2">
              {["Natural language", "Context-aware", "Action suggestions"].map(
                (tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs text-[#a1a1aa]"
                  >
                    {tag}
                  </span>
                )
              )}
            </div>
          </motion.div>

          {/* Chat mockup */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative"
          >
            <div className="rounded-2xl border border-white/[0.06] bg-[#0c0c12]/80 backdrop-blur-xl p-5 space-y-4">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.15, duration: 0.5 }}
                  className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-1 ${
                      msg.role === "assistant"
                        ? "bg-gradient-to-br from-primary/25 to-accent/20"
                        : "bg-white/[0.06]"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                    ) : (
                      <User className="w-3.5 h-3.5 text-[#71717a]" />
                    )}
                  </div>
                  <div
                    className={`rounded-xl px-4 py-3 text-[13px] leading-relaxed max-w-[85%] ${
                      msg.role === "assistant"
                        ? "bg-white/[0.03] border border-white/[0.05] text-[#d4d4d8]"
                        : "bg-primary/15 text-white border border-primary/20"
                    }`}
                  >
                    <span className="whitespace-pre-wrap">{msg.content}</span>
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.9 }}
                className="flex gap-3"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/25 to-accent/20 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="rounded-xl px-4 py-3 bg-white/[0.03] border border-white/[0.05]">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((d) => (
                      <motion.div
                        key={d}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: d * 0.2 }}
                        className="w-1.5 h-1.5 rounded-full bg-primary"
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="absolute -inset-4 bg-gradient-to-br from-accent/10 to-primary/10 rounded-3xl blur-3xl -z-10" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
