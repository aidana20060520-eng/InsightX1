import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getCurrentUserId } from "@/lib/auth";

export const runtime = "nodejs";

const DAY = 24 * 60 * 60 * 1000;
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface Page {
  notion_id: string;
  parent_id: string | null;
  parent_type: string | null;
  title: string | null;
  archived: boolean;
  notion_created_at: string | null;
  notion_last_edited_at: string | null;
}

interface Database {
  notion_id: string;
  title: string | null;
  archived: boolean;
  notion_last_edited_at: string | null;
}

function daysAgo(iso: string | null, now: number): number {
  if (!iso) return Infinity;
  return Math.floor((now - new Date(iso).getTime()) / DAY);
}

function computeOverviewCards(
  pages: Page[],
  databases: Database[],
  now: number
) {
  const active = pages.filter((p) => !p.archived);
  const editedThisWeek = active.filter(
    (p) => daysAgo(p.notion_last_edited_at, now) < 7
  ).length;
  const editedLastWeek = active.filter((p) => {
    const d = daysAgo(p.notion_last_edited_at, now);
    return d >= 7 && d < 14;
  }).length;

  const createdThisMonth = active.filter(
    (p) => daysAgo(p.notion_created_at, now) < 30
  ).length;
  const createdLastMonth = active.filter((p) => {
    const d = daysAgo(p.notion_created_at, now);
    return d >= 30 && d < 60;
  }).length;

  const stale = active.filter(
    (p) => daysAgo(p.notion_last_edited_at, now) > 30
  ).length;

  // Productivity score: blend of recent edits and content creation
  const productivityScore = Math.min(
    100,
    Math.round(
      (editedThisWeek * 4 + createdThisMonth * 1.5) /
        Math.max(1, active.length * 0.15)
    )
  );

  const weekDelta = editedThisWeek - editedLastWeek;
  const monthDelta = createdThisMonth - createdLastMonth;

  const formatDelta = (n: number, suffix = "") => {
    if (n === 0) return "0";
    return `${n > 0 ? "+" : ""}${n}${suffix}`;
  };

  return [
    {
      label: "Productivity Score",
      value: String(productivityScore),
      change:
        weekDelta === 0
          ? "no change"
          : weekDelta > 0
            ? `+${weekDelta} edits`
            : `${weekDelta} edits`,
      trend: weekDelta >= 0 ? ("up" as const) : ("down" as const),
      icon: "trendingUp",
      hint: "vs. last week",
    },
    {
      label: "Pages Edited",
      value: String(editedThisWeek),
      change: formatDelta(weekDelta),
      trend: weekDelta >= 0 ? ("up" as const) : ("down" as const),
      icon: "brain",
      hint: "this week",
    },
    {
      label: "Pages Created",
      value: String(createdThisMonth),
      change: formatDelta(monthDelta),
      trend: monthDelta >= 0 ? ("up" as const) : ("down" as const),
      icon: "checkCircle",
      hint: "this month",
    },
    {
      label: "Stale Pages",
      value: String(stale),
      change: stale > 5 ? "review needed" : "looks good",
      trend: stale > 5 ? ("down" as const) : ("up" as const),
      icon: "clock",
      hint: "30+ days idle",
    },
  ];
}

function computeProductivityTrends(pages: Page[], now: number) {
  // 7-day series of edits per day
  const days7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now - (6 - i) * DAY);
    return {
      day: DAY_NAMES[d.getDay()],
      tasks: 0,
      focus: 0,
    };
  });

  for (const p of pages) {
    if (!p.notion_last_edited_at || p.archived) continue;
    const editedTs = new Date(p.notion_last_edited_at).getTime();
    const ago = Math.floor((now - editedTs) / DAY);
    if (ago < 7) {
      const bucket = 6 - ago;
      days7[bucket].tasks += 1;
      // Estimate "focus hours" from edit volume: every 3 edits ≈ 1 hour
      days7[bucket].focus = +(days7[bucket].tasks / 3).toFixed(1);
    }
  }

  // 30-day series
  const days30 = Array.from({ length: 30 }, (_, i) => ({
    day: String(i + 1),
    tasks: 0,
    focus: 0,
  }));
  for (const p of pages) {
    if (!p.notion_last_edited_at || p.archived) continue;
    const ago = Math.floor(
      (now - new Date(p.notion_last_edited_at).getTime()) / DAY
    );
    if (ago < 30) {
      const bucket = 29 - ago;
      days30[bucket].tasks += 1;
      days30[bucket].focus = +(days30[bucket].tasks / 3).toFixed(1);
    }
  }

  // 90-day series, grouped by week
  const weeks90 = Array.from({ length: 12 }, (_, i) => ({
    day: `W${i + 1}`,
    tasks: 0,
    focus: 0,
  }));
  for (const p of pages) {
    if (!p.notion_last_edited_at || p.archived) continue;
    const ago = Math.floor(
      (now - new Date(p.notion_last_edited_at).getTime()) / DAY
    );
    if (ago < 84) {
      const weekIdx = 11 - Math.floor(ago / 7);
      if (weekIdx >= 0 && weekIdx < 12) {
        weeks90[weekIdx].tasks += 1;
        weeks90[weekIdx].focus = +(weeks90[weekIdx].tasks / 3).toFixed(1);
      }
    }
  }

  return {
    "7D": days7,
    "30D": days30,
    "90D": weeks90,
  };
}

