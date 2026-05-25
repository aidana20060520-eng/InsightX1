/**
 * LLM client for InsightX, backed by Groq (Llama 3.3 70B).
 *
 * The filename is `gemini.ts` for historical reasons — this module used to
 * call Google Gemini. The exported API is unchanged so callers don't care
 * which provider is behind it.
 *
 * Why Groq:
 *   - Truly free tier (no credit card)
 *   - ~30 req/min, rarely overloaded
 *   - OpenAI-compatible streaming API
 *   - Quality on Llama 3.3 70B is comparable to Gemini Flash for chat over
 *     a small workspace context.
 */
import Groq from "groq-sdk";

let _client: Groq | null = null;
function getClient(): Groq {
  if (_client) return _client;
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GROQ_API_KEY is not set. Add it to .env.local — get a free key at https://console.groq.com/keys"
    );
  }
  _client = new Groq({ apiKey });
  return _client;
}

/**
 * Default model. Override via GROQ_MODEL in .env.local if you want to use a
 * different free Groq model. Good free-tier choices:
 *   - llama-3.3-70b-versatile (default, smartest free model)
 *   - llama-3.1-8b-instant    (much faster, slightly dumber)
 *   - gemma2-9b-it            (Google's open model on Groq)
 */
export const DEFAULT_MODEL =
  process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Convert our internal {role, content} messages to Groq's OpenAI-style
 * message format. System prompt is prepended as a separate message.
 */
function toGroqMessages(systemPrompt: string, messages: ChatMessage[]) {
  return [
    { role: "system" as const, content: systemPrompt },
    ...messages.map((m) => ({
      role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: m.content,
    })),
  ];
}

/**
 * Stream a chat response as plain UTF-8 chunks. Returns a ReadableStream
 * suitable for returning directly from a Next.js route handler.
 *
 * Errors at every stage (auth, connection, streaming) are caught and
 * converted into a friendly inline message — the route handler never has
 * to think about errors, and the user never sees raw JSON.
 */
export async function streamChat(
  systemPrompt: string,
  messages: ChatMessage[],
  model: string = DEFAULT_MODEL
): Promise<ReadableStream<Uint8Array>> {
  const encoder = new TextEncoder();

  let stream: AsyncIterable<{
    choices?: Array<{ delta?: { content?: string | null } }>;
  }>;
  try {
    stream = await startStreamWithRetry(systemPrompt, messages, model);
  } catch (err) {
    console.error("[llm] streamChat init failed:", err);
    const friendly = humanizeError(err);
    return new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode(friendly));
        controller.close();
      },
    });
  }

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const text = chunk.choices?.[0]?.delta?.content;
          if (text) controller.enqueue(encoder.encode(text));
        }
        controller.close();
      } catch (err) {
        console.error("[llm] streamChat chunk failed:", err);
        const friendly = humanizeError(err);
        controller.enqueue(encoder.encode(`\n\n_${friendly}_`));
        controller.close();
      }
    },
  });
}

/**
 * Call chat.completions.create with one retry on transient 5xx. Throws on
 * hard failure (4xx, missing key, etc).
 */
async function startStreamWithRetry(
  systemPrompt: string,
  messages: ChatMessage[],
  model: string
) {
  const client = getClient();
  const args = {
    model,
    messages: toGroqMessages(systemPrompt, messages),
    temperature: 0.7,
    max_tokens: 1500,
    stream: true as const,
  };

  try {
    return await client.chat.completions.create(args);
  } catch (err) {
    if (isTransient(err)) {
      await new Promise((r) => setTimeout(r, 1500));
      return await client.chat.completions.create(args);
    }
    throw err;
  }
}

function isTransient(err: unknown): boolean {
  const raw = err instanceof Error ? err.message : String(err ?? "");
  const status = (err as { status?: number })?.status;
  return (
    status === 503 ||
    status === 500 ||
    status === 502 ||
    status === 504 ||
    raw.includes("ECONNRESET") ||
    raw.includes("ETIMEDOUT") ||
    raw.includes("fetch failed")
  );
}

/**
 * One-shot generation that returns a complete text response. Useful for
 * summaries / insights where we want to parse or post-process the result.
 */
export async function generateText(
  systemPrompt: string,
  userPrompt: string,
  model: string = DEFAULT_MODEL
): Promise<string> {
  const client = getClient();
  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.6,
    max_tokens: 1500,
  });
  return response.choices[0]?.message?.content ?? "";
}

/**
 * Generate JSON output. Asks the model to return JSON and parses it for us.
 * Throws if the response is unparseable.
 */
export async function generateJson<T>(
  systemPrompt: string,
  userPrompt: string,
  model: string = DEFAULT_MODEL
): Promise<T> {
  const client = getClient();
  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.4,
    max_tokens: 2000,
    response_format: { type: "json_object" },
  });
  const text = response.choices[0]?.message?.content ?? "";
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`LLM returned non-JSON response: ${text.slice(0, 200)}`);
  }
}

/**
 * Turn SDK errors into a short, user-friendly sentence. Most users will see
 * this; technical details stay in server logs.
 */
function humanizeError(err: unknown): string {
  const raw =
    err instanceof Error ? err.message : typeof err === "string" ? err : "";
  const status = (err as { status?: number })?.status;

  if (status === 429 || raw.includes("rate_limit") || raw.includes("RESOURCE_EXHAUSTED")) {
    return "AI rate limit reached. Please wait a minute and try again.";
  }
  if (status === 401 || status === 403 || raw.includes("invalid_api_key")) {
    return "The AI API key is invalid. Check GROQ_API_KEY in .env.local.";
  }
  if (status === 400) {
    return "The AI request was rejected. The conversation may be too long — try starting a new chat.";
  }
  if (status === 503 || raw.includes("UNAVAILABLE") || raw.includes("overloaded")) {
    return "The AI service is temporarily overloaded. Please try again in a few seconds.";
  }
  if (status === 500 || status === 502 || status === 504) {
    return "The AI service hit an internal error. Please try again shortly.";
  }
  return "Couldn't reach the AI right now. Please check your connection and try again.";
}
