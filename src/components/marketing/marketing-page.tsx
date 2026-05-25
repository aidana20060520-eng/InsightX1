"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, ArrowLeft } from "lucide-react";
import { ThemeProvider } from "@/components/providers/theme-provider";

interface MarketingPageProps {
  children: React.ReactNode;
  title: string;
  /** Optional one-line subtitle under the heading */
  subtitle?: string;
  /** Last-updated label, e.g. "December 2024" */
  lastUpdated?: string;
}

/**
 * Shared layout for static / marketing-style pages (Privacy, Terms, Contact).
 * Matches the dark theme of the landing page and provides a consistent
 * header (logo + back-to-home) and footer.
 */
export function MarketingPage({
  children,
  title,
  subtitle,
  lastUpdated,
}: MarketingPageProps) {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-[#06060a] text-white">
        {/* Header */}
        <header className="sticky top-0 w-full z-50 bg-[#06060a]/80 backdrop-blur-xl border-b border-white/[0.04]">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#818cf8] to-[#c084fc] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight group-hover:text-[#a1a1aa] transition-colors">
                InsightX
              </span>
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-[#a1a1aa] hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to home
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-3xl mx-auto px-6 pt-20 pb-24">
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">
              {title}
            </h1>
            {subtitle && (
              <p className="text-[#a1a1aa] text-base leading-relaxed max-w-xl">
                {subtitle}
              </p>
            )}
            {lastUpdated && (
              <p className="text-xs text-[#52525b] mt-4 uppercase tracking-wider">
                Last updated · {lastUpdated}
              </p>
            )}
          </div>

          {/* Children render the actual page content. The marketing-prose
              class (defined in globals.css) gives sensible defaults for h2,
              h3, p, ul, a so each page doesn't need to style its own. */}
          <div className="marketing-prose">{children}</div>
        </main>

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
              <Link href="/privacy" className="hover:text-[#a1a1aa] transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-[#a1a1aa] transition-colors">
                Terms
              </Link>
              <Link href="/contact" className="hover:text-[#a1a1aa] transition-colors">
                Contact
              </Link>
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
