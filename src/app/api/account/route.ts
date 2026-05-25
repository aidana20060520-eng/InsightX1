import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { exportUserData, deleteUserData } from "@/lib/account-data";

/**
 * Account self-service.
 *
 *   GET    → download a JSON export of everything we store about you
 *   DELETE → permanently wipe your data + Clerk user
 *
 * Both require the caller to be authenticated as the user whose data is
 * being touched. There is no other entry-point to either function.
 */

export const runtime = "nodejs";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const payload = await exportUserData(userId);
    const filename = `insightx-data-${userId}-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("[account] export failed:", e);
    return NextResponse.json(
      { error: "export_failed", message: "Couldn't build your data export. Try again, or contact support." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Require an explicit confirmation header so we can't accidentally
  // wipe an account from a stray fetch elsewhere in the app.
  const confirm = req.headers.get("x-confirm-delete");
  if (confirm !== "DELETE") {
    return NextResponse.json(
      { error: "missing_confirmation", message: "Missing X-Confirm-Delete: DELETE header." },
      { status: 400 }
    );
  }

  try {
    // Wipe Supabase first — if Clerk delete fails afterwards, the user
    // can re-attempt and there's no orphaned data to clean up.
    await deleteUserData(userId);

    // Then delete the auth identity itself
    try {
      const client = await clerkClient();
      await client.users.deleteUser(userId);
    } catch (clerkErr) {
      // Supabase data is already gone; surface but don't fail the request
      console.error("[account] clerk deleteUser failed:", clerkErr);
      return NextResponse.json(
        {
          ok: true,
          warning:
            "Your data was deleted, but signing out of your auth provider failed. Please sign out manually.",
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[account] delete failed:", e);
    return NextResponse.json(
      {
        error: "delete_failed",
        message:
          "Something went wrong deleting your account. Please contact support and we'll handle it manually.",
      },
      { status: 500 }
    );
  }
}
