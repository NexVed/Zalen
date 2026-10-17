import { clerkMiddleware } from "@clerk/nextjs/server";

/**
 * Clerk middleware runs before the route tree, so the session is resolved once
 * here and made available to Server Components, API routes, and Server
 * Functions.
 *
 * Auth checks are resource-based (Clerk's recommended model) instead of
 * path-based `createRouteMatcher` matching, so no route is blocked by path
 * matching alone. A resource that needs protection checks `await auth()`
 * itself; public routes such as `/` keep rendering immediately without
 * waiting on auth.
 */
export default clerkMiddleware(async (auth) => {
  // Resolve authentication first, before any route renders, so protected
  // resources never have to block the render on session state.
  await auth();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