function computeFocusScore(pages: Page[], now: number) {
  const active = pages.filter((p) => !p.archived);
  if (active.length === 0) {
    return {
      score: 0,
      breakdown: [
        { label: "Deep work", value: 0, color: "#818cf8" },
        { label: "Consistency", value: 0, color: "#a78bfa" },
        { label: "Freshness", value: 0, color: "#c084fc" },
      ],
    };
  }

  // Deep work: ratio of edits this week to total active pages (capped)
  const editedThisWeek = active.filter(
    (p) => daysAgo(p.notion_last_edited_at, now) < 7
  ).length;
  const deepWork = Math.min(100, Math.round((editedThisWeek / Math.max(1, active.length * 0.15)) * 100));

  // Consistency: how many distinct days in last 7 had at least one edit
  const dayBuckets = new Set<number>();
  for (const p of active) {
    if (!p.notion_last_edited_at) continue;
    const ago = Math.floor(
      (now - new Date(p.notion_last_edited_at).getTime()) / DAY
    );
    if (ago < 7) dayBuckets.add(ago);
  }
  const consistency = Math.round((dayBuckets.size / 7) * 100);

  // Freshness: inverse of stale ratio
  const stale = active.filter(
    (p) => daysAgo(p.notion_last_edited_at, now) > 30
  ).length;
  const freshness = Math.max(
    0,
    Math.round((1 - stale / active.length) * 100)
  );

  const score = Math.round((deepWork + consistency + freshness) / 3);

  return {
    score,
    breakdown: [
      { label: "Deep work", value: deepWork, color: "#818cf8" },
      { label: "Consistency", value: consistency, color: "#a78bfa" },
      { label: "Freshness", value: freshness, color: "#c084fc" },
    ],
  };
}

function computeProjectHealth(
  pages: Page[],
  databases: Database[],
  now: number
) {
  // Treat top-level pages (parent_type = "workspace" or "page_id" with no parent in our set)
  // and databases as "projects". Pick up to 6 most-recently-edited.
  const projects: Array<{
    name: string;
    health: number;
    status: "healthy" | "at-risk" | "critical";
    tasks: { done: number; total: number };
    lastEditedAgo: number;
  }> = [];

  const candidates: Array<{
    notion_id: string;
    title: string | null;
    notion_last_edited_at: string | null;
  }> = [];

  // Top-level pages: parent_type === "workspace"
  for (const p of pages) {
    if (p.archived) continue;
    if (p.parent_type === "workspace") candidates.push(p);
  }
  // Active databases also count as projects
  for (const db of databases) {
    if (db.archived) continue;
    candidates.push(db);
  }

  candidates.sort((a, b) => {
    const ta = a.notion_last_edited_at
      ? new Date(a.notion_last_edited_at).getTime()
      : 0;
    const tb = b.notion_last_edited_at
      ? new Date(b.notion_last_edited_at).getTime()
      : 0;
    return tb - ta;
  });

  for (const c of candidates.slice(0, 6)) {
    const ago = daysAgo(c.notion_last_edited_at, now);

    // Children pages count as tasks
    const children = pages.filter(
      (p) =>
        !p.archived &&
        (p.parent_id === c.notion_id ||
          // Notion ids sometimes carry hyphens; do a loose match
          p.parent_id?.replace(/-/g, "") === c.notion_id.replace(/-/g, ""))
    );
    const totalTasks = children.length || 1;
    const recentlyEdited = children.filter(
      (p) => daysAgo(p.notion_last_edited_at, now) < 14
    ).length;

    // Health derived from how recently the project was touched + activity ratio
    let health = 100;
    if (ago > 30) health -= 50;
    else if (ago > 14) health -= 25;
    else if (ago > 7) health -= 10;
    if (children.length > 0) {
      health -= Math.round((1 - recentlyEdited / totalTasks) * 30);
    }
    health = Math.max(0, Math.min(100, health));

    const status: "healthy" | "at-risk" | "critical" =
      health >= 70 ? "healthy" : health >= 40 ? "at-risk" : "critical";

    projects.push({
      name: c.title || "Untitled",
      health,
      status,
      tasks: {
        done: recentlyEdited,
        total: totalTasks,
      },
      lastEditedAgo: ago,
    });
  }

  return projects;
}

