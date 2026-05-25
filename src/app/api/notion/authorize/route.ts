import { NextResponse } from "next/server";
import crypto from "crypto";
import { cookies } from "next/headers";

export const runtime = "nodejs";

/**
 * Step 1 of Notion OAuth: redirect the user to Notion's authorization page.
 * https://developers.notion.com/docs/authorization
 */
export async function GET() {
  const clientId = process.env.NOTION_CLIENT_ID;
  const redirectUri = process.env.NOTION_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      {
        error:
          "Missing NOTION_CLIENT_ID or NOTION_REDIRECT_URI in environment.",
      },
      { status: 500 }
    );
  }

  // CSRF protection: generate state, store in cookie, send to Notion
  const state = crypto.randomBytes(24).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set("notion_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10,
    path: "/",
  });

  const url = new URL("https://api.notion.com/v1/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("owner", "user");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);

  return NextResponse.redirect(url.toString());
}
