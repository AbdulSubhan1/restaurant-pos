import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reservations, tables, users } from "@/db/schema";
import { verifyToken } from "@/lib/auth-utils";
import { eq, and } from "drizzle-orm";

// GET /api/reservations/[id] - Get a specific reservation
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
        { success: false, message: "Invalid reservation ID" },
        { status: 400 }
      );
    }

    const reservationData = await db
      .select({
        id: reservations.id,
        tableId: reservations.tableId,
        tableName: tables.name,
        customerName: reservations.customerName,
        customerPhone: reservations.customerPhone,
        customerEmail: reservations.customerEmail,
        partySize: reservations.partySize,
        reservationDate: reservations.reservationDate,
        reservationTime: reservations.reservationTime,
        duration: reservations.duration,
        status: reservations.status,
        specialRequests: reservations.specialRequests,
        notes: reservations.notes,
        createdBy: reservations.createdBy,
        createdByName: users.name,
        expiresAt: reservations.expiresAt,
        isExpired: reservations.isExpired,
        createdAt: reservations.createdAt,
        updatedAt: reservations.updatedAt,
        cancelledAt: reservations.cancelledAt,
        completedAt: reservations.completedAt,
      })
      .from(reservations)
      .leftJoin(tables, eq(reservations.tableId, tables.id))
      .leftJoin(users, eq(reservations.createdBy, users.id))
      .where(eq(reservations.id, id))
      .limit(1);

    if (!reservationData.length) {
      return NextResponse.json(
        { success: false, message: "Reservation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      reservation: reservationData[0],
    });
  } catch (error) {
    console.error("Error fetching reservation:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch reservation" },
      { status: 500 }
    );
  }
}

// PUT /api/reservations/[id] - Update a reservation
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

    const { id: idString } = await params;
    const id = parseInt(idString);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid reservation ID" },
        { status: 400 }
      );
    }

    // Check if reservation exists
    const existingReservation = await db
      .select()
      .from(reservations)
      .where(eq(reservations.id, id))
      .limit(1);

    if (!existingReservation.length) {
      return NextResponse.json(
        { success: false, message: "Reservation not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      customerName,
      customerPhone,
      customerEmail,
      partySize,
      reservationDate,
      reservationTime,
      duration,
      status,
      specialRequests,
      notes,
    } = body;

    // Update the reservation
    const [updatedReservation] = await db
      .update(reservations)
      .set({
        customerName: customerName || existingReservation[0].customerName,
        customerPhone: customerPhone !== undefined ? customerPhone : existingReservation[0].customerPhone,
        customerEmail: customerEmail !== undefined ? customerEmail : existingReservation[0].customerEmail,
        partySize: partySize || existingReservation[0].partySize,
        reservationDate: reservationDate ? new Date(`${reservationDate}T${reservationTime}`) : existingReservation[0].reservationDate,
        reservationTime: reservationTime || existingReservation[0].reservationTime,
        duration: duration || existingReservation[0].duration,
        status: status || existingReservation[0].status,
        specialRequests: specialRequests !== undefined ? specialRequests : existingReservation[0].specialRequests,
        notes: notes !== undefined ? notes : existingReservation[0].notes,
        updatedAt: new Date(),
        // Update expiry time if date/time changed
        expiresAt: reservationDate && reservationTime 
          ? new Date(new Date(`${reservationDate}T${reservationTime}`).getTime() + (duration || existingReservation[0].duration) * 60000)
          : existingReservation[0].expiresAt,
      })
      .where(eq(reservations.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      reservation: updatedReservation,
      message: "Reservation updated successfully",
    });
  } catch (error) {
    console.error("Error updating reservation:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update reservation" },
      { status: 500 }
    );
  }
}

// DELETE /api/reservations/[id] - Cancel a reservation
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

    const { id: idString } = await params;
    const id = parseInt(idString);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid reservation ID" },
        { status: 400 }
      );
    }

    // Check if reservation exists
    const existingReservation = await db
      .select()
      .from(reservations)
      .where(eq(reservations.id, id))
      .limit(1);

    if (!existingReservation.length) {
      return NextResponse.json(
        { success: false, message: "Reservation not found" },
        { status: 404 }
      );
    }

    // Cancel the reservation
    const [cancelledReservation] = await db
      .update(reservations)
      .set({
        status: "cancelled",
        cancelledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(reservations.id, id))
      .returning();

    // Update table status back to available
    await db
      .update(tables)
      .set({
        status: "available",
        updatedAt: new Date(),
      })
      .where(eq(tables.id, existingReservation[0].tableId));

    return NextResponse.json({
      success: true,
      reservation: cancelledReservation,
      message: "Reservation cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling reservation:", error);
    return NextResponse.json(
      { success: false, message: "Failed to cancel reservation" },
      { status: 500 }
    );
  }
}
