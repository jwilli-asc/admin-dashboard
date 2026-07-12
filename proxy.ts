import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Internal tool: everything except the sign-in landing page and the OAuth
// callback requires auth.
const isPublicRoute = createRouteMatcher(["/", "/sso-callback(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
