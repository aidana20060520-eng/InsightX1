"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlowOrb } from "./glow-orb";

export function HeroSection() {
  return (
    <section className="relative pt-36 pb-24 px-6 overflow-hidden">
      {/* Background orbs */}
      <GlowOrb className="-top-20 -left-24" size="lg" color="primary" />
      <GlowOrb className="top-40 -right-20" size="md" color="accent" />
      <GlowOrb className="bottom-0 left-1/3" size="sm" color="mixed" />

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-primary text-sm font-medium mb-8 backdrop-blur-sm"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Powered by GPT-4o
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.05] mb-6"
        >
          AI insights from
          <br />
          <span className="bg-gradient-to-r from-[#818cf8] via-[#c084fc] to-[#818cf8] bg-clip-text text-transparent bg-[length:200%_auto] animate-[gradient_6s_linear_infinite]">
            your Notion
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-lg md:text-xl text-[#a1a1aa] max-w-xl mx-auto mb-10 leading-relaxed"
        >
          Turn your workspace into a source of clarity, decisions, and growth.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href="/onboarding">
            <Button variant="gradient" size="xl" className="group shadow-lg shadow-primary/20">
              Start Free Trial
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" size="xl" className="border-white/10 hover:bg-white/[0.04]">
              View Demo
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
