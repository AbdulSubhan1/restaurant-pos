import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tables, orders, orderItems } from "@/db/schema";
import { verifyToken } from "@/lib/auth-utils";
import { eq, and, inArray, sql } from "drizzle-orm";

// POST /api/tables/merge - Merge multiple tables into a new table
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

    // Only admin and manager can merge tables
    if (payload.role !== "admin" && payload.role !== "manager") {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Insufficient permissions" },
        { status: 403 }
      );
    }

    // Parse the request body
    const body = await request.json();
    const { tableIds, mergedTableName, mergeNotes } = body;

    // Validate required fields
    if (!tableIds || !Array.isArray(tableIds) || tableIds.length < 2) {
      return NextResponse.json(
        { success: false, message: "At least 2 table IDs are required" },
        { status: 400 }
      );
    }

    if (!mergedTableName || mergedTableName.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: "Merged table name is required" },
        { status: 400 }
      );
    }

    // Remove duplicates
    const uniqueTableIds = [...new Set(tableIds)];

    if (uniqueTableIds.length < 2) {
      return NextResponse.json(
        { success: false, message: "At least 2 different tables are required" },
        { status: 400 }
      );
    }

    // Get all tables to merge
    const tablesToMerge = await db
      .select()
      .from(tables)
      .where(
        and(
          inArray(tables.id, uniqueTableIds),
          eq(tables.active, true)
        )
      );

    if (tablesToMerge.length !== uniqueTableIds.length) {
      return NextResponse.json(
        { success: false, message: "One or more tables not found or inactive" },
        { status: 404 }
      );
    }

    // Check if any table is already merged
    const alreadyMergedTables = tablesToMerge.filter(table => table.isMerged);
    if (alreadyMergedTables.length > 0) {
      return NextResponse.json(
        { success: false, message: "Cannot merge already merged tables" },
        { status: 400 }
      );
    }

    // Calculate combined capacity
    const totalCapacity = tablesToMerge.reduce((sum, table) => sum + table.capacity, 0);

    // Store original table data for potential splitting
    const originalTableData = tablesToMerge.map(table => ({
      id: table.id,
      name: table.name,
      capacity: table.capacity,
      xPosition: table.xPosition,
      yPosition: table.yPosition,
      notes: table.notes,
    }));

    // Start transaction
    const result = await db.transaction(async (tx) => {
      // Create new merged table
      const [newMergedTable] = await tx
        .insert(tables)
        .values({
          name: mergedTableName.trim(),
          capacity: totalCapacity,
          status: "available", // Start as available, will be updated based on orders
          xPosition: Math.round(tablesToMerge.reduce((sum, t) => sum + t.xPosition, 0) / tablesToMerge.length),
          yPosition: Math.round(tablesToMerge.reduce((sum, t) => sum + t.yPosition, 0) / tablesToMerge.length),
          notes: mergeNotes ? mergeNotes.trim() : null,
          isMerged: true,
          mergedFromTables: uniqueTableIds,
          originalTableData: originalTableData,
          active: true,
        })
        .returning();

      // Move all orders from source tables to the new merged table
      for (const tableId of uniqueTableIds) {
        await tx
          .update(orders)
          .set({
            tableId: newMergedTable.id,
            notes: mergeNotes ? `${orders.notes || ""}\nMerged from table ${tableId}: ${mergeNotes}`.trim() : 
                   `${orders.notes || ""}\nMerged from table ${tableId}`.trim(),
            updatedAt: new Date(),
          })
          .where(eq(orders.tableId, tableId));
      }

      // Update merged table status based on orders
      const orderCount = await tx
        .select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(and(eq(orders.tableId, newMergedTable.id), eq(orders.status, "pending")));

      const hasPendingOrders = orderCount[0]?.count > 0;

      await tx
        .update(tables)
        .set({
          status: hasPendingOrders ? "occupied" : "available",
          updatedAt: new Date(),
        })
        .where(eq(tables.id, newMergedTable.id));

      // Deactivate source tables
      await tx
        .update(tables)
        .set({
          active: false,
          notes: `${tables.notes || ""}\nMerged into "${mergedTableName}"`.trim(),
          updatedAt: new Date(),
        })
        .where(inArray(tables.id, uniqueTableIds));

      return newMergedTable;
    });

    return NextResponse.json({
      success: true,
      message: `Successfully merged ${uniqueTableIds.length} tables into "${mergedTableName}"`,
      mergedTable: result,
      mergedTableCount: uniqueTableIds.length,
    });
  } catch (error) {
    console.error("Error merging tables:", error);
    return NextResponse.json(
      { success: false, message: "Failed to merge tables" },
      { status: 500 }
    );
  }
}
