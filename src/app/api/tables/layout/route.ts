import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tables, layouts } from "@/db/schema";
import { verifyToken } from "@/lib/auth-utils";
import { eq, desc } from "drizzle-orm";

// GET /api/tables/layout - Get saved layouts
export async function GET(request: NextRequest) {
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

    // Get saved layouts from database
    const savedLayouts = await db
      .select()
      .from(layouts)
      .orderBy(desc(layouts.createdAt));

    // Also get current table layout
    const currentTables = await db
      .select()
      .from(tables)
      .where(eq(tables.active, true))
      .orderBy(desc(tables.createdAt));

    // Convert tables to layout format
    const currentLayout = {
      id: "current",
      name: "Current Layout",
      description: "Current table arrangement",
      elements: currentTables.map(table => ({
        id: `table-${table.id}`,
        tableId: table.id,
        type: "table",
        shape: table.capacity <= 2 ? "square" : "circle",
        label: table.name,
        position: [table.xPosition, table.yPosition],
        size: 60,
        capacity: table.capacity,
        status: table.status,
        name: table.name,
        xPosition: table.xPosition,
        yPosition: table.yPosition,
      })),
      metadata: {
        createdAt: new Date().toISOString(),
        version: "1.0",
        isCurrent: true
      }
    };

    return NextResponse.json({
      success: true,
      layouts: [currentLayout, ...savedLayouts],
    });
  } catch (error) {
    console.error("Error fetching layouts:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch layouts" },
      { status: 500 }
    );
  }
}

// POST /api/tables/layout - Save layout
export async function POST(request: NextRequest) {
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

    // Only admin and manager can save layouts
    if (payload.role !== "admin" && payload.role !== "manager") {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, elements, metadata } = body;

    if (!name || !elements) {
      return NextResponse.json(
        { success: false, message: "Layout name and elements are required" },
        { status: 400 }
      );
    }

    // Check if layout name already exists
    const existingLayout = await db
      .select()
      .from(layouts)
      .where(eq(layouts.name, name))
      .limit(1);

    if (existingLayout.length > 0) {
      return NextResponse.json(
        { success: false, message: "Layout name already exists" },
        { status: 400 }
      );
    }

    // Save layout to database
    const [newLayout] = await db
      .insert(layouts)
      .values({
        name: name.trim(),
        description: description ? description.trim() : null,
        elements: elements,
        metadata: metadata || {
          createdAt: new Date().toISOString(),
          version: "1.0"
        },
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Update table positions based on layout
    for (const element of elements) {
      if (element.type === "table" && element.tableId > 0) {
        await db
          .update(tables)
          .set({
            xPosition: element.xPosition || element.position[0],
            yPosition: element.yPosition || element.position[1],
            updatedAt: new Date(),
          })
          .where(eq(tables.id, element.tableId));
      }
    }

    return NextResponse.json({
      success: true,
      message: `Layout "${name}" saved successfully`,
      layout: newLayout,
    });
  } catch (error) {
    console.error("Error saving layout:", error);
    return NextResponse.json(
      { success: false, message: "Failed to save layout" },
      { status: 500 }
    );
  }
}