"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, CheckCircle2, Loader2 } from "lucide-react";
import { MarketingPage } from "@/components/marketing/marketing-page";
import { cn } from "@/lib/utils";

type Status = "idle" | "submitting" | "success" | "error";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  // Honeypot — hidden field; bots tend to fill it, humans never see it.
  const [website, setWebsite] = useState("");

  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string>("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "submitting") return;

    setStatus("submitting");
    setError("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message, website }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStatus("error");
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setStatus("success");
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't reach the server. Please try again."
      );
    }
  };

  return (
    <MarketingPage
      title="Contact us"
      subtitle="Questions, feedback, bugs, partnership ideas — we read every message and reply within a few days."
    >
      <AnimatePresence mode="wait">
        {status === "success" ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border border-green-400/20 bg-green-400/[0.03] p-8 text-center"
          >
            <div className="w-12 h-12 rounded-full bg-green-400/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Message sent
            </h3>
            <p className="text-sm text-[#a1a1aa] max-w-sm mx-auto leading-relaxed">
              Thanks for reaching out. We&apos;ll get back to you at the email
              you provided within a few days. If it&apos;s urgent, please
              mention that in the subject.
            </p>
            <button
              onClick={() => setStatus("idle")}
              className="mt-6 text-xs text-primary hover:underline"
            >
              Send another message
            </button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            onSubmit={submit}
            className="space-y-5"
          >
            {/* Honeypot — visually hidden, must stay empty */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                left: "-10000px",
                width: 1,
                height: 1,
                overflow: "hidden",
              }}
            >
              <label>
                Website
                <input
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="Name"
                value={name}
                onChange={setName}
                placeholder="Your name"
                required
                maxLength={100}
              />
              <Field
                label="Email"
                value={email}
                onChange={setEmail}
                placeholder="you@example.com"
                type="email"
                required
                maxLength={200}
              />
            </div>

            <Field
              label="Subject (optional)"
              value={subject}
              onChange={setSubject}
              placeholder="What's this about?"
              maxLength={200}
            />

            <div>
              <label className="block text-[12px] font-medium text-[#a1a1aa] mb-2">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us what's on your mind…"
                required
                rows={6}
                maxLength={5000}
                className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-white placeholder:text-[#52525b] focus:outline-none focus:border-primary/40 focus:bg-white/[0.04] transition-all resize-none"
              />
              <p className="text-[11px] text-[#52525b] mt-1.5 text-right">
                {message.length} / 5000
              </p>
            </div>

            {error && (
              <div className="rounded-lg border border-red-400/20 bg-red-400/[0.03] px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between gap-4 pt-2">
              <p className="text-[12px] text-[#52525b]">
                We typically reply within 2-3 business days.
              </p>
              <button
                type="submit"
                disabled={status === "submitting"}
                className={cn(
                  "inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all",
                  "bg-gradient-to-br from-[#818cf8] to-[#a78bfa] text-white shadow-lg shadow-primary/20",
                  "hover:shadow-xl hover:shadow-primary/30",
                  "disabled:opacity-60 disabled:cursor-not-allowed"
                )}
              >
                {status === "submitting" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    Send message
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </MarketingPage>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  maxLength?: number;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
  maxLength,
}: FieldProps) {
  return (
    <div>
      <label className="block text-[12px] font-medium text-[#a1a1aa] mb-2">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        maxLength={maxLength}
        className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-white placeholder:text-[#52525b] focus:outline-none focus:border-primary/40 focus:bg-white/[0.04] transition-all"
      />
    </div>
  );
}
