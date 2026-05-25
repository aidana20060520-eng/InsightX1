"use client";

import React from "react";
import { motion } from "framer-motion";
import { Check, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const includedNow = [
  "All current features",
  "Notion workspace connection",
  "Visual dashboard & insights",
  "AI chat with memory",
  "Emotionally aware assistant",
  "Personalized profile",
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-28 px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <span className="text-xs uppercase tracking-[0.2em] text-primary font-medium mb-4 block">
            Pricing
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
            Free while we&apos;re
            <br />
            <span className="text-[#71717a]">in beta</span>
          </h2>
          <p className="text-[#a1a1aa] max-w-md mx-auto">
            Every feature, every user — no charge, no card. Paid plans arrive
            after launch, and beta users get early-bird pricing.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl border border-primary/30 bg-gradient-to-b from-primary/[0.06] to-transparent shadow-lg shadow-primary/5 p-8 md:p-10 relative"
        >
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Beta access
          </div>

          <div className="text-center mb-8">
            <h3 className="text-xl font-semibold text-white mb-2">
              Everything, free
            </h3>
            <div className="flex items-baseline justify-center gap-1 mt-4">
              <span className="text-5xl md:text-6xl font-bold text-white">
                $0
              </span>
              <span className="text-base text-[#52525b] ml-1">/ during beta</span>
            </div>
            <p className="text-[12px] text-[#71717a] mt-3">
              No credit card. No expiration. Cancel anytime is irrelevant —
              there&apos;s nothing to cancel.
            </p>
          </div>

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 max-w-md mx-auto">
            {includedNow.map((f) => (
              <li
                key={f}
                className="flex items-start gap-2 text-[13px] text-[#a1a1aa]"
              >
                <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>

          <div className="flex justify-center">
            <Link href="/onboarding">
              <Button variant="gradient" size="lg" className="group">
                Get started free
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-center text-[12px] text-[#52525b] mt-8 max-w-md mx-auto"
        >
          When paid plans launch, beta users will be notified and offered
          discounted pricing as a thank-you.
        </motion.p>
      </div>
    </section>
  );
}
