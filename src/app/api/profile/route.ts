import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import {
  getUserProfile,
  upsertUserProfile,
  type ProfileInput,
} from "@/lib/user-profile";

export const runtime = "nodejs";

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    const profile = await getUserProfile(userId);
    return NextResponse.json({ profile });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    const body = (await req.json()) as ProfileInput;

    if (
      body.preferredTone &&
      !["friendly", "concise", "professional"].includes(body.preferredTone)
    ) {
      return NextResponse.json(
        { error: "Invalid preferredTone" },
        { status: 400 }
      );
    }

    const profile = await upsertUserProfile(userId, body);
    return NextResponse.json({ profile });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to save profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
