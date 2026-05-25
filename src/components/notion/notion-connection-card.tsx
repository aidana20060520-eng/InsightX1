"use client";

import React, { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Loader2,
  AlertCircle,
  RefreshCw,
  Plug,
  FileText,
  Database,
  Unplug,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NotionStatus {
  connected: boolean;
  connection?: {
    id: string;
    workspace_id: string;
    workspace_name: string | null;
    workspace_icon: string | null;
    status: "connected" | "syncing" | "error" | "disconnected";
    last_sync_at: string | null;
    last_error: string | null;
    pages_synced: number;
    databases_synced: number;
    created_at: string;
  };
  lastRun?: {
    started_at: string;
    finished_at: string | null;
    status: string;
    pages_added: number;
    pages_updated: number;
    databases_added: number;
    databases_updated: number;
    error_message: string | null;
  } | null;
}

function timeAgo(iso: string | null): string {
  if (!iso) return "never";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotionConnectionCard() {
  const [status, setStatus] = useState<NotionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/notion/status", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (e) {
      console.error("Failed to fetch Notion status:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Poll while syncing
  useEffect(() => {
    const s = status?.connection?.status;
    if (s !== "syncing") return;
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, [status?.connection?.status, fetchStatus]);

  // Detect query params on first mount (?notion=connected | error)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (url.searchParams.has("notion")) {
      // Clear the query string without reload
      url.searchParams.delete("notion");
      url.searchParams.delete("reason");
      window.history.replaceState({}, "", url.toString());
      fetchStatus();
    }
  }, [fetchStatus]);

  const handleConnect = () => {
    window.location.href = "/api/notion/authorize";
  };

  const handleSync = async () => {
    if (!status?.connection) return;
    setSyncing(true);
    // Optimistic: mark as syncing immediately
    setStatus((prev) =>
      prev?.connection
        ? { ...prev, connection: { ...prev.connection, status: "syncing" } }
        : prev
    );
    try {
      await fetch(`/api/notion/sync?connectionId=${status.connection.id}`, {
        method: "POST",
      });
    } catch (e) {
      console.error("Sync failed:", e);
    } finally {
      setSyncing(false);
      fetchStatus();
    }
  };

  const handleDisconnect = async () => {
    if (!status?.connection) return;
    if (!confirm("Disconnect Notion? Your synced data will be removed.")) return;
    try {
      await fetch(
        `/api/notion/disconnect?connectionId=${status.connection.id}`,
        { method: "POST" }
      );
      setStatus({ connected: false });
    } catch (e) {
      console.error("Disconnect failed:", e);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-5 h-40 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const connection = status?.connection;
  const isSyncing = connection?.status === "syncing" || syncing;
  const isError = connection?.status === "error";

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <AnimatePresence mode="wait">
          {!status?.connected ? (
            <DisconnectedView key="disc" onConnect={handleConnect} />
          ) : (
            <ConnectedView
              key="conn"
              connection={connection!}
              isSyncing={isSyncing}
              isError={isError}
              onSync={handleSync}
              onDisconnect={handleDisconnect}
            />
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

function DisconnectedView({ onConnect }: { onConnect: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-6"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0">
          <NotionLogo className="w-6 h-6 text-foreground" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold">Notion</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4 leading-relaxed">
            Connect your workspace to unlock AI insights, pattern detection, and
            personalized recommendations from your pages and databases.
          </p>
          <div className="flex flex-wrap items-center gap-2 mb-5">
            {["Pages", "Databases", "Tasks", "Metadata"].map((tag) => (
              <span
                key={tag}
                className="text-[11px] px-2 py-1 rounded-md bg-muted text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
          <Button onClick={onConnect} className="gap-2">
            <Plug className="w-4 h-4" />
            Connect Notion
          </Button>
          <p className="text-[11px] text-muted-foreground mt-3">
            Tokens are encrypted with AES-256-GCM before storage. You can
            disconnect at any time.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function ConnectedView({
  connection,
  isSyncing,
  isError,
  onSync,
  onDisconnect,
}: {
  connection: NonNullable<NotionStatus["connection"]>;
  isSyncing: boolean;
  isError: boolean;
  onSync: () => void;
  onDisconnect: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0 relative">
            {connection.workspace_icon &&
            connection.workspace_icon.startsWith("http") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={connection.workspace_icon}
                alt=""
                className="w-8 h-8 rounded-md"
              />
            ) : connection.workspace_icon ? (
              <span className="text-2xl">{connection.workspace_icon}</span>
            ) : (
              <NotionLogo className="w-6 h-6 text-foreground" />
            )}
            <StatusDot
              status={
                isError ? "error" : isSyncing ? "syncing" : "connected"
              }
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-base font-semibold truncate">
                  {connection.workspace_name || "Notion workspace"}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Connected{" "}
                  {timeAgo(connection.created_at)}
                </p>
              </div>
              <StatusBadge
                status={
                  isError ? "error" : isSyncing ? "syncing" : "connected"
                }
              />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mt-5">
              <Stat
                icon={FileText}
                label="Pages"
                value={connection.pages_synced}
              />
              <Stat
                icon={Database}
                label="Databases"
                value={connection.databases_synced}
              />
              <Stat
                icon={RefreshCw}
                label="Last sync"
                value={timeAgo(connection.last_sync_at)}
                small
              />
            </div>

            {/* Error message */}
            {isError && connection.last_error && (
              <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/5 p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-red-400">
                    Last sync failed
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 break-words">
                    {connection.last_error}
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 mt-5">
              <Button
                size="sm"
                onClick={onSync}
                disabled={isSyncing}
                className="gap-2"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    Sync now
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onDisconnect}
                className="gap-2 text-muted-foreground hover:text-red-400"
              >
                <Unplug className="w-3.5 h-3.5" />
                Disconnect
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Sync progress bar */}
      {isSyncing && (
        <div className="h-0.5 bg-muted overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-accent"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
      )}
    </motion.div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  small,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  small?: boolean;
}) {
  return (
    <div className="rounded-lg bg-muted/40 border border-border p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3 h-3 text-muted-foreground" />
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <div
        className={cn("font-semibold tabular-nums", small ? "text-sm" : "text-xl")}
      >
        {value}
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: "connected" | "syncing" | "error" }) {
  const colors = {
    connected: "bg-green-400",
    syncing: "bg-amber-400",
    error: "bg-red-400",
  };
  return (
    <span className="absolute -top-1 -right-1 flex">
      {status === "syncing" && (
        <span className="absolute inline-flex w-3 h-3 rounded-full bg-amber-400 opacity-75 animate-ping" />
      )}
      <span
        className={cn(
          "relative inline-flex w-3 h-3 rounded-full ring-2 ring-card",
          colors[status]
        )}
      />
    </span>
  );
}

function StatusBadge({
  status,
}: {
  status: "connected" | "syncing" | "error";
}) {
  const config = {
    connected: { label: "Connected", classes: "bg-green-400/10 text-green-400" },
    syncing: { label: "Syncing", classes: "bg-amber-400/10 text-amber-400" },
    error: { label: "Error", classes: "bg-red-400/10 text-red-400" },
  };
  const c = config[status];
  return (
    <span
      className={cn(
        "text-[10px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0",
        c.classes
      )}
    >
      {status === "syncing" && (
        <Loader2 className="w-2.5 h-2.5 animate-spin inline mr-1" />
      )}
      {c.label}
    </span>
  );
}

function NotionLogo({ className }: { className?: string }) {
  // Simplified Notion-style "N"
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M5 4h11l3 3v13H5V4zm2 2v12h10V8.5L15.5 7H7v-1zm2 4h6v1.5H9V10zm0 3h6v1.5H9V13zm0 3h4v1.5H9V16z" />
    </svg>
  );
}
