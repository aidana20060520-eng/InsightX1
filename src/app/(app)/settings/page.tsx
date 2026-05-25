"use client";

import React from "react";
import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useUser, useClerk } from "@clerk/nextjs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/layout/page-transition";
import { useTheme } from "@/components/providers/theme-provider";
import { NotionConnectionCard } from "@/components/notion/notion-connection-card";
import { AboutYouCard } from "@/components/settings/about-you-card";
import { DangerZoneCard } from "@/components/settings/danger-zone-card";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { user, isLoaded } = useUser();
  const clerk = useClerk();

  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.username ||
    "Your account";
  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const initial = (fullName || email || "?").charAt(0).toUpperCase();

  return (
    <PageTransition className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your account and preferences.
        </p>
      </div>

      {/* Profile (real Clerk data) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card>
          <CardContent className="p-6">
            <h2 className="text-base font-semibold mb-4">Profile</h2>
            <div className="flex items-start gap-6">
              {user?.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.imageUrl}
                  alt={fullName}
                  className="w-16 h-16 rounded-2xl object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-xl font-bold text-primary">
                  {isLoaded ? initial : "…"}
                </div>
              )}
              <div className="flex-1 space-y-1">
                <p className="text-base font-semibold">{fullName}</p>
                {email && (
                  <p className="text-sm text-muted-foreground">{email}</p>
                )}
                <p className="text-[11px] text-muted-foreground pt-1">
                  Your profile is managed through your account provider. Use
                  the button below to change your name, email, password, or
                  add 2FA.
                </p>
                <div className="pt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => clerk.openUserProfile()}
                    disabled={!isLoaded}
                  >
                    Manage Account
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* About You — feeds personalization to the AI */}
      <AboutYouCard />

      {/* Integrations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.4 }}
      >
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Integrations
        </h2>
        <NotionConnectionCard />
      </motion.div>

      {/* Appearance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <Card>
          <CardContent className="p-6">
            <h2 className="text-base font-semibold mb-4">Appearance</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Theme</p>
                <p className="text-xs text-muted-foreground">
                  Switch between dark and light mode
                </p>
              </div>
              <button
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className={cn(
                  "relative w-14 h-7 rounded-full transition-colors",
                  theme === "dark" ? "bg-primary" : "bg-muted"
                )}
              >
                <motion.div
                  layout
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className={cn(
                    "absolute top-0.5 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm",
                    theme === "dark" ? "left-7.5" : "left-0.5"
                  )}
                >
                  {theme === "dark" ? (
                    <Moon className="w-3.5 h-3.5 text-primary" />
                  ) : (
                    <Sun className="w-3.5 h-3.5 text-yellow-500" />
                  )}
                </motion.div>
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Plan */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-base font-semibold">Free Plan</h2>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground uppercase tracking-wide">
                    Beta
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Everything is free during the beta. Paid plans arrive after
                  launch.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Your Data — export + delete account */}
      <DangerZoneCard />
    </PageTransition>
  );
}
