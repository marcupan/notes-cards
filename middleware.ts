import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: [
    "/",               // home
    "/sign-in(.*)",    // Clerk sign-in
    "/sign-up(.*)",    // Clerk sign-up
    "/api/health",     // health endpoint
  ],
});

export const config = {
  matcher: [
    // Skip static files and Next internals
    "/((?!.*\\..*|_next).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
};
