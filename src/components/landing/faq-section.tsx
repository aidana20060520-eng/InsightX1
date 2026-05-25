"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    q: "How does InsightX connect to my Notion workspace?",
    a: "You authorize InsightX via Notion's official OAuth integration. We get read-only access to your workspace pages and databases — nothing is modified. The connection takes about 30 seconds.",
  },
  {
    q: "Is my data safe?",
    a: "Absolutely. We're SOC 2 Type II compliant with end-to-end encryption. Your data is processed in isolated pipelines and never shared. You can revoke access at any time from your Notion settings.",
  },
  {
    q: "How accurate are the AI insights?",
    a: "Our models run a confidence check on every insight (visible in the dashboard). On average, insights carry a 92% confidence score. You can always drill into the source data behind any recommendation.",
  },
  {
    q: "Can I connect multiple Notion workspaces?",
    a: "Yes — Pro and Enterprise plans support unlimited workspaces. InsightX creates a unified view across all of them, so you can see cross-workspace patterns and metrics in one place.",
  },
  {
    q: "Do I need to structure my Notion pages in a specific way?",
    a: "No. InsightX works with any Notion setup — pages, databases, wikis, docs, you name it. Our AI adapts to your workspace structure, not the other way around.",
  },
  {
    q: "What happens after the free trial?",
    a: "After 14 days, you can continue on our free Starter plan (limited features) or upgrade to Pro. No credit card is required to start, and you'll never be charged without explicit consent.",
  },
];

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="py-28 px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-xs uppercase tracking-[0.2em] text-primary font-medium mb-4 block">
            FAQ
          </span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Frequently asked
            <br />
            <span className="text-[#71717a]">questions</span>
          </h2>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = open === i;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
                className={cn(
                  "rounded-xl border transition-all duration-300",
                  isOpen
                    ? "border-white/[0.1] bg-white/[0.03]"
                    : "border-white/[0.05] bg-white/[0.01] hover:border-white/[0.08]"
                )}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="text-[14px] font-medium text-white pr-4">
                    {faq.q}
                  </span>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <ChevronDown className="w-4 h-4 text-[#52525b] shrink-0" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 text-[13px] text-[#a1a1aa] leading-relaxed">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
