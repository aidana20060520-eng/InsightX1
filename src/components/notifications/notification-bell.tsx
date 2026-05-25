"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  CheckCheck,
  RefreshCw,
  AlertTriangle,
  Sparkles,
  Info,
  PartyPopper,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * In-app notifications bell. Polls /api/notifications every 60s for new
 * items, shows an unread count dot on the bell, and renders a dropdown
 * panel with the most recent N notifications.
 *
 * Items can carry a `link` which opens via the in-app router. Clicking an
 * item marks it (and only it) as read; "Mark all read" exists as a
 * separate action.
 */

const POLL_INTERVAL_MS = 60_000;

type NotificationType =
  | "sync_complete"
  | "sync_error"
  | "first_connect"
  | "insight"
  | "system";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

const typeMeta: Record<
  NotificationType,
  { icon: React.ComponentType<{ className?: string }>; tone: string }
> = {
  sync_complete: { icon: RefreshCw, tone: "text-blue-400 bg-blue-400/10" },
  sync_error: {
    icon: AlertTriangle,
    tone: "text-amber-400 bg-amber-400/10",
  },
  first_connect: {
    icon: PartyPopper,
    tone: "text-primary bg-primary/10",
  },
  insight: { icon: Sparkles, tone: "text-primary bg-primary/10" },
  system: { icon: Info, tone: "text-muted-foreground bg-muted" },
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [marking, setMarking] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      setItems(json.items || []);
      setUnread(typeof json.unread === "number" ? json.unread : 0);
    } catch {
      /* keep last good data */
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial + polling
  useEffect(() => {
    void fetchNotifications();
    const id = setInterval(() => {
      // Avoid hammering the API when the tab is hidden
      if (typeof document !== "undefined" && document.hidden) return;
      void fetchNotifications();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (
        panelRef.current?.contains(e.target as Node) ||
        buttonRef.current?.contains(e.target as Node)
      ) {
        return;
      }
      setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  // Refresh once when the panel opens (the user may have new items)
  useEffect(() => {
    if (open) void fetchNotifications();
  }, [open, fetchNotifications]);

  const markAllRead = async () => {
    if (unread === 0 || marking) return;
    setMarking(true);
    // Optimistic
    const now = new Date().toISOString();
    setItems((prev) =>
      prev.map((n) => (n.readAt ? n : { ...n, readAt: now }))
    );
    setUnread(0);
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
    } catch {
      // Soft-fail: next poll will reconcile
    } finally {
      setMarking(false);
    }
  };

  const markOneRead = async (id: string) => {
    const target = items.find((n) => n.id === id);
    if (!target || target.readAt) return;
    const now = new Date().toISOString();
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: now } : n))
    );
    setUnread((u) => Math.max(0, u - 1));
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
      });
    } catch {
      /* next poll reconciles */
    }
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        aria-label={
          unread > 0 ? `Notifications (${unread} unread)` : "Notifications"
        }
        className="relative w-9 h-9 rounded-md hover:bg-muted flex items-center justify-center transition-colors"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[16px] h-[16px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center ring-2 ring-background">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            className="absolute right-0 mt-2 w-[min(360px,calc(100vw-2rem))] rounded-xl border border-border bg-card shadow-2xl overflow-hidden z-50"
          >
            <div className="flex items-center justify-between px-4 h-12 border-b border-border">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold">Notifications</p>
                {loading && items.length === 0 && (
                  <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                )}
              </div>
              <button
                onClick={markAllRead}
                disabled={unread === 0 || marking}
                className={cn(
                  "text-[11px] flex items-center gap-1 px-2 py-1 rounded-md transition-colors",
                  unread === 0
                    ? "text-muted-foreground/50 cursor-default"
                    : "text-primary hover:bg-primary/10"
                )}
                title="Mark all as read"
              >
                <CheckCheck className="w-3 h-3" />
                Mark all read
              </button>
            </div>

            <div className="max-h-[420px] overflow-y-auto">
              {items.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  <div className="w-10 h-10 rounded-xl bg-muted/50 mx-auto mb-3 flex items-center justify-center">
                    <Bell className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium">You&apos;re all caught up</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[240px] mx-auto">
                    We&apos;ll only ping you when something meaningful happens
                    — sync results, errors, or noteworthy insights.
                  </p>
                </div>
              ) : (
                <ul className="py-1">
                  {items.map((n) => (
                    <NotificationRow
                      key={n.id}
                      n={n}
                      onClick={() => {
                        void markOneRead(n.id);
                        if (!n.link) return;
                        // Close the panel; navigation handled by Link wrapper below
                        setOpen(false);
                      }}
                    />
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NotificationRow({
  n,
  onClick,
}: {
  n: Notification;
  onClick: () => void;
}) {
  const meta = typeMeta[n.type] ?? typeMeta.system;
  const Icon = meta.icon;
  const unread = !n.readAt;

  const inner = (
    <div
      className={cn(
        "flex gap-3 px-4 py-3 transition-colors cursor-pointer",
        unread ? "bg-primary/[0.04] hover:bg-primary/[0.08]" : "hover:bg-muted"
      )}
    >
      <div
        className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
          meta.tone
        )}
      >
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <p
            className={cn(
              "text-[13px] leading-snug truncate",
              unread ? "font-semibold" : "font-medium"
            )}
          >
            {n.title}
          </p>
          {unread && (
            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
          )}
        </div>
        {n.body && (
          <p className="text-[11.5px] text-muted-foreground leading-snug mt-0.5 line-clamp-2">
            {n.body}
          </p>
        )}
        <p className="text-[10px] text-muted-foreground/70 mt-1">
          {timeAgo(n.createdAt)}
        </p>
      </div>
    </div>
  );

  return (
    <li>
      {n.link ? (
        <Link href={n.link} onClick={onClick} className="block">
          {inner}
        </Link>
      ) : (
        <div onClick={onClick}>{inner}</div>
      )}
    </li>
  );
}

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Date.now() - then;
  const sec = Math.floor(diff / 1000);
  if (sec < 45) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  const wk = Math.floor(day / 7);
  if (wk < 4) return `${wk}w ago`;
  return new Date(iso).toLocaleDateString();
}
