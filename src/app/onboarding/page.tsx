"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Building2,
  Users,
  BarChart3,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

const steps = [
  { id: 1, title: "Welcome", subtitle: "Let's get you set up" },
  { id: 2, title: "Your Team", subtitle: "Tell us about your organization" },
  { id: 3, title: "Data Sources", subtitle: "Connect your first data source" },
  { id: 4, title: "Ready!", subtitle: "You're all set to go" },
];

const dataSources = [
  { id: "analytics", label: "Google Analytics", icon: BarChart3 },
  { id: "crm", label: "Salesforce CRM", icon: Users },
  { id: "database", label: "PostgreSQL", icon: Zap },
  { id: "api", label: "REST API", icon: Building2 },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const router = useRouter();

  const next = () => setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  const prev = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  const toggleSource = (id: string) => {
    setSelectedSources((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const slideVariants = {
    enter: { opacity: 0, x: 30 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 justify-center mb-10"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">InsightX</span>
          </motion.div>

          {/* Progress */}
          <div className="flex items-center gap-2 mb-8 justify-center">
            {steps.map((step, i) => (
              <React.Fragment key={step.id}>
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300",
                    i < currentStep
                      ? "bg-primary text-primary-foreground"
                      : i === currentStep
                      ? "bg-primary/20 text-primary border-2 border-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {i < currentStep ? <Check className="w-3.5 h-3.5" /> : step.id}
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={cn(
                      "h-0.5 w-12 rounded-full transition-colors duration-300",
                      i < currentStep ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Step content */}
          <div className="rounded-2xl border border-border bg-card p-8 min-h-[360px] flex flex-col">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className="flex-1"
              >
                {currentStep === 0 && (
                  <div className="text-center space-y-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto">
                      <Sparkles className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold mb-2">
                        Welcome to InsightX
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Let&apos;s set up your account in just a few steps.
                        It&apos;ll only take a minute.
                      </p>
                    </div>
                    <div className="space-y-3 text-left">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                          Your Name
                        </label>
                        <Input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Enter your name"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h2 className="text-xl font-bold mb-2">
                        Tell us about your team
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        This helps us customize your experience.
                      </p>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                          Company Name
                        </label>
                        <Input
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          placeholder="Enter company name"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                          Team Size
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {["1-10", "11-50", "51-200", "201-500", "500+"].map(
                            (size) => (
                              <button
                                key={size}
                                onClick={() => setTeamSize(size)}
                                className={cn(
                                  "rounded-lg border px-3 py-2 text-sm transition-all",
                                  teamSize === size
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border hover:border-primary/30 text-muted-foreground"
                                )}
                              >
                                {size}
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h2 className="text-xl font-bold mb-2">
                        Connect your data
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Select the sources you want to analyze.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {dataSources.map((source) => (
                        <motion.button
                          key={source.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => toggleSource(source.id)}
                          className={cn(
                            "flex flex-col items-center gap-2 rounded-xl border p-4 transition-all",
                            selectedSources.includes(source.id)
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/30"
                          )}
                        >
                          <div
                            className={cn(
                              "w-10 h-10 rounded-lg flex items-center justify-center",
                              selectedSources.includes(source.id)
                                ? "bg-primary/20"
                                : "bg-muted"
                            )}
                          >
                            <source.icon
                              className={cn(
                                "w-5 h-5",
                                selectedSources.includes(source.id)
                                  ? "text-primary"
                                  : "text-muted-foreground"
                              )}
                            />
                          </div>
                          <span className="text-xs font-medium">
                            {source.label}
                          </span>
                          {selectedSources.includes(source.id) && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                            >
                              <Check className="w-3 h-3 text-white" />
                            </motion.div>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="text-center space-y-6 flex flex-col items-center justify-center h-full">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 15,
                      }}
                      className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center"
                    >
                      <Check className="w-10 h-10 text-green-500" />
                    </motion.div>
                    <div>
                      <h2 className="text-xl font-bold mb-2">
                        You&apos;re all set!
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Your workspace is ready. Let&apos;s start exploring your
                        data and uncovering insights.
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={prev}
                disabled={currentStep === 0}
                className="gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </Button>
              {currentStep < steps.length - 1 ? (
                <Button size="sm" onClick={next} className="gap-1">
                  Continue
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              ) : (
                <Button
                  variant="gradient"
                  size="sm"
                  onClick={() => router.push("/dashboard")}
                  className="gap-1"
                >
                  Go to Dashboard
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}
