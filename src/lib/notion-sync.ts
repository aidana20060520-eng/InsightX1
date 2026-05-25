import { Client, isFullPage, isFullDataSource } from "@notionhq/client";
import { getSupabaseAdmin } from "./supabase-admin";
import { decrypt } from "./crypto";
import { createNotification } from "./notifications";

interface NotionConnectionRow {
  id: string;
  user_id: string;
  workspace_id: string;
  workspace_name: string | null;
  access_token_encrypted: string;
  last_sync_at: string | null;
}

export interface SyncOptions {
  /** 'manual' = user clicked Sync, bypass dedupe so they see feedback. 'cron' = scheduled, dedupe normally. */
  source?: "manual" | "cron";
}

type RichTextLike = Array<{ plain_text?: string }> | undefined;

function joinTitle(parts: RichTextLike): string {
  if (!Array.isArray(parts)) return "";
  return parts
    .map((p) => p?.plain_text || "")
    .join("")
    .trim();
}

function extractIcon(icon: unknown): string | null {
  if (!icon || typeof icon !== "object") return null;
  const i = icon as { type?: string; emoji?: string; external?: { url?: string }; file?: { url?: string } };
  if (i.type === "emoji") return i.emoji ?? null;
  if (i.type === "external") return i.external?.url ?? null;
  if (i.type === "file") return i.file?.url ?? null;
  return null;
}

function extractParent(parent: unknown): { id: string | null; type: string | null } {
  if (!parent || typeof parent !== "object") return { id: null, type: null };
  const p = parent as Record<string, string | undefined>;
  const type = (p.type as string) || null;
  const id =
    (p.page_id as string) ||
    (p.database_id as string) ||
    (p.workspace as unknown as string) ||
    (p.block_id as string) ||
    null;
  return { id, type };
}

interface SyncResult {
  pagesAdded: number;
  pagesUpdated: number;
  databasesAdded: number;
  databasesUpdated: number;
  totalPages: number;
  totalDatabases: number;
}

/**
 * Run an incremental sync for a Notion connection.
 * Uses the `last_sync_at` timestamp to filter pages/databases that have been
 * edited since the last successful sync.
 */
