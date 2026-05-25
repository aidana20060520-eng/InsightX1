import { getSupabaseAdmin } from "./supabase-admin";

/**
 * Account data utilities — used by /api/account to honor the privacy
 * promises in the Privacy Policy: users can export everything we hold on
 * them, and they can delete their account permanently.
 *
 * Both functions take a Clerk user_id. Caller is responsible for verifying
 * the requester is that user (or an admin).
 */

export interface ExportPayload {
  exportedAt: string;
  userId: string;
  profile: unknown;
  notionConnections: unknown[];
  chatSessions: Array<{
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    messages: Array<{
      role: "user" | "assistant";
      content: string;
      createdAt: string;
    }>;
  }>;
  contactMessages: unknown[];
}

/**
 * Build a JSON snapshot of everything we store about a single user.
 * Sensitive fields (encrypted Notion access tokens, ip_hash) are omitted.
 */
export async function exportUserData(userId: string): Promise<ExportPayload> {
  const sb = getSupabaseAdmin();

  // Profile
  const { data: profile } = await sb
    .from("user_profiles")
    .select("display_name, role, about, goals, preferred_tone, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  // Notion connections (without the encrypted token)
  const { data: connections } = await sb
    .from("notion_connections")
    .select(
      "id, workspace_id, workspace_name, status, last_sync_at, pages_synced, databases_synced, created_at"
    )
    .eq("user_id", userId);

  // Chat sessions + their messages
  const { data: sessions } = await sb
    .from("chat_sessions")
    .select("id, title, created_at, updated_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  const sessionList = sessions || [];
  const sessionIds = sessionList.map((s) => s.id);

  let messagesBySession = new Map<string, Array<{ role: "user" | "assistant"; content: string; created_at: string }>>();
  if (sessionIds.length > 0) {
    const { data: msgs } = await sb
      .from("chat_messages")
      .select("session_id, role, content, created_at")
      .in("session_id", sessionIds)
      .order("created_at", { ascending: true });
    messagesBySession = (msgs || []).reduce((acc, m) => {
      const arr = acc.get(m.session_id) || [];
      arr.push({ role: m.role, content: m.content, created_at: m.created_at });
      acc.set(m.session_id, arr);
      return acc;
    }, new Map<string, Array<{ role: "user" | "assistant"; content: string; created_at: string }>>());
  }

  const chatSessions = sessionList.map((s) => ({
    id: s.id,
    title: s.title,
    createdAt: s.created_at,
    updatedAt: s.updated_at,
    messages: (messagesBySession.get(s.id) || []).map((m) => ({
      role: m.role,
      content: m.content,
      createdAt: m.created_at,
    })),
  }));

  // Contact messages (only ones tied to this user_id)
  const { data: contactMessages } = await sb
    .from("contact_messages")
    .select("subject, message, created_at, resolved")
    .eq("user_id", userId);

  return {
    exportedAt: new Date().toISOString(),
    userId,
    profile: profile ?? null,
    notionConnections: connections || [],
    chatSessions,
    contactMessages: contactMessages || [],
  };
}

/**
 * Permanently delete every Supabase row tied to this user. Cascading
 * foreign keys clean up child tables (messages, pages, databases, tasks,
 * sync runs) automatically.
 *
 * Contact messages are anonymized rather than deleted — the user wrote
 * to us as the operator of the service, so we keep the support thread
 * but scrub the linkage.
 */
export async function deleteUserData(userId: string): Promise<void> {
  const sb = getSupabaseAdmin();

  // Chat sessions → cascades to chat_messages
  await sb.from("chat_sessions").delete().eq("user_id", userId);

  // Notion connections → cascades to notion_pages / databases / tasks / sync_runs
  await sb.from("notion_connections").delete().eq("user_id", userId);

  // User profile
  await sb.from("user_profiles").delete().eq("user_id", userId);

  // Contact messages — anonymize, don't delete
  await sb
    .from("contact_messages")
    .update({ user_id: null, ip_hash: null })
    .eq("user_id", userId);
}
