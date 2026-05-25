"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Check, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProfileForm {
  displayName: string;
  role: string;
  about: string;
  goals: string;
  preferredTone: "friendly" | "concise" | "professional";
}

const EMPTY_FORM: ProfileForm = {
  displayName: "",
  role: "",
  about: "",
  goals: "",
  preferredTone: "friendly",
};

const TONES: Array<{ value: ProfileForm["preferredTone"]; label: string }> = [
  { value: "friendly", label: "Friendly" },
  { value: "concise", label: "Concise" },
  { value: "professional", label: "Professional" },
];

export function AboutYouCard() {
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
  const [initial, setInitial] = useState<ProfileForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<
    { kind: "success" | "error"; text: string } | null
  >(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) throw new Error("Failed to load profile");
        const json = await res.json();
        const p = json.profile ?? {};
        const next: ProfileForm = {
          displayName: p.displayName ?? "",
          role: p.role ?? "",
          about: p.about ?? "",
          goals: p.goals ?? "",
          preferredTone: p.preferredTone ?? "friendly",
        };
        if (mounted) {
          setForm(next);
          setInitial(next);
        }
      } catch {
        // Quiet failure — show empty form, don't block settings page
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const dirty = JSON.stringify(form) !== JSON.stringify(initial);

  const handleSave = async () => {
    if (!dirty || saving) return;
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save");
      }
      setInitial(form);
      setFeedback({ kind: "success", text: "Saved. The AI will use this." });
    } catch (e) {
      setFeedback({
        kind: "error",
        text: (e as Error).message || "Couldn't save. Try again.",
      });
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05, duration: 0.4 }}
    >
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-primary" />
                <h2 className="text-base font-semibold">About you</h2>
              </div>
              <p className="text-xs text-muted-foreground">
                The AI uses this to personalize answers. All fields are
                optional.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              <div className="h-9 rounded-md bg-muted animate-pulse" />
              <div className="h-9 rounded-md bg-muted animate-pulse" />
              <div className="h-20 rounded-md bg-muted animate-pulse" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Display name
                  </label>
                  <Input
                    placeholder="What should the AI call you?"
                    value={form.displayName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, displayName: e.target.value }))
                    }
                    maxLength={80}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Role / what you do
                  </label>
                  <Input
                    placeholder="e.g. Designer, Founder, Student"
                    value={form.role}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, role: e.target.value }))
                    }
                    maxLength={80}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  About you
                </label>
                <textarea
                  rows={3}
                  placeholder="Anything you want the AI to remember about you. e.g. 'I'm building a SaaS product solo, focused on B2B tools.'"
                  value={form.about}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, about: e.target.value }))
                  }
                  maxLength={1000}
                  className="w-full rounded-xl border border-border bg-muted/50 px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Current goals
                </label>
                <textarea
                  rows={3}
                  placeholder="What are you trying to accomplish right now? e.g. 'Ship MVP this month, get 10 paying users.'"
                  value={form.goals}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, goals: e.target.value }))
                  }
                  maxLength={1000}
                  className="w-full rounded-xl border border-border bg-muted/50 px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">
                  AI tone
                </label>
                <div className="flex gap-2">
                  {TONES.map((tone) => (
                    <button
                      key={tone.value}
                      type="button"
                      onClick={() =>
                        setForm((f) => ({ ...f, preferredTone: tone.value }))
                      }
                      className={cn(
                        "px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors",
                        form.preferredTone === tone.value
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card border-border text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {tone.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-xs">
                  {feedback?.kind === "success" && (
                    <span className="flex items-center gap-1.5 text-emerald-500">
                      <Check className="w-3.5 h-3.5" />
                      {feedback.text}
                    </span>
                  )}
                  {feedback?.kind === "error" && (
                    <span className="flex items-center gap-1.5 text-rose-500">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {feedback.text}
                    </span>
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={!dirty || saving}
                >
                  {saving ? "Saving…" : "Save"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
