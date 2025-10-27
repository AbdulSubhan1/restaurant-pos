import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { layouts } from "@/db/schema";
import { verifyToken } from "@/lib/auth-utils";
import { eq } from "drizzle-orm";

// GET /api/tables/layout/[id] - Get specific layout
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    const layoutId = parseInt(params.id);
    if (isNaN(layoutId)) {
      return NextResponse.json(
        { success: false, message: "Invalid layout ID" },
        { status: 400 }
      );
    }

    const [layout] = await db
      .select()
      .from(layouts)
      .where(eq(layouts.id, layoutId))
      .limit(1);

    if (!layout) {
      return NextResponse.json(
        { success: false, message: "Layout not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      layout,
    });
  } catch (error) {
    console.error("Error fetching layout:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch layout" },
      { status: 500 }
    );
  }
}

// PUT /api/tables/layout/[id] - Update layout
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    // Only admin and manager can update layouts
    if (payload.role !== "admin" && payload.role !== "manager") {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Insufficient permissions" },
        { status: 403 }
      );
    }

    const layoutId = parseInt(params.id);
    if (isNaN(layoutId)) {
      return NextResponse.json(
        { success: false, message: "Invalid layout ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, description, elements, metadata } = body;

    const [updatedLayout] = await db
      .update(layouts)
      .set({
        name: name ? name.trim() : undefined,
        description: description ? description.trim() : undefined,
        elements: elements || undefined,
        metadata: metadata || undefined,
        updatedAt: new Date(),
      })
      .where(eq(layouts.id, layoutId))
      .returning();

    if (!updatedLayout) {
      return NextResponse.json(
        { success: false, message: "Layout not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Layout updated successfully",
      layout: updatedLayout,
    });
  } catch (error) {
    console.error("Error updating layout:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update layout" },
      { status: 500 }
    );
  }
}

// DELETE /api/tables/layout/[id] - Delete layout
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    // Only admin and manager can delete layouts
    if (payload.role !== "admin" && payload.role !== "manager") {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Insufficient permissions" },
        { status: 403 }
      );
    }

    const layoutId = parseInt(params.id);
    if (isNaN(layoutId)) {
      return NextResponse.json(
        { success: false, message: "Invalid layout ID" },
        { status: 400 }
      );
    }

    const [deletedLayout] = await db
      .delete(layouts)
      .where(eq(layouts.id, layoutId))
      .returning();

    if (!deletedLayout) {
      return NextResponse.json(
        { success: false, message: "Layout not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Layout deleted successfully",
      layout: deletedLayout,
    });
  } catch (error) {
    console.error("Error deleting layout:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete layout" },
      { status: 500 }
    );
  }
}
