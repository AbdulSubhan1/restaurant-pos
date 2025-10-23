import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reservations, tables } from "@/db/schema";
import { verifyToken } from "@/lib/auth-utils";
import { eq, and, lte } from "drizzle-orm";

// POST /api/reservations/expire - Mark expired reservations and update table statuses
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

    const now = new Date();

    // Find reservations that have expired but are still marked as confirmed
    const expiredReservations = await db
      .select()
      .from(reservations)
      .where(
        and(
          eq(reservations.status, "confirmed"),
          lte(reservations.expiresAt, now),
          eq(reservations.isExpired, false)
        )
      );

    if (expiredReservations.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No expired reservations found",
        expiredCount: 0,
      });
    }

    // Mark reservations as expired
    const expiredIds = expiredReservations.map(r => r.id);
    
    await db
      .update(reservations)
      .set({
        status: "no-show",
        isExpired: true,
        updatedAt: now,
      })
      .where(eq(reservations.id, expiredIds[0])); // Update one by one for better error handling

    // Update table statuses back to available
    const tableIds = [...new Set(expiredReservations.map(r => r.tableId))];
    
    for (const tableId of tableIds) {
      // Check if there are any other active reservations for this table
      const activeReservations = await db
        .select()
        .from(reservations)
        .where(
          and(
            eq(reservations.tableId, tableId),
            eq(reservations.status, "confirmed"),
            eq(reservations.isExpired, false)
          )
        );

      // Only set to available if no other active reservations
      if (activeReservations.length === 0) {
        await db
          .update(tables)
          .set({
            status: "available",
            updatedAt: now,
          })
          .where(eq(tables.id, tableId));
      }
    }

    return NextResponse.json({
      success: true,
      message: `Marked ${expiredReservations.length} reservations as expired`,
      expiredCount: expiredReservations.length,
      expiredReservations: expiredReservations.map(r => ({
        id: r.id,
        tableId: r.tableId,
        customerName: r.customerName,
        reservationDate: r.reservationDate,
        reservationTime: r.reservationTime,
      })),
    });
  } catch (error) {
    console.error("Error expiring reservations:", error);
    return NextResponse.json(
      { success: false, message: "Failed to expire reservations" },
      { status: 500 }
    );
  }
}

// GET /api/reservations/expire - Check for expired reservations (for manual trigger)
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

    const now = new Date();

    // Find reservations that have expired but are still marked as confirmed
    const expiredReservations = await db
      .select({
        id: reservations.id,
        tableId: reservations.tableId,
        customerName: reservations.customerName,
        reservationDate: reservations.reservationDate,
        reservationTime: reservations.reservationTime,
        expiresAt: reservations.expiresAt,
      })
      .from(reservations)
      .where(
        and(
          eq(reservations.status, "confirmed"),
          lte(reservations.expiresAt, now),
          eq(reservations.isExpired, false)
        )
      );

    return NextResponse.json({
      success: true,
      expiredReservations,
      expiredCount: expiredReservations.length,
    });
  } catch (error) {
    console.error("Error checking expired reservations:", error);
    return NextResponse.json(
      { success: false, message: "Failed to check expired reservations" },
      { status: 500 }
    );
  }
}
