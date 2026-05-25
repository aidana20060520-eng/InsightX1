"use client";

import React from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { HeroSection } from "@/components/landing/hero-section";
import { DashboardPreview } from "@/components/landing/dashboard-preview";
import { FeaturesSection } from "@/components/landing/features-section";
import { AiAssistantPreview } from "@/components/landing/ai-assistant-preview";
import { WeeklyReportsPreview } from "@/components/landing/weekly-reports-preview";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { FaqSection } from "@/components/landing/faq-section";
import { CtaSection } from "@/components/landing/cta-section";

export default function LandingPage() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-[#06060a] text-white overflow-x-hidden">
        {/* Header */}
        <header className="fixed top-0 w-full z-50 bg-[#06060a]/80 backdrop-blur-xl border-b border-white/[0.04]">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#818cf8] to-[#c084fc] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight">InsightX</span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              {[
                { label: "Features", href: "#features" },
                { label: "Pricing", href: "#pricing" },
                { label: "FAQ", href: "#faq" },
              ].map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm text-[#71717a] hover:text-white transition-colors duration-200"
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="flex items-center gap-3">
              <Show when="signed-out">
                <SignInButton mode="modal">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[#a1a1aa] hover:text-white"
                  >
                    Sign in
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button variant="gradient" size="sm">
                    Get Started
                  </Button>
                </SignUpButton>
              </Show>
              <Show when="signed-in">
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="text-[#a1a1aa] hover:text-white">
                    Dashboard
                  </Button>
                </Link>
                <UserButton />
              </Show>
            </div>
          </div>
        </header>

        <HeroSection />
        <DashboardPreview />
        <FeaturesSection />
        <AiAssistantPreview />
        <WeeklyReportsPreview />
        <TestimonialsSection />
        <PricingSection />
        <FaqSection />
        <CtaSection />

        {/* Footer */}
        <footer className="border-t border-white/[0.04] py-12 px-6">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#818cf8] to-[#c084fc] flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
              <span className="font-semibold text-sm">InsightX</span>
            </div>
            <div className="flex items-center gap-6 text-[12px] text-[#52525b]">
              <a href="#" className="hover:text-[#a1a1aa] transition-colors">Privacy</a>
              <a href="#" className="hover:text-[#a1a1aa] transition-colors">Terms</a>
              <a href="#" className="hover:text-[#a1a1aa] transition-colors">Contact</a>
            </div>
            <p className="text-[12px] text-[#3f3f46]">
              &copy; {new Date().getFullYear()} InsightX. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </ThemeProvider>
  );
}
