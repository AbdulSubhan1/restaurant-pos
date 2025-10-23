import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tables, reservations } from "@/db/schema";
import { verifyToken } from "@/lib/auth-utils";
import { eq, and, sql } from "drizzle-orm";

// POST /api/tables/sync-status - Sync table statuses with their reservations
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

    // Only admin and manager can sync table statuses
    if (payload.role !== "admin" && payload.role !== "manager") {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Insufficient permissions" },
        { status: 403 }
      );
    }

    // Get all active tables
    const allTables = await db
      .select()
      .from(tables)
      .where(eq(tables.active, true));

    const syncResults = [];

    for (const table of allTables) {
      // Check for active reservations for this table
      const activeReservations = await db
        .select()
        .from(reservations)
        .where(
          and(
            eq(reservations.tableId, table.id),
            eq(reservations.status, "confirmed"),
            eq(reservations.isExpired, false)
          )
        );

      let expectedStatus = "available";
      
      if (activeReservations.length > 0) {
        expectedStatus = "reserved";
      }

      // Update table status if it doesn't match expected status
      if (table.status !== expectedStatus) {
        await db
          .update(tables)
          .set({
            status: expectedStatus,
            updatedAt: new Date(),
          })
          .where(eq(tables.id, table.id));

        syncResults.push({
          tableId: table.id,
          tableName: table.name,
          oldStatus: table.status,
          newStatus: expectedStatus,
          reason: activeReservations.length > 0 
            ? `Found ${activeReservations.length} active reservation(s)` 
            : "No active reservations found"
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${syncResults.length} table statuses`,
      syncResults,
      totalTables: allTables.length,
    });
  } catch (error) {
    console.error("Error syncing table statuses:", error);
    return NextResponse.json(
      { success: false, message: "Failed to sync table statuses" },
      { status: 500 }
    );
  }
}

// GET /api/tables/sync-status - Check for table status inconsistencies
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

    // Get all active tables
    const allTables = await db
      .select()
      .from(tables)
      .where(eq(tables.active, true));

    const inconsistencies = [];

    for (const table of allTables) {
      // Check for active reservations for this table
      const activeReservations = await db
        .select()
        .from(reservations)
        .where(
          and(
            eq(reservations.tableId, table.id),
            eq(reservations.status, "confirmed"),
            eq(reservations.isExpired, false)
          )
        );

      let expectedStatus = "available";
      
      if (activeReservations.length > 0) {
        expectedStatus = "reserved";
      }

      // Check if table status is inconsistent
      if (table.status !== expectedStatus) {
        inconsistencies.push({
          tableId: table.id,
          tableName: table.name,
          currentStatus: table.status,
          expectedStatus,
          activeReservations: activeReservations.length,
          reservations: activeReservations.map(r => ({
            id: r.id,
            customerName: r.customerName,
            reservationDate: r.reservationDate,
            reservationTime: r.reservationTime,
          }))
        });
      }
    }

    return NextResponse.json({
      success: true,
      inconsistencies,
      totalTables: allTables.length,
      inconsistentTables: inconsistencies.length,
    });
  } catch (error) {
    console.error("Error checking table status inconsistencies:", error);
    return NextResponse.json(
      { success: false, message: "Failed to check table status inconsistencies" },
      { status: 500 }
    );
  }
}
