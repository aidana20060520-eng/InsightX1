import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { createSession, listSessions } from "@/lib/chat-history";

export const runtime = "nodejs";

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    const sessions = await listSessions(userId);
    return NextResponse.json({ sessions });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load sessions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    const body = await req.json().catch(() => ({}));
    const title =
      typeof body?.title === "string" ? body.title : undefined;
    const session = await createSession(userId, title);
    return NextResponse.json({ session });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
