"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Trash2, Loader2, AlertTriangle, X } from "lucide-react";
import { useClerk } from "@clerk/nextjs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * Privacy / data-rights controls for the Settings page. Lets a user
 *   1. Download a JSON export of everything we hold on them
 *   2. Permanently delete their account + all server-side data
 *
 * Both are wired to /api/account.
 */
export function DangerZoneCard() {
  const { signOut } = useClerk();
  const [exporting, setExporting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setExporting(true);
    setError(null);
    try {
      const res = await fetch("/api/account", { cache: "no-store" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message || "Export failed.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      // Pull filename from Content-Disposition if present
      const cd = res.headers.get("content-disposition") || "";
      const match = cd.match(/filename="([^"]+)"/);
      a.download = match?.[1] || "insightx-data.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Couldn't export your data."
      );
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (confirmText.trim().toUpperCase() !== "DELETE") return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch("/api/account", {
        method: "DELETE",
        headers: { "X-Confirm-Delete": "DELETE" },
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message || "Delete failed.");
      }
      // Sign out and bounce to the landing page; the account is gone.
      await signOut({ redirectUrl: "/" });
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Couldn't delete your account. Try again or contact support."
      );
      setDeleting(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
      >
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Your Data
        </h2>
        <Card>
          <CardContent className="p-6 space-y-5">
            {/* Export */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-sm font-semibold mb-1">Export your data</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Download a JSON file containing your profile, chat history,
                  Notion connection metadata, and any messages you&apos;ve
                  sent us through the contact form.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleExport}
                disabled={exporting}
                className="shrink-0 gap-2"
              >
                {exporting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Preparing…
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </>
                )}
              </Button>
            </div>

            <div className="border-t border-border" />

            {/* Delete */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-sm font-semibold mb-1 text-destructive">
                  Delete account
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Permanently remove your profile, all chat history, your
                  Notion connection, and your sign-in. This cannot be undone.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setConfirmOpen(true);
                  setConfirmText("");
                  setError(null);
                }}
                className="shrink-0 gap-2 text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/60 hover:bg-destructive/5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </Button>
            </div>

            {error && !confirmOpen && (
              <p className="text-xs text-destructive">{error}</p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {confirmOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !deleting && setConfirmOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl">
                <div className="flex items-start justify-between p-5 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold">
                        Delete your account?
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        This is permanent.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => !deleting && setConfirmOpen(false)}
                    disabled={deleting}
                    className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center transition-colors disabled:opacity-50"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-5 space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    We&apos;ll permanently delete your profile, every chat you
                    have with InsightX, your saved Notion connection, and
                    your sign-in identity. We can&apos;t recover any of it
                    afterwards.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Want a copy first? Cancel and use{" "}
                    <span className="font-semibold">Download</span> above.
                  </p>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1.5">
                      Type{" "}
                      <span className="font-mono font-semibold text-foreground">
                        DELETE
                      </span>{" "}
                      to confirm
                    </label>
                    <input
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      disabled={deleting}
                      placeholder="DELETE"
                      autoFocus
                      className="w-full h-10 rounded-lg border border-border bg-muted/40 px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                    />
                  </div>
                  {error && (
                    <p className="text-xs text-destructive">{error}</p>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmOpen(false)}
                      disabled={deleting}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleDelete}
                      disabled={
                        deleting ||
                        confirmText.trim().toUpperCase() !== "DELETE"
                      }
                      className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground gap-2"
                    >
                      {deleting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Deleting…
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete forever
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
