import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import {
  getSessionWithMessages,
  deleteSession,
  updateSessionTitle,
} from "@/lib/chat-history";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const userId = await getCurrentUserId();
    const { id } = await params;
    const result = await getSessionWithMessages(userId, id);
    if (!result) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
    const userId = await getCurrentUserId();
    const { id } = await params;
    await deleteSession(userId, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to delete session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const userId = await getCurrentUserId();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const title = typeof body?.title === "string" ? body.title : "";
    if (!title.trim()) {
      return NextResponse.json({ error: "Title required" }, { status: 400 });
    }
    await updateSessionTitle(userId, id, title);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to rename session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
