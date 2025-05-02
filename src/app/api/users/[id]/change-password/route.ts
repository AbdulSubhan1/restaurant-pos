import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { verifyToken } from "@/lib/auth-utils";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

// POST /api/users/[id]/change-password - Change password for a user
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get authentication token
    const token = request.cookies.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    // Verify token
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    const { id: userIdString } = await params;
    const userId = parseInt(userIdString);

    if (isNaN(userId)) {
      return NextResponse.json(
        { success: false, message: "Invalid user ID" },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = await request.json();

    // Validate inputs
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "Current password and new password are required",
        },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: "New password must be at least 6 characters",
        },
        { status: 400 }
      );
    }

    // Only allow users to change their own password (or admins can change any password)
    if (payload.id !== userId && payload.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. You can only change your own password",
        },
        { status: 403 }
      );
    }

    // Get the user from the database
    const userResult = await db
      .select({
        id: users.id,
        password: users.password,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!userResult.length) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const user = userResult[0];

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password || ""
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: "Current password is incorrect" },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    await db
      .update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return NextResponse.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Error changing password:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
