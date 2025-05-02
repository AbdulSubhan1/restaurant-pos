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
import { eq, sql, gte, count } from "drizzle-orm";
import { startOfDay, startOfWeek, startOfMonth } from "date-fns";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "today";

    // Get current date
    const today = new Date();
    let startDate: Date;

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

    // Sales Overview
    const salesOverview = await db
      .select({
        totalOrders: count(),
        totalRevenue: sql<number>`sum(CAST(${payments.amount} AS numeric))`,
      })
      .from(payments)
      .leftJoin(orders, eq(payments.orderId, orders.id))
      .where(gte(payments.createdAt, startDate));

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
      .where(gte(orders.createdAt, startDate))
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
      .where(gte(payments.createdAt, startDate))
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
      .where(gte(orders.createdAt, startDate))
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
      period,
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
