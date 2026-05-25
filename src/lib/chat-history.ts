import { getSupabaseAdmin } from "./supabase-admin";

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredMessage {
  id: string;
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface SessionRow {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface MessageRow {
  id: string;
  session_id: string;
  role: string;
  content: string;
  created_at: string;
}

const sessionFromRow = (row: SessionRow): ChatSession => ({
  id: row.id,
  userId: row.user_id,
  title: row.title,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const messageFromRow = (row: MessageRow): StoredMessage => ({
  id: row.id,
  sessionId: row.session_id,
  role: row.role === "assistant" ? "assistant" : "user",
  content: row.content,
  createdAt: row.created_at,
});

/**
 * Create a new chat session. Title defaults to "New chat" but should be set
 * to the first ~40 chars of the user's first message after we have one.
 */
export async function createSession(
  userId: string,
  title?: string
): Promise<ChatSession> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("chat_sessions")
    .insert({
      user_id: userId,
      title: (title || "").trim() || "New chat",
    })
    .select("id, user_id, title, created_at, updated_at")
    .single();

  if (error) throw new Error(`Failed to create session: ${error.message}`);
  return sessionFromRow(data as SessionRow);
}

/**
 * List the user's sessions, newest first.
 */
export async function listSessions(userId: string): Promise<ChatSession[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("chat_sessions")
    .select("id, user_id, title, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[chat-history] listSessions:", error);
    return [];
  }
  return (data as SessionRow[]).map(sessionFromRow);
}

/**
 * Fetch a session with its messages, scoped to the user. Returns null if the
 * session doesn't exist or doesn't belong to the user.
 */
export async function getSessionWithMessages(
  userId: string,
  sessionId: string
): Promise<{ session: ChatSession; messages: StoredMessage[] } | null> {
  const supabase = getSupabaseAdmin();

  const { data: session, error: sessionErr } = await supabase
    .from("chat_sessions")
    .select("id, user_id, title, created_at, updated_at")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (sessionErr || !session) return null;

  const { data: messages } = await supabase
    .from("chat_messages")
    .select("id, session_id, role, content, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  return {
    session: sessionFromRow(session as SessionRow),
    messages: ((messages as MessageRow[]) || []).map(messageFromRow),
  };
}

/**
 * Append a message to a session. Updates the session's updated_at via the
 * database trigger so it floats to the top of the list.
 */
export async function appendMessage(
  sessionId: string,
  role: "user" | "assistant",
  content: string
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("chat_messages").insert({
    session_id: sessionId,
    role,
    content,
  });
  if (error) {
    console.error("[chat-history] appendMessage:", error);
    return;
  }
  // Touch the session so it sorts to top
  await supabase
    .from("chat_sessions")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", sessionId);
}

/**
 * Set the title of a session (called once after the first user message).
 */
export async function updateSessionTitle(
  userId: string,
  sessionId: string,
  title: string
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const cleaned = title.trim().slice(0, 80) || "New chat";
  await supabase
    .from("chat_sessions")
    .update({ title: cleaned })
    .eq("id", sessionId)
    .eq("user_id", userId);
}

/**
 * Verify a session belongs to the given user. Returns true if it does.
 */
export async function userOwnsSession(
  userId: string,
  sessionId: string
): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("chat_sessions")
    .select("id")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();
  return !error && !!data;
}

export async function deleteSession(
  userId: string,
  sessionId: string
): Promise<void> {
  const supabase = getSupabaseAdmin();
  await supabase
    .from("chat_sessions")
    .delete()
    .eq("id", sessionId)
    .eq("user_id", userId);
}
