import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tables } from "@/db/schema";
import { verifyToken } from "@/lib/auth-utils";
import { eq } from "drizzle-orm";

// GET /api/tables - Get all tables
export async function GET(request: NextRequest) {
  
  const searchParams = request.nextUrl.searchParams;

  const page = searchParams.get('page') || '1';
  const limit = searchParams.get('limit') || '10';
  
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
    // Get all active tables
    const allTables = await db
      .select()
      .from(tables)
      .where(eq(tables.active, true))
      .orderBy(tables.name)
      .limit(parseInt(limit))
      .offset((parseInt(page) - 1) * parseInt(limit));
      


    return NextResponse.json({ success: true, tables: allTables });
  } catch (error) {
    console.error("Error getting tables:", error);
    return NextResponse.json(
      { success: false, message: "Failed to get tables" },
      { status: 500 }
    );
  }
}

// POST /api/tables - Create a new table
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

    // Only admin and manager can create tables
    if (payload.role !== "admin" && payload.role !== "manager") {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Insufficient permissions" },
        { status: 403 }
      );
    }

    // Parse the request body
    const body = await request.json();
    const { name, capacity, status, xPosition, yPosition, notes } = body;

    // Validate required fields
    if (!name || !capacity) {
      return NextResponse.json(
        { success: false, message: "Name and capacity are required" },
        { status: 400 }
      );
    }

    // Create the table
    const result = await db
      .insert(tables)
      .values({
        name,
        capacity: Number(capacity),
        status: status || "available",
        xPosition: xPosition !== undefined ? Number(xPosition) : 0,
        yPosition: yPosition !== undefined ? Number(yPosition) : 0,
        notes,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json(
      { success: true, table: result[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating table:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create table" },
      { status: 500 }
    );
  }
}
