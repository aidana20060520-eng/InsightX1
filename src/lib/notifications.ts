import { getSupabaseAdmin } from "./supabase-admin";

/**
 * Server-side helpers for in-app notifications.
 *
 * Anti-spam policy:
 *   - createNotification() de-duplicates against the user's most recent
 *     notification of the SAME type within DEDUPE_WINDOW_MINUTES. If one
 *     exists we silently skip. This prevents e.g. an hourly cron sync
 *     firing 24 "Notion synced" pings a day.
 *   - Callers can pass `force: true` to bypass dedupe (used for
 *     user-initiated syncs where they expect feedback).
 */

const DEDUPE_WINDOW_MINUTES = 240; // 4 hours

export type NotificationType =
  | "sync_complete"
  | "sync_error"
  | "first_connect"
  | "insight"
  | "system";

export interface NotificationRecord {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

interface CreateOptions {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string | null;
  link?: string | null;
  /** If true, skip the dedupe window check */
  force?: boolean;
}

/**
 * Insert a notification. Returns the created row, or null if a recent
 * duplicate caused us to skip.
 */
export async function createNotification(
  opts: CreateOptions
): Promise<NotificationRecord | null> {
  const sb = getSupabaseAdmin();

  if (!opts.force) {
    const cutoff = new Date(
      Date.now() - DEDUPE_WINDOW_MINUTES * 60 * 1000
    ).toISOString();
    const { data: recent } = await sb
      .from("notifications")
      .select("id")
      .eq("user_id", opts.userId)
      .eq("type", opts.type)
      .gt("created_at", cutoff)
      .limit(1)
      .maybeSingle();
    if (recent) return null; // skipped — too recent
  }

  const { data, error } = await sb
    .from("notifications")
    .insert({
      user_id: opts.userId,
      type: opts.type,
      title: opts.title,
      body: opts.body ?? null,
      link: opts.link ?? null,
    })
    .select("id, type, title, body, link, read_at, created_at")
    .maybeSingle();

  if (error || !data) {
    console.error("[notifications] insert failed:", error);
    return null;
  }
  return mapRow(data);
}

export async function listNotifications(
  userId: string,
  limit = 20
): Promise<NotificationRecord[]> {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("notifications")
    .select("id, type, title, body, link, read_at, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("[notifications] list failed:", error);
    return [];
  }
  return (data || []).map(mapRow);
}

export async function unreadCount(userId: string): Promise<number> {
  const sb = getSupabaseAdmin();
  const { count, error } = await sb
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);
  if (error) {
    console.error("[notifications] unread count failed:", error);
    return 0;
  }
  return count ?? 0;
}

export async function markAllRead(userId: string): Promise<void> {
  const sb = getSupabaseAdmin();
  const now = new Date().toISOString();
  const { error } = await sb
    .from("notifications")
    .update({ read_at: now })
    .eq("user_id", userId)
    .is("read_at", null);
  if (error) console.error("[notifications] markAllRead failed:", error);
}

export async function markRead(
  userId: string,
  ids: string[]
): Promise<void> {
  if (ids.length === 0) return;
  const sb = getSupabaseAdmin();
  const { error } = await sb
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .in("id", ids);
  if (error) console.error("[notifications] markRead failed:", error);
}

function mapRow(r: {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}): NotificationRecord {
  return {
    id: r.id,
    type: r.type as NotificationType,
    title: r.title,
    body: r.body,
    link: r.link,
    readAt: r.read_at,
    createdAt: r.created_at,
  };
}
