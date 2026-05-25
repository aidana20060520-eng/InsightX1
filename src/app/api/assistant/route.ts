import { NextRequest } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { buildWorkspaceContext } from "@/lib/notion-context";
import { streamChat, type ChatMessage } from "@/lib/gemini";

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
    const ctx = await buildWorkspaceContext(userId);

    const systemPrompt = `${SYSTEM_PROMPT_BASE}\n\n---\n${ctx.text}`;

    const stream = await streamChat(systemPrompt, messages);

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-Content-Type-Options": "nosniff",
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
