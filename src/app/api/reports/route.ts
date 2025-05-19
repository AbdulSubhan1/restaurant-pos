import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  orders,
  orderItems,
  tables,
  menuItems,
  payments,
  users,
} from "@/db/schema";
import { eq, sql, gte, lte, and, count } from "drizzle-orm";
import {
  startOfDay,
  startOfWeek,
  startOfMonth,
  parseISO,
  isValid,
} from "date-fns";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "today";
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    // Get current date
    const today = new Date();
    let startDate: Date;
    let endDate: Date = new Date();
    let filterType: string = "period"; // Either "period" or "dateRange"

    // Check if valid date range is provided
    if (startDateParam && isValid(parseISO(startDateParam))) {
      startDate = parseISO(startDateParam);
      filterType = "dateRange";

      // If end date is provided and valid, use it
      if (endDateParam && isValid(parseISO(endDateParam))) {
        endDate = parseISO(endDateParam);

        // Ensure endDate is at the end of the day
        endDate.setHours(23, 59, 59, 999);
      } else {
        // If no valid end date, use current date as end date
        endDate.setHours(23, 59, 59, 999);
      }
    } else {
      // Default period-based filtering if no valid date range
      filterType = "period";

      // Set the start date based on the period
      switch (period) {
        case "week":
          startDate = startOfWeek(today);
          break;
        case "month":
          startDate = startOfMonth(today);
          break;
        case "today":
        default:
          startDate = startOfDay(today);
          break;
      }
    }

    // Create the date filter condition based on filter type
    const dateFilterCondition =
      filterType === "dateRange"
        ? and(
            gte(payments.createdAt, startDate),
            lte(payments.createdAt, endDate)
          )
        : gte(payments.createdAt, startDate);

    const orderDateFilterCondition =
      filterType === "dateRange"
        ? and(gte(orders.createdAt, startDate), lte(orders.createdAt, endDate))
        : gte(orders.createdAt, startDate);

    // Sales Overview
    const salesOverview = await db
      .select({
        totalOrders: count(),
        totalRevenue: sql<number>`sum(CAST(${payments.amount} AS numeric))`,
      })
      .from(payments)
      .leftJoin(orders, eq(payments.orderId, orders.id))
      .where(dateFilterCondition);

    // Popular Items
    const popularItems = await db
      .select({
        menuItemId: orderItems.menuItemId,
        menuItemName: menuItems.name,
        orderCount: count(),
        totalRevenue: sql<number>`sum(CAST(${orderItems.price} AS numeric) * ${orderItems.quantity})`,
      })
      .from(orderItems)
      .leftJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
      .leftJoin(orders, eq(orderItems.orderId, orders.id))
      .where(orderDateFilterCondition)
      .groupBy(orderItems.menuItemId, menuItems.name)
      .orderBy(() => sql`count(*) desc`)
      .limit(10);

    // Revenue Analysis by Payment Method
    const revenueByPaymentMethod = await db
      .select({
        paymentMethod: payments.paymentMethod,
        count: count(),
        total: sql<number>`sum(CAST(${payments.amount} AS numeric))`,
      })
      .from(payments)
      .where(dateFilterCondition)
      .groupBy(payments.paymentMethod);

    // Staff Performance (servers with most orders)
    const staffPerformance = await db
      .select({
        serverId: orders.serverId,
        serverName: users.name,
        orderCount: count(),
        totalRevenue: sql<number>`sum(CAST(${orders.totalAmount} AS numeric))`,
      })
      .from(orders)
      .leftJoin(users, eq(orders.serverId, users.id))
      .where(orderDateFilterCondition)
      .groupBy(orders.serverId, users.name)
      .orderBy(() => sql`count(*) desc`)
      .limit(5);

    // Table Occupancy
    const tableOccupancy = await db
      .select({
        status: tables.status,
        count: count(),
      })
      .from(tables)
      .groupBy(tables.status);

    return NextResponse.json({
      filterType,
      period: filterType === "period" ? period : undefined,
      dateRange:
        filterType === "dateRange"
          ? {
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
            }
          : undefined,
      salesOverview: salesOverview[0] || { totalOrders: 0, totalRevenue: 0 },
      popularItems,
      revenueByPaymentMethod,
      staffPerformance,
      tableOccupancy,
    });
  } catch (error) {
    console.error("Error fetching reports data:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports data" },
      { status: 500 }
    );
  }
}
