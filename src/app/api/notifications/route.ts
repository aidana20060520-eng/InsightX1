import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  listNotifications,
  unreadCount,
  markAllRead,
  markRead,
} from "@/lib/notifications";

/**
 * GET  /api/notifications        → { items, unread }
 * POST /api/notifications/read   → mark all (or specific ids) as read
 *
 * The bell component polls GET every ~60s.
 */

export const runtime = "nodejs";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const [items, unread] = await Promise.all([
    listNotifications(userId, 20),
    unreadCount(userId),
  ]);
  return NextResponse.json(
    { items, unread },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { ids?: string[]; all?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    /* empty body = mark all */
    body = { all: true };
  }

  if (body.all || !body.ids || body.ids.length === 0) {
    await markAllRead(userId);
  } else {
    await markRead(userId, body.ids);
  }

  return NextResponse.json({ ok: true });
}
