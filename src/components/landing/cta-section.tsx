"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlowOrb } from "./glow-orb";

export function CtaSection() {
  return (
    <section className="relative py-28 px-6 overflow-hidden">
      <GlowOrb className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" size="lg" color="mixed" />

      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="rounded-3xl border border-white/[0.06] bg-[#0c0c12]/60 backdrop-blur-xl p-12 md:p-16 relative overflow-hidden"
        >
          {/* Animated border glow */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/[0.08] via-transparent to-accent/[0.08]" />

          <div className="relative z-10">
            <motion.div
              animate={{ rotate: [0, 8, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-6"
            >
              <Sparkles className="w-6 h-6 text-primary" />
            </motion.div>

            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
              See your Notion
              <br />
              in a new light
            </h2>
            <p className="text-[#a1a1aa] max-w-md mx-auto mb-8 text-base leading-relaxed">
              Connect in under a minute, sync once, and start asking questions.
              Free during the beta.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/onboarding">
                <Button variant="gradient" size="xl" className="group shadow-lg shadow-primary/20">
                  Get started free
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" size="lg" className="border-white/10 hover:bg-white/[0.04]">
                  See features
                </Button>
              </Link>
            </div>
            <p className="text-[11px] text-[#52525b] mt-5">
              No credit card &middot; No trial timer &middot; Sign in with Google
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
