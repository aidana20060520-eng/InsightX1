/**
 * Client-side helper that turns *any* server error body — plain text,
 * `{error: "..."}`, or a deeply-nested Gemini error JSON — into a short,
 * human-friendly sentence.
 *
 * Used by the chat surfaces so users never see raw JSON dumps.
 */
export function extractFriendlyError(text: string): string {
  if (!text) return "The AI didn't respond. Please try again.";

  if (text.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(text);
      const msg = deepFindMessage(parsed);
      if (msg) {
        // Map well-known Gemini status codes to short copy
        if (/code"?\s*:?\s*"?503/.test(text) || /UNAVAILABLE/i.test(msg)) {
          return "The AI model is overloaded right now — please try again in a few seconds.";
        }
        if (
          /code"?\s*:?\s*"?429/.test(text) ||
          /RESOURCE_EXHAUSTED/i.test(msg)
        ) {
          if (/limit:\s*0/.test(text)) {
            return "Your AI account has no free quota on this model. Try switching GEMINI_MODEL in .env.local.";
          }
          return "AI rate limit reached. Please wait a minute and try again.";
        }
        if (/PERMISSION_DENIED/i.test(msg) || /API key/i.test(msg)) {
          return "The AI API key is invalid or restricted.";
        }
        if (/code"?\s*:?\s*"?400/.test(text) || /INVALID_ARGUMENT/i.test(msg)) {
          return "The conversation was rejected — it may be too long. Try starting a new chat.";
        }
        const clean = msg.replace(/\s+/g, " ").trim();
        return clean.length > 220 ? clean.slice(0, 220) + "…" : clean;
      }
    } catch {
      /* fall through */
    }
  }

  const trimmed = text.replace(/\s+/g, " ").trim();
  return trimmed.length > 220 ? trimmed.slice(0, 220) + "…" : trimmed;
}

function deepFindMessage(obj: unknown): string | null {
  if (!obj || typeof obj !== "object") return null;
  const o = obj as Record<string, unknown>;
  if (typeof o.message === "string") {
    // Sometimes `message` itself is a JSON string — recurse into it.
    const nested = deepFindMessage(safeParse(o.message));
    return nested || o.message;
  }
  if (typeof o.error === "string") return o.error;
  for (const v of Object.values(o)) {
    const found = deepFindMessage(v);
    if (found) return found;
  }
  return null;
}

function safeParse(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}
