import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tables, orders } from "@/db/schema";
import { verifyToken } from "@/lib/auth-utils";
import { eq, and, sql } from "drizzle-orm";

// POST /api/tables/split - Split a merged table back into original tables
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
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

    // Only admin and manager can split tables
    if (payload.role !== "admin" && payload.role !== "manager") {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Insufficient permissions" },
        { status: 403 }
      );
    }

    // Parse the request body
    const body = await request.json();
    const { mergedTableId } = body;

    // Validate required fields
    if (!mergedTableId) {
      return NextResponse.json(
        { success: false, message: "Merged table ID is required" },
        { status: 400 }
      );
    }

    // Get the merged table
    const mergedTable = await db
      .select()
      .from(tables)
      .where(and(eq(tables.id, mergedTableId), eq(tables.isMerged, true)))
      .limit(1);

    if (!mergedTable.length) {
      return NextResponse.json(
        { success: false, message: "Merged table not found" },
        { status: 404 }
      );
    }

    const table = mergedTable[0];

    if (!table.originalTableData || table.originalTableData.length === 0) {
      return NextResponse.json(
        { success: false, message: "No original table data found for splitting" },
        { status: 400 }
      );
    }

    // Check if there are any active orders (pending, in-progress) on the merged table
    const activeOrders = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.tableId, mergedTableId),
          sql`${orders.status} IN ('pending', 'in-progress')`
        )
      );

    if (activeOrders.length > 0) {
      return NextResponse.json(
        { success: false, message: "Cannot split table with active orders. Please complete or cancel all pending/in-progress orders first." },
        { status: 400 }
      );
    }

    // Start transaction
    const result = await db.transaction(async (tx) => {
      // Reactivate original tables
      const reactivatedTables = [];
      for (const originalData of table.originalTableData || []) {
        const [reactivatedTable] = await tx
          .update(tables)
          .set({
            active: true,
            status: "available",
            notes: `${originalData.notes || ""}\nSplit from merged table "${table.name}"`.trim(),
            updatedAt: new Date(),
          })
          .where(eq(tables.id, originalData.id))
          .returning();

        reactivatedTables.push(reactivatedTable);
      }

      // Deactivate the merged table
      await tx
        .update(tables)
        .set({
          active: false,
          notes: `${table.notes || ""}\nSplit back to original tables`.trim(),
          updatedAt: new Date(),
        })
        .where(eq(tables.id, mergedTableId));

      return reactivatedTables;
    });

    return NextResponse.json({
      success: true,
      message: `Successfully split merged table "${table.name}" back into ${result.length} original tables`,
      reactivatedTables: result,
      splitTableCount: result.length,
    });
  } catch (error) {
    console.error("Error splitting table:", error);
    return NextResponse.json(
      { success: false, message: "Failed to split table" },
      { status: 500 }
    );
  }
}