function computeInsights(
  pages: Page[],
  databases: Database[],
  now: number
): Array<{
  id: string;
  type: "trend" | "warning" | "success" | "tip";
  title: string;
  description: string;
  time: string;
}> {
  const insights: ReturnType<typeof computeInsights> = [];
  const active = pages.filter((p) => !p.archived);

  // Most productive day of week
  const dayCount = Array(7).fill(0);
  for (const p of active) {
    if (p.notion_last_edited_at) {
      dayCount[new Date(p.notion_last_edited_at).getDay()] += 1;
    }
  }
  const max = Math.max(...dayCount);
  if (max > 0) {
    const peakIdx = dayCount.indexOf(max);
    const peakName = [
      "Sundays",
      "Mondays",
      "Tuesdays",
      "Wednesdays",
      "Thursdays",
      "Fridays",
      "Saturdays",
    ][peakIdx];
    const total = dayCount.reduce((a, b) => a + b, 0);
    const pct = Math.round((max / total) * 100);
    insights.push({
      id: "peak-day",
      type: "trend",
      title: `Productivity peaks on ${peakName}`,
      description: `${pct}% of your edits happen on ${peakName}. Consider time-blocking that day.`,
      time: "just now",
    });
  }

  // Stale pages warning
  const stale = active.filter(
    (p) => daysAgo(p.notion_last_edited_at, now) > 60
  );
  if (stale.length > 0) {
    insights.push({
      id: "stale",
      type: "warning",
      title: `${stale.length} pages stale 60+ days`,
      description: `Worth a review — archive what's done, revive what still matters.`,
      time: "today",
    });
  }

  // High velocity
  const editedThisWeek = active.filter(
    (p) => daysAgo(p.notion_last_edited_at, now) < 7
  ).length;
  if (editedThisWeek > 10) {
    insights.push({
      id: "velocity",
      type: "success",
      title: "Strong velocity this week",
      description: `${editedThisWeek} pages updated — you're moving fast.`,
      time: "this week",
    });
  } else if (editedThisWeek === 0 && active.length > 0) {
    insights.push({
      id: "quiet",
      type: "tip",
      title: "Quiet week so far",
      description: `No edits in the last 7 days. A small win today builds momentum.`,
      time: "this week",
    });
  }

  // Database tracking
  if (databases.filter((d) => !d.archived).length > 0) {
    insights.push({
      id: "databases",
      type: "tip",
      title: `Tracking ${databases.filter((d) => !d.archived).length} databases`,
      description: `I'll surface velocity and completion patterns from these automatically.`,
      time: "ongoing",
    });
  }

  return insights;
}

function computeRecommendations(
  pages: Page[],
  databases: Database[],
  now: number
) {
  const active = pages.filter((p) => !p.archived);
  const recs: Array<{
    id: string;
    title: string;
    description: string;
    impact: "high" | "medium" | "low";
    action: string;
  }> = [];

  const stale = active.filter(
    (p) => daysAgo(p.notion_last_edited_at, now) > 30
  );
  if (stale.length > 5) {
    recs.push({
      id: "rec-stale",
      title: `Archive or revive ${stale.length} stale pages`,
      description: `Pages untouched for 30+ days clutter your workspace. A short cleanup will sharpen everything.`,
      impact: "medium",
      action: "Review pages",
    });
  }

  // Peak day recommendation
  const dayCount = Array(7).fill(0);
  for (const p of active) {
    if (p.notion_last_edited_at)
      dayCount[new Date(p.notion_last_edited_at).getDay()] += 1;
  }
  const max = Math.max(...dayCount);
  if (max > 0) {
    const peakName = [
      "Sundays",
      "Mondays",
      "Tuesdays",
      "Wednesdays",
      "Thursdays",
      "Fridays",
      "Saturdays",
    ][dayCount.indexOf(max)];
    recs.push({
      id: "rec-peak-day",
      title: `Block ${peakName} for deep work`,
      description: `Your output is highest on ${peakName}. Auto-decline meetings then to compound your strongest output.`,
      impact: "high",
      action: "Set focus day",
    });
  }

  if (databases.filter((d) => !d.archived).length === 0 && active.length > 0) {
    recs.push({
      id: "rec-db",
      title: "Add a task database",
      description:
        "I can track velocity, completion rate, and blockers — but I need a database to do it. Create one in Notion and re-sync.",
      impact: "high",
      action: "Learn how",
    });
  }

  recs.push({
    id: "rec-digest",
    title: "Get weekly AI reports",
    description:
      "Every Monday I'll summarize last week's wins, blockers, and patterns. Two minutes to read, hours of clarity.",
    impact: "medium",
    action: "Enable digest",
  });

  return recs.slice(0, 3);
}

