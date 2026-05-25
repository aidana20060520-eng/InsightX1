import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { syncNotionConnection } from "@/lib/notion-sync";
import { getCurrentUserId } from "@/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/notion/sync?connectionId=...
 * Triggers an incremental sync for the user's Notion connection.
 * If `connectionId` is omitted, syncs the user's first/most-recent connection.
 */
export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    const supabase = getSupabaseAdmin();
    const url = new URL(req.url);
    const connectionId = url.searchParams.get("connectionId");

    let connection: { id: string } | null;
    if (connectionId) {
      const { data } = await supabase
        .from("notion_connections")
        .select("id")
        .eq("id", connectionId)
        .eq("user_id", userId)
        .maybeSingle();
      connection = data;
    } else {
      const { data } = await supabase
        .from("notion_connections")
        .select("id")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      connection = data;
    }

    if (!connection) {
      return NextResponse.json(
        { error: "No Notion connection found." },
        { status: 404 }
      );
    }

    const result = await syncNotionConnection(connection.id);
    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Sync failed";
    console.error("Notion sync error:", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
