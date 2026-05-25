import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Per-user rate limiting for the AI chat. Prevents abuse of the Groq API
 * key (which would burn through your free quota fast) and protects against
 * runaway loops in client code.
 *
 * Backed by Upstash Redis. If the env vars aren't set, the limiter is a
 * no-op so local dev still works without external services. In production
 * you should ALWAYS set these — they're free at https://upstash.com.
 */

const HOURLY_LIMIT = 30; // user messages per hour per user
const BURST_LIMIT = 5; // user messages per 10 seconds per user

interface LimitResult {
  allowed: boolean;
  /** Seconds until the user can try again (0 if allowed). */
  retryAfter: number;
  /** Friendly explanation suitable for showing in the UI. */
  reason: string;
  /** Which window blocked them, useful for logging. */
  window?: "burst" | "hourly";
}

let cachedHourly: Ratelimit | null = null;
let cachedBurst: Ratelimit | null = null;
let envChecked = false;
let envValid = false;

function getRedis(): Redis | null {
  if (!envChecked) {
    envChecked = true;
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    envValid = Boolean(url && token);
    if (!envValid) {
      console.warn(
        "[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN not set — rate limiting disabled. Set them in production!"
      );
    }
  }
  if (!envValid) return null;
  return Redis.fromEnv();
}

function getLimiters() {
  if (cachedHourly && cachedBurst) {
    return { hourly: cachedHourly, burst: cachedBurst };
  }
  const redis = getRedis();
  if (!redis) return null;

  cachedHourly = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(HOURLY_LIMIT, "1 h"),
    analytics: true,
    prefix: "insightx:chat:hourly",
  });
  cachedBurst = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(BURST_LIMIT, "10 s"),
    analytics: true,
    prefix: "insightx:chat:burst",
  });

  return { hourly: cachedHourly, burst: cachedBurst };
}

/**
 * Check if a user is allowed to send another chat message.
 *
 * Two limits are enforced:
 *   1. Burst:  max 5 messages per 10 seconds (stops rapid-fire abuse)
 *   2. Hourly: max 30 messages per hour     (caps total quota burn)
 *
 * Burst is checked first so the user gets clearer feedback when spamming.
 * If Upstash is unreachable, the check fails OPEN — we'd rather serve
 * traffic than break chat over a third-party outage.
 */
export async function checkChatRateLimit(userId: string): Promise<LimitResult> {
  if (!userId) {
    return { allowed: false, retryAfter: 0, reason: "Sign in required." };
  }

  const limiters = getLimiters();
  if (!limiters) {
    // No Redis configured — allow request, but it's logged via the warn above.
    return { allowed: true, retryAfter: 0, reason: "" };
  }

  try {
    const burst = await limiters.burst.limit(userId);
    if (!burst.success) {
      const retry = Math.ceil((burst.reset - Date.now()) / 1000);
      return {
        allowed: false,
        retryAfter: Math.max(retry, 1),
        reason: "Slow down — you're sending messages too fast. Wait a few seconds.",
        window: "burst",
      };
    }

    const hourly = await limiters.hourly.limit(userId);
    if (!hourly.success) {
      const retry = Math.ceil((hourly.reset - Date.now()) / 1000);
      const minutes = Math.ceil(retry / 60);
      return {
        allowed: false,
        retryAfter: Math.max(retry, 1),
        reason: `You've hit the hourly chat limit (${HOURLY_LIMIT} messages). Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
        window: "hourly",
      };
    }

    return { allowed: true, retryAfter: 0, reason: "" };
  } catch (err) {
    // Fail open — don't break chat over a Redis blip
    console.error("[rate-limit] check failed, failing open:", err);
    return { allowed: true, retryAfter: 0, reason: "" };
  }
}