export async function syncNotionConnection(
  connectionId: string,
  options: SyncOptions = {}
): Promise<SyncResult> {
  const supabase = getSupabaseAdmin();
  const isManual = options.source === "manual";

  // Load connection
  const { data: conn, error: connError } = await supabase
    .from("notion_connections")
    .select("id, user_id, workspace_id, workspace_name, access_token_encrypted, last_sync_at")
    .eq("id", connectionId)
    .single<NotionConnectionRow>();

  if (connError || !conn) {
    throw new Error(
      `Connection ${connectionId} not found: ${connError?.message || "unknown"}`
    );
  }

  // Mark syncing
  await supabase
    .from("notion_connections")
    .update({ status: "syncing", last_error: null })
    .eq("id", connectionId);

  // Open a sync run audit row
  const { data: run } = await supabase
    .from("notion_sync_runs")
    .insert({ connection_id: connectionId, status: "running" })
    .select("id")
    .single();

  let pagesAdded = 0;
  let pagesUpdated = 0;
  let databasesAdded = 0;
  let databasesUpdated = 0;
  let totalPages = 0;
  let totalDatabases = 0;

  try {
    const accessToken = decrypt(conn.access_token_encrypted);
    const notion = new Client({ auth: accessToken });

    const sinceIso = conn.last_sync_at; // null on first sync = full sync

    // Pull pages
    let pageCursor: string | undefined;
    do {
      const res = await notion.search({
        filter: { value: "page", property: "object" },
        sort: { direction: "descending", timestamp: "last_edited_time" },
        page_size: 50,
        start_cursor: pageCursor,
      });

      for (const result of res.results) {
        if (!isFullPage(result)) continue;

        // Incremental filter: stop early if older than last sync
        if (sinceIso && result.last_edited_time < sinceIso) {
          pageCursor = undefined;
          break;
        }

        totalPages += 1;

        // Extract title from properties
        let title = "";
        for (const prop of Object.values(result.properties)) {
          if (prop.type === "title") {
            title = joinTitle(prop.title as RichTextLike);
            break;
          }
        }

        const { id: parentId, type: parentType } = extractParent(result.parent);

        const row = {
          connection_id: connectionId,
          notion_id: result.id,
          parent_id: parentId,
          parent_type: parentType,
          title: title || "Untitled",
          url: result.url,
          icon: extractIcon(result.icon),
          archived: result.archived,
          metadata: {
            cover: result.cover,
            public_url: (result as unknown as { public_url?: string }).public_url ?? null,
          },
          notion_created_at: result.created_time,
          notion_last_edited_at: result.last_edited_time,
          synced_at: new Date().toISOString(),
        };

        const { data: existing } = await supabase
          .from("notion_pages")
          .select("id")
          .eq("connection_id", connectionId)
          .eq("notion_id", result.id)
          .maybeSingle();

        const { error: upsertErr } = await supabase
          .from("notion_pages")
          .upsert(row, { onConflict: "connection_id,notion_id" });

        if (!upsertErr) {
          if (existing) pagesUpdated += 1;
          else pagesAdded += 1;
        }
      }

      pageCursor = res.has_more ? res.next_cursor || undefined : undefined;
    } while (pageCursor);

    // Pull databases (now called "data sources" in Notion's 2025-09 API
    // change). A "database" object container can have multiple data
    // sources; the data source is the queryable backend with properties.
    // We persist these to `notion_databases` to keep our internal model
    // stable — from the user's perspective a data source IS the database
    // they care about.
    let dbCursor: string | undefined;
    do {
      const res = await notion.search({
        filter: { value: "data_source", property: "object" },
        sort: { direction: "descending", timestamp: "last_edited_time" },
        page_size: 50,
        start_cursor: dbCursor,
      });

      for (const result of res.results) {
        if (!isFullDataSource(result)) continue;

        if (sinceIso && result.last_edited_time < sinceIso) {
          dbCursor = undefined;
          break;
        }

        totalDatabases += 1;

        const title = joinTitle(result.title as RichTextLike);
        const { id: parentId, type: parentType } = extractParent(result.parent);

        const row = {
          connection_id: connectionId,
          notion_id: result.id,
          parent_id: parentId,
          parent_type: parentType,
          title: title || "Untitled database",
          url: result.url,
          icon: extractIcon(result.icon),
          // `archived` is deprecated in API 2026-03-11+; prefer `in_trash`.
          archived: result.in_trash ?? result.archived,
          properties: result.properties as unknown as Record<string, unknown>,
          notion_created_at: result.created_time,
          notion_last_edited_at: result.last_edited_time,
          synced_at: new Date().toISOString(),
        };

        const { data: existing } = await supabase
          .from("notion_databases")
          .select("id")
          .eq("connection_id", connectionId)
          .eq("notion_id", result.id)
          .maybeSingle();

        const { error: upsertErr } = await supabase
          .from("notion_databases")
          .upsert(row, { onConflict: "connection_id,notion_id" });

        if (!upsertErr) {
          if (existing) databasesUpdated += 1;
          else databasesAdded += 1;
        }
      }

      dbCursor = res.has_more ? res.next_cursor || undefined : undefined;
    } while (dbCursor);

    // Mark connection as synced
    const finishedAt = new Date().toISOString();
    await supabase
      .from("notion_connections")
      .update({
        status: "connected",
        last_sync_at: finishedAt,
        pages_synced: totalPages,
        databases_synced: totalDatabases,
        last_error: null,
      })
      .eq("id", connectionId);

    if (run?.id) {
      await supabase
        .from("notion_sync_runs")
        .update({
          finished_at: finishedAt,
          status: "success",
          pages_added: pagesAdded,
          pages_updated: pagesUpdated,
          databases_added: databasesAdded,
          databases_updated: databasesUpdated,
        })
        .eq("id", run.id);
    }

    // Notify the user. Manual syncs always notify (the user expects feedback).
    // Background/cron syncs only notify when something actually changed, so we
    // don't bother people daily with "nothing new" messages.
    const totalChanges =
      pagesAdded + pagesUpdated + databasesAdded + databasesUpdated;
    if (isManual || totalChanges > 0) {
      const ws = conn.workspace_name || "your Notion workspace";
      const summaryParts: string[] = [];
      if (pagesAdded > 0) summaryParts.push(`${pagesAdded} new page${pagesAdded === 1 ? "" : "s"}`);
      if (pagesUpdated > 0) summaryParts.push(`${pagesUpdated} updated`);
      if (databasesAdded > 0)
        summaryParts.push(`${databasesAdded} new database${databasesAdded === 1 ? "" : "s"}`);
      const summary =
        summaryParts.length > 0 ? summaryParts.join(" \u00B7 ") : "No changes since last sync";
      // Fire-and-forget — never block the sync return on notification write
      void createNotification({
        userId: conn.user_id,
        type: "sync_complete",
        title: `${ws} synced`,
        body: summary,
        link: "/dashboard",
        force: isManual,
      });
    }

    return {
      pagesAdded,
      pagesUpdated,
      databasesAdded,
      databasesUpdated,
      totalPages,
      totalDatabases,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown sync error";
    await supabase
      .from("notion_connections")
      .update({ status: "error", last_error: message })
      .eq("id", connectionId);

    if (run?.id) {
      await supabase
        .from("notion_sync_runs")
        .update({
          finished_at: new Date().toISOString(),
          status: "error",
          error_message: message,
          pages_added: pagesAdded,
          pages_updated: pagesUpdated,
          databases_added: databasesAdded,
          databases_updated: databasesUpdated,
        })
        .eq("id", run.id);
    }

    // Notify the user about the failure. Always non-blocking.
    if (conn?.user_id) {
      const ws = conn.workspace_name || "your Notion workspace";
      void createNotification({
        userId: conn.user_id,
        type: "sync_error",
        title: `Couldn't sync ${ws}`,
        body:
          "Try reconnecting Notion from Settings. If it keeps failing, contact us through the Contact page.",
        link: "/settings",
        force: isManual,
      });
    }

    throw e;
  }
}
