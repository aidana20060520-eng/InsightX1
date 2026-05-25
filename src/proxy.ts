import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Public routes — anyone can access these
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  // Notion redirects back to this URL after OAuth. The user is authenticated
  // in the browser, but we don't want Clerk middleware to interrupt the
  // redirect with a sign-in challenge.
  "/api/notion/callback(.*)",
]);

export default clerkMiddleware(
  async (auth, req) => {
    if (!isPublicRoute(req)) {
      await auth.protect();
    }
  },
  {
    // Allow up to 5 minutes of clock skew between this server and Clerk's
    // servers. Default is 5s, which can fail on dev machines whose clocks
    // drift a few seconds. In production this is harmless because the
    // Clerk-issued nbf/exp claims are still validated; this just widens
    // the acceptable window.
    clockSkewInMs: 5 * 60 * 1000,
  }
);

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
    // Clerk auto-proxy path (required by clerk init step)
    "/__clerk/(.*)",
  ],
};
