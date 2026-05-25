import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getCurrentUserId } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * GET /api/notion/status
 * Returns the current Notion connection state for the authenticated user.
 */
export async function GET() {
  try {
    const userId = await getCurrentUserId();
    const supabase = getSupabaseAdmin();

    const { data: connection, error } = await supabase
      .from("notion_connections")
      .select(
        "id, workspace_id, workspace_name, workspace_icon, status, last_sync_at, last_error, pages_synced, databases_synced, created_at"
      )
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!connection) {
      return NextResponse.json({ connected: false });
    }

    // Last sync run for richer detail
    const { data: lastRun } = await supabase
      .from("notion_sync_runs")
      .select(
        "started_at, finished_at, status, pages_added, pages_updated, databases_added, databases_updated, error_message"
      )
      .eq("connection_id", connection.id)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({
      connected: true,
      connection,
      lastRun,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Status failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