function computeWeeklySummary(
  pages: Page[],
  databases: Database[],
  now: number
) {
  const active = pages.filter((p) => !p.archived);
  const editedThisWeek = active.filter(
    (p) => daysAgo(p.notion_last_edited_at, now) < 7
  ).length;
  const editedLastWeek = active.filter((p) => {
    const d = daysAgo(p.notion_last_edited_at, now);
    return d >= 7 && d < 14;
  }).length;
  const createdThisWeek = active.filter(
    (p) => daysAgo(p.notion_created_at, now) < 7
  ).length;

  const stale = active.filter(
    (p) => daysAgo(p.notion_last_edited_at, now) > 30
  );

  const startOfWeek = new Date(now - 6 * DAY);
  const endOfWeek = new Date(now);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const weekDelta = editedThisWeek - editedLastWeek;

  const highlights = [
    {
      label: "Pages edited",
      value: String(editedThisWeek),
      change:
        weekDelta === 0 ? "0" : `${weekDelta > 0 ? "+" : ""}${weekDelta}`,
    },
    {
      label: "Pages created",
      value: String(createdThisWeek),
      change: "+",
    },
    {
      label: "Databases",
      value: String(databases.filter((d) => !d.archived).length),
      change: "active",
    },
    {
      label: "Stale pages",
      value: String(stale.length),
      change: stale.length > 5 ? "review" : "ok",
    },
  ];

  const wins: string[] = [];
  if (editedThisWeek > editedLastWeek && editedLastWeek > 0)
    wins.push(`Edits up ${weekDelta} vs. last week — momentum building`);
  if (createdThisWeek > 0)
    wins.push(`Created ${createdThisWeek} new pages this week`);
  if (active.length > 20)
    wins.push(`${active.length} pages and growing — strong knowledge base`);
  if (wins.length === 0) wins.push("Keep going — small wins compound");

  const opportunities: string[] = [];
  if (stale.length > 10)
    opportunities.push(`${stale.length} pages stale 30+ days — quick cleanup will help`);
  if (editedThisWeek === 0)
    opportunities.push(`No edits this week — a small update today restarts momentum`);
  if (databases.filter((d) => !d.archived).length === 0 && active.length > 5)
    opportunities.push(`No databases connected — add one to unlock task tracking`);
  if (opportunities.length === 0)
    opportunities.push("Nothing urgent — keep flowing");

  return {
    range: `${fmt(startOfWeek)} — ${fmt(endOfWeek)}`,
    highlights,
    wins: wins.slice(0, 3),
    opportunities: opportunities.slice(0, 3),
  };
}

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    const supabase = getSupabaseAdmin();

    const { data: connection } = await supabase
      .from("notion_connections")
      .select("id, workspace_name")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!connection) {
      return NextResponse.json({ connected: false });
    }

    const [pagesRes, databasesRes] = await Promise.all([
      supabase
        .from("notion_pages")
        .select(
          "notion_id, parent_id, parent_type, title, archived, notion_created_at, notion_last_edited_at"
        )
        .eq("connection_id", connection.id),
      supabase
        .from("notion_databases")
        .select(
          "notion_id, title, archived, notion_last_edited_at"
        )
        .eq("connection_id", connection.id),
    ]);

    const pages: Page[] = pagesRes.data || [];
    const databases: Database[] = databasesRes.data || [];
    const now = Date.now();

    return NextResponse.json({
      connected: true,
      workspace: connection.workspace_name || "Your workspace",
      overviewCards: computeOverviewCards(pages, databases, now),
      productivityTrends: computeProductivityTrends(pages, now),
      focusScore: computeFocusScore(pages, now),
      projectHealth: computeProjectHealth(pages, databases, now),
      insights: computeInsights(pages, databases, now),
      recommendations: computeRecommendations(pages, databases, now),
      weeklySummary: computeWeeklySummary(pages, databases, now),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to compute dashboard";
    console.error("Dashboard data error:", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
