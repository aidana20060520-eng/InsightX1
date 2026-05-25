import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getCurrentUserId } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * POST /api/notion/disconnect
 * Removes the user's Notion connection (cascades to pages/databases/tasks).
 */
export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    const supabase = getSupabaseAdmin();
    const url = new URL(req.url);
    const connectionId = url.searchParams.get("connectionId");

    let query = supabase.from("notion_connections").delete().eq("user_id", userId);
    if (connectionId) query = query.eq("id", connectionId);

    const { error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Disconnect failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
