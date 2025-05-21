import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments } from "@/db/schema/payments";
import { desc, eq, and, like, gte, lte, or, sql } from "drizzle-orm";

// GET /api/payments - Get all payments with optional filters
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const token = request.cookies.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const paymentMethod = searchParams.get("paymentMethod");
    const dateRange = searchParams.get("date");
    const search = searchParams.get("search");

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build where conditions
    let whereConditions = [];

    if (paymentMethod && paymentMethod !== "all") {
      whereConditions.push(eq(payments.paymentMethod, paymentMethod));
    }

  if (search) {
    const isNumeric = /^\d+$/.test(search); // Check if search is a number

    if (isNumeric) {
      whereConditions.push(eq(payments.orderId, Number(search)));
    } else {
      whereConditions.push(like(payments.reference, `%${search}%`));
    }
  }

    // Handle date ranges
    const now = new Date();
    if (dateRange) {
      switch (dateRange) {
        case "today":
          const today = new Date(now);
          today.setHours(0, 0, 0, 0);
          whereConditions.push(gte(payments.createdAt, today));
          break;
        case "yesterday":
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          yesterday.setHours(0, 0, 0, 0);
          const yesterdayEnd = new Date(now);
          yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
          yesterdayEnd.setHours(23, 59, 59, 999);
          whereConditions.push(
            and(
              gte(payments.createdAt, yesterday),
              lte(payments.createdAt, yesterdayEnd)
            )
          );
          break;
        case "week":
          const week = new Date(now);
          week.setDate(week.getDate() - 7);
          whereConditions.push(gte(payments.createdAt, week));
          break;
        case "month":
          const month = new Date(now);
          month.setMonth(month.getMonth() - 1);
          whereConditions.push(gte(payments.createdAt, month));
          break;
      }
    }

    // Query to get total count
    const totalQuery =
      whereConditions.length > 0
        ? db
            .select({ count: payments.id })
            .from(payments)
            .where(and(...whereConditions))
        : db.select({ count: payments.id }).from(payments);

    // Query to get paginated results
    const paymentsQuery =
      whereConditions.length > 0
        ? db
            .select()
            .from(payments)
            .where(and(...whereConditions))
            .orderBy(desc(payments.createdAt))
            .limit(limit)
            .offset(offset)
        : db
            .select()
            .from(payments)
            .orderBy(desc(payments.createdAt))
            .limit(limit)
            .offset(offset);

    // Execute queries
    const [totalResult, paymentsResult] = await Promise.all([
      totalQuery,
      paymentsQuery,
    ]);

    // Get total count
    const total = totalResult.length;

    return NextResponse.json({
      success: true,
      payments: paymentsResult,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { message: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}
