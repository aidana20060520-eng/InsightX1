import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const runtime = "nodejs";

// Per-IP rate limit so this form can't be abused by bots. 3 submissions
// per hour per IP is generous for real humans, brutal for spammers.
let cachedLimiter: Ratelimit | null = null;
function getLimiter(): Ratelimit | null {
  if (cachedLimiter) return cachedLimiter;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  cachedLimiter = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(3, "1 h"),
    prefix: "insightx:contact",
  });
  return cachedLimiter;
}

interface ContactPayload {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  // Honeypot — real humans never fill this. Bots usually do.
  website?: string;
}

const FIELD_LIMITS = {
  name: 100,
  email: 200,
  subject: 200,
  message: 5000,
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ContactPayload;

    // Honeypot check — silently succeed so bots don't realize they were caught
    if (body.website && body.website.trim().length > 0) {
      console.warn("[contact] honeypot triggered, dropping submission");
      return NextResponse.json({ ok: true });
    }

    const name = clean(body.name, FIELD_LIMITS.name);
    const email = clean(body.email, FIELD_LIMITS.email);
    const subject = clean(body.subject, FIELD_LIMITS.subject);
    const message = clean(body.message, FIELD_LIMITS.message);

    if (!name || name.length < 2) {
      return NextResponse.json({ error: "Please add your name." }, { status: 400 });
    }
    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json(
        { error: "Please add a valid email address." },
        { status: 400 }
      );
    }
    if (!message || message.length < 10) {
      return NextResponse.json(
        { error: "Message must be at least 10 characters." },
        { status: 400 }
      );
    }

    const ip = getClientIp(req);
    const ipHash = createHash("sha256").update(ip).digest("hex").slice(0, 32);

    // Rate limit by IP (skipped if Upstash not configured — fail open)
    const limiter = getLimiter();
    if (limiter) {
      const result = await limiter.limit(ip);
      if (!result.success) {
        const retry = Math.ceil((result.reset - Date.now()) / 1000 / 60);
        return NextResponse.json(
          {
            error: `Too many messages. Try again in ${retry} minute${retry === 1 ? "" : "s"}.`,
          },
          { status: 429 }
        );
      }
    }

    // Tag the message with the user ID if they happen to be signed in
    let userId: string | null = null;
    try {
      const session = await auth();
      userId = session.userId ?? null;
    } catch {
      /* unsigned-in users are fine */
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("contact_messages").insert({
      name,
      email,
      subject: subject || null,
      message,
      user_id: userId,
      user_agent: req.headers.get("user-agent")?.slice(0, 300) ?? null,
      ip_hash: ipHash,
    });

    if (error) {
      console.error("[contact] insert failed:", error);
      return NextResponse.json(
        { error: "Couldn't save your message. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Something went wrong";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
