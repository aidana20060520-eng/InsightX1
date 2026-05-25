"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useUser } from "@clerk/nextjs";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Heart,
  MessageCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeProvider } from "@/components/providers/theme-provider";

/**
 * Real onboarding for new users. There used to be a fake multi-step wizard
 * here asking about company size and "data sources" like Salesforce — none
 * of which actually existed. This is the real flow:
 *
 *   1. Greet the user (by name from Clerk)
 *   2. Explain what InsightX actually does (three honest bullets)
 *   3. Single primary CTA: connect Notion
 *
 * If the user already has Notion connected we just bounce them to the
 * dashboard — they don't need to see this again.
 */
export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [checking, setChecking] = useState(true);
  const [connecting, setConnecting] = useState(false);

  // If the user already has a Notion connection, skip onboarding entirely
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/notion/status", { cache: "no-store" });
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          if (data?.connected) {
            router.replace("/dashboard");
            return;
          }
        }
      } catch {
        /* network blip — show onboarding anyway */
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const firstName =
    user?.firstName ||
    (user?.fullName ? user.fullName.split(" ")[0] : null) ||
    user?.username ||
    null;

  const startConnect = () => {
    setConnecting(true);
    // Hand off to the OAuth route which redirects to Notion
    window.location.href = "/api/notion/authorize";
  };

  if (!isLoaded || checking) {
    return (
      <ThemeProvider>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background text-foreground overflow-x-hidden relative">
        {/* Ambient glow */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <motion.div
            animate={{
              x: ["-10%", "10%", "-10%"],
              y: ["-10%", "5%", "-10%"],
            }}
            transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/10 blur-3xl"
          />
          <motion.div
            animate={{
              x: ["10%", "-10%", "10%"],
              y: ["10%", "-5%", "10%"],
            }}
            transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-accent/10 blur-3xl"
          />
        </div>

        <div className="relative max-w-2xl mx-auto px-6 py-16 md:py-24">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 mb-12"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">InsightX</span>
          </motion.div>

          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-center mb-10"
          >
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              {firstName ? (
                <>
                  Welcome,{" "}
                  <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    {firstName}
                  </span>
                </>
              ) : (
                "Welcome to InsightX"
              )}
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
              One quick step before we start. Connect your Notion workspace so
              the AI has something to work with.
            </p>
          </motion.div>

          {/* What you'll get */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10"
          >
            <Highlight
              icon={MessageCircle}
              title="Chat with your workspace"
              body="Ask anything about your pages and projects."
            />
            <Highlight
              icon={Heart}
              title="Personalized insights"
              body="Patterns and recommendations tuned to how you work."
            />
            <Highlight
              icon={ShieldCheck}
              title="Read-only access"
              body="We can't modify anything in your Notion. Ever."
            />
          </motion.div>

          {/* Connect CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="rounded-2xl border border-primary/30 bg-gradient-to-b from-primary/[0.06] to-transparent p-6 md:p-8 text-center"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-white text-black flex items-center justify-center font-bold text-xl shadow-md">
                N
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
            </div>
            <h2 className="text-lg font-semibold mb-2">
              Connect Notion to begin
            </h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              You&apos;ll be sent to Notion to choose which pages and databases
              InsightX can read. The whole thing takes about 30 seconds.
            </p>
            <Button
              variant="gradient"
              size="lg"
              onClick={startConnect}
              disabled={connecting}
              className="gap-2 shadow-lg shadow-primary/20"
            >
              {connecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Opening Notion…
                </>
              ) : (
                <>
                  Connect Notion
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </motion.div>

          {/* Skip link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-center mt-8 space-y-2"
          >
            <Link
              href="/dashboard"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
            >
              Skip for now — explore the empty dashboard
              <ArrowRight className="w-3 h-3" />
            </Link>
            <p className="text-[11px] text-muted-foreground/70">
              You can always connect Notion later from{" "}
              <Link href="/settings" className="underline hover:text-foreground">
                Settings
              </Link>
              .
            </p>
          </motion.div>
        </div>
      </div>
    </ThemeProvider>
  );
}

interface HighlightProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}

function Highlight({ icon: Icon, title, body }: HighlightProps) {
  return (
    <div className="rounded-xl border border-border bg-card/40 backdrop-blur-sm p-4">
      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/15 to-accent/10 flex items-center justify-center mb-3">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <h3 className="text-sm font-semibold mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}
