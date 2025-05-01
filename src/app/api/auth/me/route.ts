import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-utils";

export async function GET(request: NextRequest) {
  try {
    // Get the auth token from cookies
    const token = request.cookies.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    // Verify the token
    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    // Return the user information
    return NextResponse.json(
      {
        success: true,
        user: {
          id: payload.id,
          email: payload.email,
          role: payload.role,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error getting current user:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
