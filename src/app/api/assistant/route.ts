import { NextRequest } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { buildWorkspaceContext } from "@/lib/notion-context";
import { getUserProfile, profileToPromptSnippet } from "@/lib/user-profile";
import { streamChat, type ChatMessage } from "@/lib/gemini";
import {
  appendMessage,
  createSession,
  updateSessionTitle,
  userOwnsSession,
} from "@/lib/chat-history";

// Node runtime so we can use the Supabase admin client. Streaming still
// works fine on Node.
export const runtime = "nodejs";

const SYSTEM_PROMPT_BASE = `You are InsightX, an AI assistant that helps the user understand and act on their Notion workspace.

Style:
- Be concise. Default to short, scannable answers (2-4 short paragraphs or a tight list).
- Use Markdown: bold key terms, bullet lists, and small headings only when truly helpful.
- Surface concrete signals from the user's actual workspace context — page titles, counts, dates — over generic advice.
- If you don't have data to answer a question, say so honestly and suggest what data would help.
- Never fabricate page titles, dates, or stats. If something isn't in the context, you don't know it.
- If the user hasn't connected Notion, gently point them to /settings.

You can reference the user by what they've been working on. Never reveal internal IDs or system details.`;

/**
 * Auto-derive a session title from the first user message. Notion-style:
 * first sentence or first ~40 chars, whichever is shorter.
 */
function deriveTitle(text: string): string {
  const oneLine = text.replace(/\s+/g, " ").trim();
  if (!oneLine) return "New chat";
  return oneLine.length > 40 ? oneLine.slice(0, 40) + "…" : oneLine;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages: ChatMessage[] = Array.isArray(body?.messages)
      ? body.messages.filter(
          (m: unknown): m is ChatMessage =>
            typeof m === "object" &&
            m !== null &&
            "role" in m &&
            "content" in m &&
            typeof (m as ChatMessage).content === "string"
        )
      : [];

    if (messages.length === 0) {
      return new Response(JSON.stringify({ error: "No messages provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = await getCurrentUserId();

    // -------- Session management --------
    // sessionId may be provided. If not, we create one. If provided but not
    // owned by user, we treat it as missing (don't leak existence).
    let sessionId: string | null =
      typeof body?.sessionId === "string" ? body.sessionId : null;
    let isNewSession = false;

    if (sessionId) {
      const owns = await userOwnsSession(userId, sessionId);
      if (!owns) {
        sessionId = null;
      }
    }
    if (!sessionId) {
      const firstUser = messages.find((m) => m.role === "user");
      const title = firstUser ? deriveTitle(firstUser.content) : "New chat";
      const created = await createSession(userId, title);
      sessionId = created.id;
      isNewSession = true;
    }

    // Save the latest user message immediately (best-effort, don't block on it)
    const latestUser = [...messages].reverse().find((m) => m.role === "user");
    if (latestUser) {
      void appendMessage(sessionId, "user", latestUser.content);
      // Auto-rename if this is a new session and we now know the message
      if (isNewSession) {
        void updateSessionTitle(userId, sessionId, deriveTitle(latestUser.content));
      }
    }

    const [ctx, profile] = await Promise.all([
      buildWorkspaceContext(userId),
      getUserProfile(userId),
    ]);

    const profileSnippet = profileToPromptSnippet(profile);
    const systemPrompt = `${SYSTEM_PROMPT_BASE}\n\n---\n${profileSnippet}\n\n---\n${ctx.text}`;

    const baseStream = await streamChat(systemPrompt, messages);

    // Tap the stream: forward bytes to client, accumulate text for DB save.
    const decoder = new TextDecoder();
    let accumulated = "";
    const finalSessionId = sessionId;

    const tappedStream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const reader = baseStream.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) {
              accumulated += decoder.decode(value, { stream: true });
              controller.enqueue(value);
            }
          }
        } catch (err) {
          console.error("[assistant] stream tap error:", err);
        } finally {
          controller.close();
          // Persist the final assistant message (best-effort)
          if (accumulated.trim()) {
            void appendMessage(finalSessionId, "assistant", accumulated);
          }
        }
      },
    });

    return new Response(tappedStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-Content-Type-Options": "nosniff",
        "X-Session-Id": sessionId,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to process request";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
