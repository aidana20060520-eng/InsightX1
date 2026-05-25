import { auth } from "@clerk/nextjs/server";

/**
 * Returns the current Clerk user id.
 *
 * In Next.js 15+ the `auth()` helper is async, so this must be awaited.
 * Throws if the request isn't authenticated — protected API routes are
 * gated by `middleware.ts`, so by the time this runs there should always
 * be a valid user.
 */
export async function getCurrentUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Not authenticated");
  }
  return userId;
}

/**
 * Returns the current user id or null if not signed in. Useful for routes
 * that have public + authenticated branches.
 */
export async function getCurrentUserIdOrNull(): Promise<string | null> {
  const { userId } = await auth();
  return userId ?? null;
}
