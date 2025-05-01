import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { verifyToken } from "@/lib/auth-utils";
import { and, eq, sql } from "drizzle-orm";

// GET handler to fetch a single user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Convert string ID to number
    const userId = parseInt(params.id, 10);
    if (isNaN(userId)) {
      return NextResponse.json(
        { success: false, message: "Invalid user ID" },
        { status: 400 }
      );
    }

    // Get the auth token from cookies
    const token = request.cookies.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
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

    // Users can only see their own details or admins can see any user
    if (payload.id !== userId && payload.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 403 }
      );
    }

    // Get the user from the database
    const userResult = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        active: users.active,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
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

    return NextResponse.json({
      success: true,
      user: userResult[0],
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT handler to update a user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Convert string ID to number
    const userId = parseInt(params.id, 10);
    if (isNaN(userId)) {
      return NextResponse.json(
        { success: false, message: "Invalid user ID" },
        { status: 400 }
      );
    }

    const { name, email, role, active } = await request.json();

    // Get the auth token from cookies
    const token = request.cookies.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
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

    // Check if the user exists
    const userResult = await db
      .select({
        id: users.id,
        role: users.role,
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

    const userToUpdate = userResult[0];

    // Define what fields can be updated
    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    // Only admins can update role or active status
    if (payload.role === "admin") {
      // Regular users can update their own name and email
      if (name) updateData.name = name;
      if (email) updateData.email = email;

      // Only admins can change roles
      if (role) {
        // Prevent changing the last admin's role to prevent lockout
        if (userToUpdate.role === "admin" && role !== "admin") {
          const adminCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(users)
            .where(eq(users.role, "admin"));

          if (adminCount[0]?.count <= 1) {
            return NextResponse.json(
              {
                success: false,
                message: "Cannot change the role of the last admin user",
              },
              { status: 400 }
            );
          }
        }
        updateData.role = role;
      }

      // Only admins can change active status
      if (active !== undefined) {
        // Prevent deactivating the last admin to prevent lockout
        if (userToUpdate.role === "admin" && !active) {
          const activeAdminCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(users)
            .where(and(eq(users.role, "admin"), eq(users.active, true)));

          if (activeAdminCount[0]?.count <= 1) {
            return NextResponse.json(
              {
                success: false,
                message: "Cannot deactivate the last active admin user",
              },
              { status: 400 }
            );
          }
        }
        updateData.active = active;
      }
    } else {
      // Regular users can only update their own profile
      if (payload.id !== userId) {
        return NextResponse.json(
          {
            success: false,
            message: "Unauthorized. Can only update your own profile",
          },
          { status: 403 }
        );
      }

      // Regular users can only update name and email
      if (name) updateData.name = name;
      if (email) updateData.email = email;
    }

    // Check if email is already in use (if changing email)
    if (email) {
      const existingUser = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.email, email.toLowerCase()), eq(users.id, userId)))
        .limit(1);

      if (existingUser.length) {
        return NextResponse.json(
          { success: false, message: "Email already in use" },
          { status: 400 }
        );
      }
    }

    // Update the user
    await db.update(users).set(updateData).where(eq(users.id, userId));

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE handler to deactivate a user (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Convert string ID to number
    const userId = parseInt(params.id, 10);
    if (isNaN(userId)) {
      return NextResponse.json(
        { success: false, message: "Invalid user ID" },
        { status: 400 }
      );
    }

    // Get the auth token from cookies
    const token = request.cookies.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
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

    // Only admins can deactivate users
    if (payload.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin access required" },
        { status: 403 }
      );
    }

    // Check if the user exists and get their role
    const userResult = await db
      .select({
        id: users.id,
        role: users.role,
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

    const userToDelete = userResult[0];

    // Prevent deactivating the last admin
    if (userToDelete.role === "admin") {
      const activeAdminCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(and(eq(users.role, "admin"), eq(users.active, true)));

      if (activeAdminCount[0]?.count <= 1) {
        return NextResponse.json(
          {
            success: false,
            message: "Cannot deactivate the last active admin user",
          },
          { status: 400 }
        );
      }
    }

    // Soft delete (deactivate) the user
    await db
      .update(users)
      .set({
        active: false,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return NextResponse.json({
      success: true,
      message: "User deactivated successfully",
    });
  } catch (error) {
    console.error("Error deactivating user:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
