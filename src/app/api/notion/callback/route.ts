import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { encrypt } from "@/lib/crypto";
import { getCurrentUserId } from "@/lib/auth";

export const runtime = "nodejs";

interface NotionTokenResponse {
  access_token: string;
  token_type: string;
  bot_id: string;
  workspace_name: string | null;
  workspace_icon: string | null;
  workspace_id: string;
  owner?: {
    type?: string;
    user?: { id?: string };
  };
}

function appUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base}${path}`;
}

/**
 * Step 2 of Notion OAuth: exchange the authorization code for an access token,
 * encrypt it, and persist the connection in Supabase.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      appUrl(`/settings?notion=error&reason=${encodeURIComponent(error)}`)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(appUrl("/settings?notion=error&reason=missing_params"));
  }

  // Verify CSRF state. In dev we only warn, since the IDE's browser preview proxy
  // and the configured NOTION_REDIRECT_URI can sit on different origins which causes
  // the state cookie to be dropped by the browser.
  const cookieStore = await cookies();
  const storedState = cookieStore.get("notion_oauth_state")?.value;
  const isDev = process.env.NODE_ENV !== "production";
  if (!storedState || storedState !== state) {
    if (!isDev) {
      return NextResponse.redirect(
        appUrl("/settings?notion=error&reason=state_mismatch")
      );
    }
    console.warn(
      "[notion-callback] state cookie missing or mismatched — accepting in dev. " +
        "In production this is a hard failure."
    );
  }
  cookieStore.delete("notion_oauth_state");

  const clientId = process.env.NOTION_CLIENT_ID;
  const clientSecret = process.env.NOTION_CLIENT_SECRET;
  const redirectUri = process.env.NOTION_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.redirect(appUrl("/settings?notion=error&reason=server_config"));
  }

  // Exchange code for token
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  let tokenData: NotionTokenResponse;

  try {
    const tokenRes = await fetch("https://api.notion.com/v1/oauth/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      console.error("Notion token exchange failed:", tokenRes.status, text);
      return NextResponse.redirect(appUrl("/settings?notion=error&reason=token_exchange"));
    }

    tokenData = await tokenRes.json();
  } catch (e) {
    console.error("Notion token exchange threw:", e);
    return NextResponse.redirect(appUrl("/settings?notion=error&reason=token_exchange"));
  }

  // Encrypt + persist
  try {
    const userId = await getCurrentUserId();
    const supabase = getSupabaseAdmin();
    const accessTokenEncrypted = encrypt(tokenData.access_token);

    // Detect if this is a first-time connection so we can route to /welcome
    const { data: existingConnection } = await supabase
      .from("notion_connections")
      .select("id, last_sync_at")
      .eq("user_id", userId)
      .eq("workspace_id", tokenData.workspace_id)
      .maybeSingle();

    const isFirstConnect = !existingConnection?.last_sync_at;

    const { data: connection, error: upsertError } = await supabase
      .from("notion_connections")
      .upsert(
        {
          user_id: userId,
          workspace_id: tokenData.workspace_id,
          workspace_name: tokenData.workspace_name,
          workspace_icon: tokenData.workspace_icon,
          bot_id: tokenData.bot_id,
          access_token_encrypted: accessTokenEncrypted,
          owner_user_id: tokenData.owner?.user?.id || null,
          status: "connected",
          last_error: null,
        },
        { onConflict: "user_id,workspace_id" }
      )
      .select("id")
      .single();

    if (upsertError) {
      console.error("Supabase upsert failed:", upsertError);
      return NextResponse.redirect(appUrl("/settings?notion=error&reason=db"));
    }

    // Kick off initial sync in the background (fire-and-forget)
    if (connection?.id) {
      const syncUrl = appUrl(`/api/notion/sync?connectionId=${connection.id}`);
      fetch(syncUrl, { method: "POST" }).catch((err) => {
        console.error("Failed to trigger initial sync:", err);
      });
    }

    // First-time connection → instant value experience; reconnects → settings
    return NextResponse.redirect(
      appUrl(isFirstConnect ? "/welcome" : "/settings?notion=connected")
    );
  } catch (e) {
    console.error("Persist connection failed:", e);
    return NextResponse.redirect(appUrl("/settings?notion=error&reason=persist"));
  }
}
