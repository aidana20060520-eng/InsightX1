import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { syncNotionConnection } from "@/lib/notion-sync";

/**
 * Scheduled Notion re-sync.
 *
 * Triggered by Vercel Cron (see vercel.json). Walks every connected
 * Notion workspace whose last successful sync is older than the
 * staleness threshold, and runs an incremental sync against it. Failures
 * for one user never block the rest.
 *
 * Auth: Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`. We also
 * accept `?secret=<CRON_SECRET>` as a fallback for manual triggering.
 */

export const runtime = "nodejs";
export const maxDuration = 60; // upper bound for the entire batch

// Re-sync any connection that hasn't synced in this many minutes
const STALENESS_MINUTES = 60 * 4; // 4 hours

// Hard cap so a slow user doesn't starve the others
const MAX_CONNECTIONS_PER_RUN = 25;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured on the server." },
      { status: 500 }
    );
  }

  const auth = req.headers.get("authorization") || "";
  const tokenFromHeader = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  const url = new URL(req.url);
  const tokenFromQuery = url.searchParams.get("secret");
  const provided = tokenFromHeader || tokenFromQuery;

  if (provided !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const cutoff = new Date(
    Date.now() - STALENESS_MINUTES * 60 * 1000
  ).toISOString();

  // Pull connections that are connected and either never synced or
  // synced before the cutoff. Order by oldest first so nothing starves.
  const { data: connections, error } = await supabase
    .from("notion_connections")
    .select("id, user_id, workspace_name, last_sync_at")
    .eq("status", "connected")
    .or(`last_sync_at.is.null,last_sync_at.lt.${cutoff}`)
    .order("last_sync_at", { ascending: true, nullsFirst: true })
    .limit(MAX_CONNECTIONS_PER_RUN);

  if (error) {
    console.error("[cron/notion-sync] query failed:", error);
    return NextResponse.json(
      { error: "query_failed", detail: error.message },
      { status: 500 }
    );
  }

  const results: Array<{
    connectionId: string;
    ok: boolean;
    error?: string;
  }> = [];

  for (const conn of connections || []) {
    try {
      await syncNotionConnection(conn.id);
      results.push({ connectionId: conn.id, ok: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown error";
      console.error(
        `[cron/notion-sync] sync failed for ${conn.id}:`,
        e
      );
      results.push({ connectionId: conn.id, ok: false, error: msg });
    }
  }

  const ok = results.filter((r) => r.ok).length;
  const failed = results.length - ok;

  return NextResponse.json({
    ok: true,
    scanned: connections?.length || 0,
    succeeded: ok,
    failed,
    results,
  });
}
