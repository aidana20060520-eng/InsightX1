"use client";

import React from "react";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

const plans = [
  {
    name: "Starter",
    price: "$0",
    period: "forever",
    description: "For individuals exploring Notion insights",
    features: [
      "1 Notion workspace",
      "100 pages analyzed",
      "Weekly digest (email)",
      "5 AI questions/month",
      "Community support",
    ],
    cta: "Get Started Free",
    popular: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    description: "For teams who want full intelligence",
    features: [
      "Unlimited workspaces",
      "Unlimited pages",
      "Daily + weekly digests",
      "Unlimited AI assistant",
      "Custom dashboards",
      "Slack integration",
      "Priority support",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For organizations with advanced needs",
    features: [
      "Everything in Pro",
      "SSO & SAML",
      "Audit logs",
      "Dedicated CSM",
      "Custom integrations",
      "SLA guarantee",
      "On-prem option",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-28 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-xs uppercase tracking-[0.2em] text-primary font-medium mb-4 block">
            Pricing
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
            Simple, transparent
            <br />
            <span className="text-[#71717a]">pricing</span>
          </h2>
          <p className="text-[#a1a1aa] max-w-md mx-auto">
            Start free. Upgrade when your team needs more power.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
              className={cn(
                "rounded-2xl border p-6 flex flex-col transition-all duration-300 relative",
                plan.popular
                  ? "border-primary/40 bg-gradient-to-b from-primary/[0.06] to-transparent shadow-lg shadow-primary/5"
                  : "border-white/[0.05] bg-white/[0.02] hover:border-white/[0.1]"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Most Popular
                </div>
              )}

              <div className="mb-5">
                <h3 className="text-lg font-semibold text-white mb-1">
                  {plan.name}
                </h3>
                <p className="text-[12px] text-[#71717a]">{plan.description}</p>
              </div>

              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold text-white">
                  {plan.price}
                </span>
                {plan.period && (
                  <span className="text-sm text-[#52525b]">{plan.period}</span>
                )}
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2.5 text-[13px] text-[#a1a1aa]"
                  >
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link href="/onboarding">
                <Button
                  variant={plan.popular ? "gradient" : "outline"}
                  className={cn(
                    "w-full",
                    !plan.popular && "border-white/10 hover:bg-white/[0.04]"
                  )}
                >
                  {plan.cta}
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
