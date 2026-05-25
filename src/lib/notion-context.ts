import { getSupabaseAdmin } from "./supabase-admin";

/**
 * Build a compact, LLM-friendly summary of a user's synced Notion workspace.
 *
 * Goals:
 *  - Stay under ~2,000 tokens so it's cheap to include as context.
 *  - Surface signal (recent activity, stale work, structure), not raw dumps.
 *  - Be useful as `systemInstruction` extra context for chat answers.
 */
export interface WorkspaceContext {
  connected: boolean;
  workspace?: string;
  stats?: {
    pages: number;
    databases: number;
    editedThisWeek: number;
    createdLast30d: number;
    stale: number;
  };
  /** Concatenated multi-line string ready to embed in a system prompt. */
  text: string;
}

const DAY = 24 * 60 * 60 * 1000;

export async function buildWorkspaceContext(
  userId: string
): Promise<WorkspaceContext> {
  const supabase = getSupabaseAdmin();

  const { data: connection } = await supabase
    .from("notion_connections")
    .select(
      "id, workspace_name, pages_synced, databases_synced, last_sync_at"
    )
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!connection) {
    return {
      connected: false,
      text:
        "The user has NOT connected their Notion workspace yet. Encourage them to connect via Settings to unlock real insights about their workspace.",
    };
  }

  const [pagesRes, databasesRes] = await Promise.all([
    supabase
      .from("notion_pages")
      .select(
        "title, parent_type, archived, notion_created_at, notion_last_edited_at"
      )
      .eq("connection_id", connection.id),
    supabase
      .from("notion_databases")
      .select("title, archived, notion_last_edited_at")
      .eq("connection_id", connection.id),
  ]);

  const pages = pagesRes.data || [];
  const databases = databasesRes.data || [];
  const now = Date.now();

  const activePages = pages.filter((p) => !p.archived);
  const activeDatabases = databases.filter((d) => !d.archived);

  const editedThisWeek = activePages.filter(
    (p) =>
      p.notion_last_edited_at &&
      now - new Date(p.notion_last_edited_at).getTime() < 7 * DAY
  );
  const createdLast30d = activePages.filter(
    (p) =>
      p.notion_created_at &&
      now - new Date(p.notion_created_at).getTime() < 30 * DAY
  );
  const stale = activePages.filter(
    (p) =>
      p.notion_last_edited_at &&
      now - new Date(p.notion_last_edited_at).getTime() > 30 * DAY
  );

  // Peak day-of-week
  const dayCount = Array(7).fill(0);
  for (const p of activePages) {
    if (p.notion_last_edited_at) {
      dayCount[new Date(p.notion_last_edited_at).getDay()] += 1;
    }
  }
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const peakIdx = dayCount.indexOf(Math.max(...dayCount));
  const peakDay = dayCount[peakIdx] > 0 ? dayNames[peakIdx] : null;

  // Top 10 most recently edited pages
  const recentPages = [...activePages]
    .filter((p) => p.notion_last_edited_at)
    .sort(
      (a, b) =>
        new Date(b.notion_last_edited_at as string).getTime() -
        new Date(a.notion_last_edited_at as string).getTime()
    )
    .slice(0, 10);

  // Top 8 staleest pages
  const stalest = [...stale]
    .sort(
      (a, b) =>
        new Date(a.notion_last_edited_at as string).getTime() -
        new Date(b.notion_last_edited_at as string).getTime()
    )
    .slice(0, 8);

  const ws = connection.workspace_name || "the user's workspace";
  const lastSync = connection.last_sync_at
    ? new Date(connection.last_sync_at as string).toISOString()
    : "never";

  const lines: string[] = [];
  lines.push(`WORKSPACE CONTEXT (synced ${lastSync})`);
  lines.push(`Workspace name: ${ws}`);
  lines.push(
    `Stats: ${activePages.length} active pages, ${activeDatabases.length} databases.`
  );
  lines.push(
    `Activity: ${editedThisWeek.length} pages edited in the past 7 days, ${createdLast30d.length} created in the past 30 days, ${stale.length} stale (no edits in 30+ days).`
  );
  if (peakDay) {
    lines.push(
      `Peak activity day: ${peakDay} (${dayCount[peakIdx]} edits historically).`
    );
  }
  if (activeDatabases.length > 0) {
    lines.push(
      `Databases: ${activeDatabases
        .slice(0, 8)
        .map((d) => d.title)
        .filter(Boolean)
        .join(", ")}`
    );
  }
  if (recentPages.length > 0) {
    lines.push(`Recently edited pages:`);
    for (const p of recentPages) {
      const daysAgo = Math.floor(
        (now - new Date(p.notion_last_edited_at as string).getTime()) / DAY
      );
      lines.push(
        `  - "${p.title || "(untitled)"}" (${daysAgo === 0 ? "today" : `${daysAgo}d ago`})`
      );
    }
  }
  if (stalest.length > 0) {
    lines.push(`Stale pages worth reviewing:`);
    for (const p of stalest) {
      const daysAgo = Math.floor(
        (now - new Date(p.notion_last_edited_at as string).getTime()) / DAY
      );
      lines.push(`  - "${p.title || "(untitled)"}" (${daysAgo}d idle)`);
    }
  }

  return {
    connected: true,
    workspace: ws,
    stats: {
      pages: activePages.length,
      databases: activeDatabases.length,
      editedThisWeek: editedThisWeek.length,
      createdLast30d: createdLast30d.length,
      stale: stale.length,
    },
    text: lines.join("\n"),
  };
}
