import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reservations, tables, users } from "@/db/schema";
import { verifyToken } from "@/lib/auth-utils";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

// GET /api/reservations - Get all reservations with optional filtering
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

    // Parse query parameters
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const tableId = url.searchParams.get("tableId");
    const date = url.searchParams.get("date");
    const search = url.searchParams.get("search");

    // Build query conditions
    let conditions = [];

    if (status) {
      conditions.push(eq(reservations.status, status));
    }

    if (tableId) {
      conditions.push(eq(reservations.tableId, parseInt(tableId)));
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      conditions.push(
        and(
          gte(reservations.reservationDate, startOfDay),
          lte(reservations.reservationDate, endOfDay)
        )
      );
    }

    if (search) {
      conditions.push(
        sql`(${reservations.customerName} ILIKE ${`%${search}%`} OR ${reservations.customerPhone} ILIKE ${`%${search}%`})`
      );
    }

    let whereClause;
    if (conditions.length > 0) {
      whereClause = and(...conditions);
    }

    const query = db
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
      .orderBy(desc(reservations.reservationDate), desc(reservations.reservationTime));

    const allReservations = whereClause
      ? await query.where(whereClause)
      : await query;

    return NextResponse.json({
      success: true,
      reservations: allReservations,
    });
  } catch (error) {
    console.error("Error fetching reservations:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch reservations" },
      { status: 500 }
    );
  }
}

// POST /api/reservations - Create a new reservation
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

    const body = await request.json();
    const {
      tableId,
      customerName,
      customerPhone,
      customerEmail,
      partySize,
      reservationDate,
      reservationTime,
      duration,
      specialRequests,
      notes,
    } = body;

    // Validate required fields
    if (!tableId || !customerName || !partySize || !reservationDate || !reservationTime) {
      return NextResponse.json(
        { success: false, message: "Table ID, customer name, party size, date, and time are required" },
        { status: 400 }
      );
    }

    // Check if table exists and is available
    const table = await db
      .select()
      .from(tables)
      .where(eq(tables.id, tableId))
      .limit(1);

    if (!table.length) {
      return NextResponse.json(
        { success: false, message: "Table not found" },
        { status: 404 }
      );
    }

    if (!table[0].active) {
      return NextResponse.json(
        { success: false, message: "Table is not active" },
        { status: 400 }
      );
    }

    // Check if table capacity is sufficient
    if (partySize > table[0].capacity) {
      return NextResponse.json(
        { success: false, message: `Party size (${partySize}) exceeds table capacity (${table[0].capacity})` },
        { status: 400 }
      );
    }

    // Parse reservation date and time
    const reservationDateTime = new Date(`${reservationDate}T${reservationTime}`);
    const expiresAt = new Date(reservationDateTime.getTime() + (duration || 120) * 60000);

    // Check for conflicting reservations
    const conflictingReservations = await db
      .select()
      .from(reservations)
      .where(
        and(
          eq(reservations.tableId, tableId),
          eq(reservations.status, "confirmed"),
          lte(reservations.reservationDate, expiresAt),
          gte(reservations.expiresAt, reservationDateTime)
        )
      );

    if (conflictingReservations.length > 0) {
      return NextResponse.json(
        { success: false, message: "Table is already reserved for this time period" },
        { status: 400 }
      );
    }

    // If table status is not available but no conflicting reservations exist,
    // allow the reservation and update table status to reserved
    if (table[0].status !== "available" && table[0].status !== "reserved") {
      console.log(`Table ${tableId} status is ${table[0].status}, but no conflicting reservations found. Proceeding with reservation.`);
    }

    // Create the reservation
    const [newReservation] = await db
      .insert(reservations)
      .values({
        tableId,
        customerName,
        customerPhone,
        customerEmail,
        partySize,
        reservationDate: reservationDateTime,
        reservationTime,
        duration: duration || 120,
        specialRequests,
        notes,
        createdBy: payload.id,
        expiresAt,
        status: "confirmed",
      })
      .returning();

    // Update table status to reserved
    await db
      .update(tables)
      .set({
        status: "reserved",
        updatedAt: new Date(),
      })
      .where(eq(tables.id, tableId));

    return NextResponse.json(
      {
        success: true,
        reservation: newReservation,
        message: "Reservation created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating reservation:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create reservation" },
      { status: 500 }
    );
  }
}
