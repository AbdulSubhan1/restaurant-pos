import { NextRequest, NextResponse } from "next/server";
// Remove the jsonwebtoken import and use a simpler function to decode JWT
// import * as jwt from 'jsonwebtoken';

// Define public routes that don't require authentication
const publicRoutes = ["/login", "/api/auth/login", "/menu"];

// Define role-based route access
const roleBasedRoutes: Record<string, string[]> = {
  // Admin can access everything
  // Manager can access everything except user management
  // Server can only access table, order, and kitchen routes
  // Kitchen staff can only access kitchen routes
  admin: [
    "/dashboard",
    "/users",
    "/menu",
    "/tables",
    "/orders",
    "/kitchen",
    "/reports",
    "/payments",
    "/profile",
    "/analytics",
  ],
  manager: [
    "/dashboard",
    "/menu",
    "/tables",
    "/orders",
    "/kitchen",
    "/reports",
    "/payments",
    "/profile",
  ],
  server: ["/dashboard", "/tables", "/orders", "/kitchen", "/profile"],
  kitchen: ["/dashboard", "/kitchen", "/profile"],
};

// Simple function to decode JWT tokens without verification
// Note: This does not verify the signature - that should be done in the API routes
function decodeJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Error decoding JWT:", error);
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the path is an API route
  const isApiRoute = pathname.startsWith("/api");

  // Allow public routes
  if (
    publicRoutes.some(
      (route) => pathname === route || pathname.startsWith(route)
    )
  ) {
    return NextResponse.next();
  }

  // Public assets (images, css, js)
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.includes(".") // files with extensions
  ) {
    return NextResponse.next();
  }

  // Get the token from cookies
  const token = request.cookies.get("auth_token")?.value;

  // If no token is provided, redirect to login
  if (!token) {
    // If it's an API request, return 401
    if (isApiRoute) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }
    // Otherwise redirect to login
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Parse the token without verification in middleware
  // In Edge Runtime we can't use the crypto module for full JWT verification
  try {
    // Instead of jwt.verify, use our simple decoder
    const payload = decodeJwt(token);

    if (!payload) {
      throw new Error("Invalid token payload");
    }

    // Check role-based access for non-API routes
    if (!isApiRoute && pathname !== "/") {
      const userRole = payload.role;
      const allowedRoutes = roleBasedRoutes[userRole] || [];

      // Check if user can access this route based on role
      const canAccess = allowedRoutes.some((route) =>
        pathname.startsWith(route)
      );

      if (!canAccess) {
        // Redirect to dashboard if user has no access to the requested route
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }

    // If all checks pass, proceed with the request
    return NextResponse.next();
  } catch (error) {
    console.error("Token verification error:", error);

    // If it's an API request, return 401
    if (isApiRoute) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    // Otherwise redirect to login
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all paths except:
     * 1. /api/auth/login (public API routes)
     * 2. /_next (static files)
     * 3. /favicon.ico, /images, etc. (static files)
     */
    "/((?!_next|favicon.ico|.*\\.).*)",
  ],
};
