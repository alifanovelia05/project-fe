import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Cookie name for auth token
const AUTH_COOKIE_NAME = "auth_token";

// Public routes that don't require authentication
const publicRoutes = ["/signin", "/signup", "/reset-password"];

// Auth routes (redirect to dashboard if already logged in)
const authRoutes = ["/signin", "/signup"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get auth token from cookies
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const isAuthenticated = !!token;

  // Check if current route is a public route
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route),
  );

  // Check if current route is an auth route (signin/signup)
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") // Static files like favicon.ico, images, etc.
  ) {
    return NextResponse.next();
  }

  // If user is authenticated and trying to access auth routes, redirect to dashboard
  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // If user is not authenticated and trying to access protected route
  if (!isAuthenticated && !isPublicRoute) {
    // Store the original URL to redirect back after login
    const signInUrl = new URL("/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)",
  ],
};
