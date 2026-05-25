import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getCurrentUserId } from "@/lib/auth";
import { generateText } from "@/lib/gemini";

export const runtime = "nodejs";

const INSIGHTS_SYSTEM_PROMPT = `You are InsightX, an AI assistant analyzing a user's Notion workspace.
Write a warm, 2-3 sentence opening summary that:
- References their workspace name and concrete numbers from the stats.
- Highlights ONE notable pattern (high activity, lots of stale pages, strong momentum, quiet week, etc.).
- Feels personal and observational, not generic.
Use Markdown bold (**like this**) for key numbers and names. No headings, no lists, no fluff.`;

/**
 * GET /api/notion/insights
 *
 * Returns "instant value" — quick AI-style analysis of the user's synced
 * Notion workspace. This is computed deterministically from the synced data
 * so the user sees real numbers within seconds of connecting.
 *
 * When OpenAI is wired up later, swap the deterministic strings for an
 * LLM call that ingests the same shape of data.
 */
export async function GET() {
  try {
    const userId = await getCurrentUserId();
    const supabase = getSupabaseAdmin();

    const { data: connection } = await supabase
      .from("notion_connections")
      .select("id, workspace_name, pages_synced, databases_synced, last_sync_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!connection) {
      return NextResponse.json(
        { error: "No Notion connection found." },
        { status: 404 }
      );
    }

    // Pull pages + databases for analysis
    const [pagesRes, databasesRes] = await Promise.all([
      supabase
        .from("notion_pages")
        .select(
          "title, parent_type, archived, notion_created_at, notion_last_edited_at"
        )
        .eq("connection_id", connection.id),
      supabase
        .from("notion_databases")
        .select("title, archived, notion_last_edited_at, properties")
        .eq("connection_id", connection.id),
    ]);

    const pages = pagesRes.data || [];
    const databases = databasesRes.data || [];

    // ---- Pattern detection (deterministic; replace with LLM later) ----
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    const activePages = pages.filter((p) => !p.archived);
    const editedThisWeek = activePages.filter(
      (p) =>
        p.notion_last_edited_at &&
        now - new Date(p.notion_last_edited_at).getTime() < 7 * day
    );
    const staleOver30d = activePages.filter(
      (p) =>
        p.notion_last_edited_at &&
        now - new Date(p.notion_last_edited_at).getTime() > 30 * day
    );
    const createdLast30d = activePages.filter(
      (p) =>
        p.notion_created_at &&
        now - new Date(p.notion_created_at).getTime() < 30 * day
    );

    // Most active day of week
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
    const peakDayIdx = dayCount.indexOf(Math.max(...dayCount));
    const peakDay = dayCount[peakDayIdx] > 0 ? dayNames[peakDayIdx] : null;

    const activeDatabases = databases.filter((d) => !d.archived);

    // ---- Summary text (LLM-generated with deterministic fallback) ----
    const ws = connection.workspace_name || "your workspace";

    const deterministicSummary =
      activePages.length === 0
        ? `I've connected to **${ws}**, but I couldn't find any pages yet. Make sure you shared the pages you want me to analyze when you authorized the integration — then run a sync to pull them in.`
        : `I've analyzed **${activePages.length} pages** and **${activeDatabases.length} databases** across **${ws}**.\n\nYou've been **${editedThisWeek.length > 5 ? "very active" : editedThisWeek.length > 0 ? "active" : "quiet"} this week** with ${editedThisWeek.length} pages updated. ${createdLast30d.length > 0 ? `You created ${createdLast30d.length} new pages in the last 30 days — strong momentum.` : ""}`;

    let summary = deterministicSummary;
    if (activePages.length > 0 && process.env.GEMINI_API_KEY) {
      try {
        const userPrompt = `Workspace: "${ws}"
Active pages: ${activePages.length}
Active databases: ${activeDatabases.length}
Pages edited in last 7 days: ${editedThisWeek.length}
Pages created in last 30 days: ${createdLast30d.length}
Stale pages (no edits in 30+ days): ${staleOver30d.length}
${peakDay ? `Peak activity day: ${peakDay} (${dayCount[peakDayIdx]} edits)` : ""}

Write the summary now.`;
        const aiSummary = await generateText(
          INSIGHTS_SYSTEM_PROMPT,
          userPrompt
        );
        if (aiSummary && aiSummary.trim().length > 20) {
          summary = aiSummary.trim();
        }
      } catch (err) {
        // Fall back silently to deterministic summary on LLM errors
        console.warn("Gemini summary failed:", err);
      }
    }

    // ---- Patterns ----
    const patterns: Array<{ title: string; insight: string; icon: string }> = [];

    if (peakDay) {
      patterns.push({
        title: `Most productive on ${peakDay}s`,
        insight: `${dayCount[peakDayIdx]} of your page edits happen on ${peakDay}s. Consider blocking that day for deep work.`,
        icon: "calendar",
      });
    }

    if (staleOver30d.length > 0) {
      patterns.push({
        title: `${staleOver30d.length} pages going stale`,
        insight: `These haven't been touched in 30+ days. Worth a quick review — archive what's done, revive what still matters.`,
        icon: "archive",
      });
    }

    if (activeDatabases.length > 0) {
      patterns.push({
        title: `${activeDatabases.length} databases tracked`,
        insight: `I'll watch for changes and surface insights from these automatically — task velocity, completion patterns, and blockers.`,
        icon: "database",
      });
    }

    if (editedThisWeek.length > 10) {
      patterns.push({
        title: "High velocity this week",
        insight: `${editedThisWeek.length} pages edited — you're moving fast. I'll keep an eye on quality vs. quantity.`,
        icon: "trending-up",
      });
    }

    // Fallback patterns if not enough data
    while (patterns.length < 3) {
      const fallbacks = [
        {
          title: "I'm learning your patterns",
          insight:
            "The more I see, the smarter my insights get. Sync again in a few days for richer analysis.",
          icon: "sparkles",
        },
        {
          title: "Workspace structure looks clean",
          insight:
            "Your page hierarchy is well-organized — that makes my analysis more accurate.",
          icon: "layers",
        },
      ];
      const next = fallbacks.find((f) => !patterns.find((p) => p.title === f.title));
      if (!next) break;
      patterns.push(next);
    }

    // ---- Recommendations ----
    const recommendations: Array<{
      title: string;
      description: string;
      impact: "high" | "medium" | "low";
      action: string;
    }> = [];

    if (staleOver30d.length > 5) {
      recommendations.push({
        title: `Archive or revive ${staleOver30d.length} stale pages`,
        description: `Pages untouched for 30+ days clutter your workspace and slow your search. A 10-minute cleanup will sharpen everything.`,
        impact: "medium",
        action: "Review stale pages",
      });
    }

    if (peakDay) {
      recommendations.push({
        title: `Block ${peakDay}s for deep work`,
        description: `Your output is highest on ${peakDay}s. Auto-decline meetings on that day to compound your strongest output.`,
        impact: "high",
        action: "Set focus day",
      });
    }

    if (activeDatabases.length === 0 && activePages.length > 0) {
      recommendations.push({
        title: "Add a task database",
        description:
          "I can track velocity, completion rate, and blockers across projects — but I need a database with tasks to do it. Create one and re-sync.",
        impact: "high",
        action: "Learn how",
      });
    }

    recommendations.push({
      title: "Get weekly AI reports",
      description:
        "Every Monday at 8 AM, I'll send a summary of last week's wins, blockers, and patterns. Two minutes to read, hours of clarity.",
      impact: "medium",
      action: "Enable weekly digest",
    });

    return NextResponse.json({
      workspace: ws,
      stats: {
        pages: activePages.length,
        databases: activeDatabases.length,
        editedThisWeek: editedThisWeek.length,
        createdLast30d: createdLast30d.length,
        stale: staleOver30d.length,
      },
      summary,
      patterns: patterns.slice(0, 4),
      recommendations: recommendations.slice(0, 3),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to compute insights";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
