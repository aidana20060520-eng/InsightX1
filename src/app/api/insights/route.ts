import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { buildWorkspaceContext } from "@/lib/notion-context";
import { generateJson } from "@/lib/gemini";

export const runtime = "nodejs";

export interface GeneratedInsight {
  id: string;
  type: "opportunity" | "warning" | "success";
  title: string;
  description: string;
  confidence: number;
  impact: "high" | "medium" | "low";
  metric: string;
}

const SYSTEM_PROMPT = `You are InsightX, an AI that analyzes a user's Notion workspace and surfaces useful observations.

Given the workspace context, generate 4-6 actionable insights as a JSON array. Each insight should be:
- Grounded in the actual data (page counts, edit patterns, stale pages, peak day, databases).
- Concrete and specific — reference actual numbers or page titles when possible.
- Honest — if data is limited, say so rather than fabricate.

Return ONLY valid JSON, no prose. Shape:
{
  "insights": [
    {
      "type": "opportunity" | "warning" | "success",
      "title": "short headline (max 8 words)",
      "description": "1-2 sentence explanation grounded in their data",
      "confidence": 65-95 (integer, your confidence in this insight),
      "impact": "high" | "medium" | "low",
      "metric": "tiny stat like '12 stale pages' or 'Thursday peaks' (max 5 words)"
    }
  ]
}

Rules:
- "opportunity" = a chance to improve
- "warning" = something they should address
- "success" = positive pattern to reinforce
- Never invent page titles or numbers not in the context.
- If the workspace is very small or new, generate fewer (2-3) thoughtful insights rather than padding.
- Vary the types — don't return all warnings.`;

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    const ctx = await buildWorkspaceContext(userId);

    if (!ctx.connected) {
      return NextResponse.json({
        connected: false,
        insights: [],
      });
    }

    // If workspace is empty, return a single welcome insight rather than calling LLM
    if (!ctx.stats || ctx.stats.pages === 0) {
      return NextResponse.json({
        connected: true,
        workspace: ctx.workspace,
        insights: [
          {
            id: "empty-1",
            type: "warning",
            title: "No pages found yet",
            description:
              "Your workspace is connected, but no pages are accessible. Make sure you shared pages with the integration during Notion OAuth, then click Sync Notion.",
            confidence: 99,
            impact: "high",
            metric: "0 pages",
          },
        ],
      });
    }

    const userPrompt = `Here is the workspace context:\n\n${ctx.text}\n\nGenerate insights now.`;

    let result: { insights: Omit<GeneratedInsight, "id">[] };
    try {
      result = await generateJson<{
        insights: Omit<GeneratedInsight, "id">[];
      }>(SYSTEM_PROMPT, userPrompt);
    } catch (err) {
      console.error("Gemini insights generation failed:", err);
      return NextResponse.json(
        {
          connected: true,
          workspace: ctx.workspace,
          insights: deterministicFallback(ctx),
          fallback: true,
        },
        { status: 200 }
      );
    }

    const insights: GeneratedInsight[] = (result.insights || []).map(
      (insight, i) => ({
        id: `ai-${Date.now()}-${i}`,
        type: insight.type ?? "opportunity",
        title: insight.title ?? "Untitled insight",
        description: insight.description ?? "",
        confidence: Math.max(
          50,
          Math.min(99, Math.round(insight.confidence ?? 75))
        ),
        impact: insight.impact ?? "medium",
        metric: insight.metric ?? "",
      })
    );

    return NextResponse.json({
      connected: true,
      workspace: ctx.workspace,
      insights,
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to generate insights";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Deterministic fallback if the LLM call fails (rate-limit, network, etc.).
function deterministicFallback(
  ctx: Awaited<ReturnType<typeof buildWorkspaceContext>>
): GeneratedInsight[] {
  const out: GeneratedInsight[] = [];
  const s = ctx.stats!;
  if (s.editedThisWeek > 5) {
    out.push({
      id: "f1",
      type: "success",
      title: "Strong week of activity",
      description: `You edited ${s.editedThisWeek} pages in the last 7 days — momentum is high.`,
      confidence: 90,
      impact: "medium",
      metric: `${s.editedThisWeek} edits`,
    });
  }
  if (s.stale > 5) {
    out.push({
      id: "f2",
      type: "warning",
      title: `${s.stale} pages going stale`,
      description: `Pages untouched for 30+ days are cluttering your search. A short cleanup will sharpen everything.`,
      confidence: 85,
      impact: "medium",
      metric: `${s.stale} stale`,
    });
  }
  if (s.databases === 0 && s.pages > 0) {
    out.push({
      id: "f3",
      type: "opportunity",
      title: "Add a task database",
      description:
        "Without a database to track tasks, I can't surface velocity, completion, or blockers. Create one and re-sync.",
      confidence: 80,
      impact: "high",
      metric: "0 databases",
    });
  }
  if (out.length === 0) {
    out.push({
      id: "f0",
      type: "success",
      title: "Workspace is healthy",
      description:
        "I didn't spot anything pressing. As you create and edit pages, I'll surface patterns over time.",
      confidence: 75,
      impact: "low",
      metric: `${s.pages} pages`,
    });
  }
  return out;
}
