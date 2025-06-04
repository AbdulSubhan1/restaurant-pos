import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tables } from "@/db/schema";
import { verifyToken } from "@/lib/auth-utils";
import { eq } from "drizzle-orm";

// GET /api/tables/[id] - Get a specific table
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: idString } = await params;
    const id = parseInt(idString);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid table ID" },
        { status: 400 }
      );
    }

    // Get the table
    const table = await db
      .select()
      .from(tables)
      .where(eq(tables.id, id))
      .limit(1);

    if (!table.length) {
      return NextResponse.json(
        { success: false, message: "Table not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, table: table[0] });
  } catch (error) {
    console.error(`Error getting table:`, error);
    return NextResponse.json(
      { success: false, message: "Failed to get table" },
      { status: 500 }
    );
  }
}

// PUT /api/tables/[id] - Update a table
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    // Only admin and manager can update tables
    if (payload.role !== "admin" && payload.role !== "manager") {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Insufficient permissions" },
        { status: 403 }
      );
    }

    const { id: idString } = await params;
    const id = parseInt(idString);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid table ID" },
        { status: 400 }
      );
    }

    // Check if table exists
    const existingTable = await db
      .select()
      .from(tables)
      .where(eq(tables.id, id))
      .limit(1);

    if (!existingTable.length) {
      return NextResponse.json(
        { success: false, message: "Table not found" },
        { status: 404 }
      );
    }

    // Parse the request body
    const body = await request.json();
    const { name, capacity, status, xPosition, yPosition, notes, active } =
      body;

    // Update the table
    const result = await db
      .update(tables)
      .set({
        name: name !== undefined ? name : existingTable[0].name,
        capacity:
          capacity !== undefined ? Number(capacity) : existingTable[0].capacity,
        status: status !== undefined ? status : existingTable[0].status,
        xPosition:
          xPosition !== undefined
            ? Number(xPosition)
            : existingTable[0].xPosition,
        yPosition:
          yPosition !== undefined
            ? Number(yPosition)
            : existingTable[0].yPosition,
        notes: notes !== undefined ? notes : existingTable[0].notes,
        active: active !== undefined ? active : existingTable[0].active,
        updatedAt: new Date(),
      })
      .where(eq(tables.id, id))
      .returning();

    return NextResponse.json({ success: true, table: result[0] });
  } catch (error) {
    console.error(`Error updating table:`, error);
    return NextResponse.json(
      { success: false, message: "Failed to update table" },
      { status: 500 }
    );
  }
}

// DELETE /api/tables/[id] - Soft delete a table
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    // Only admin can delete tables
    if (payload.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Insufficient permissions" },
        { status: 403 }
      );
    }

    const { id: idString } = await params;
    const id = parseInt(idString);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid table ID" },
        { status: 400 }
      );
    }

    // Check if table exists
    const existingTable = await db
      .select()
      .from(tables)
      .where(eq(tables.id, id))
      .limit(1);

    if (!existingTable.length) {
      return NextResponse.json(
        { success: false, message: "Table not found" },
        { status: 404 }
      );
    }

    // Perform soft delete by setting active to false
    const result = await db
      .update(tables)
      .set({active: false, updatedAt: new Date()})
      .where(eq(tables.id, id))
      .returning();
    return NextResponse.json({ success: true, table: result[0] });
  } catch (error) {
    console.error(`Error deleting table:`, error);
    return NextResponse.json(
      { success: false, message: "Failed to delete table" },
      { status: 500 }
    );
  }
}
