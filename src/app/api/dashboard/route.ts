import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, tables, menuItems, payments } from "@/db/schema";
import { eq, sql, and, gte, count, sum } from "drizzle-orm";

export async function GET() {
  try {
    // Get current date
    const today = new Date();
    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);

    // Start of week (Sunday)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Start of month
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Get today's orders count
    const todayOrdersCount = await db
      .select({ count: count() })
      .from(orders)
      .where(gte(orders.createdAt, startOfToday))
      .then((result) => result[0]?.count || 0);

    // Get today's revenue
    const todayRevenue = await db
      .select({
        total: sql<number>`sum(CAST(${payments.amount} AS numeric))`,
      })
      .from(payments)
      .where(gte(payments.createdAt, startOfToday))
      .then((result) => result[0]?.total || 0);

    // Get active orders count
    const activeOrdersCount = await db
      .select({ count: count() })
      .from(orders)
      .where(
        and(eq(orders.status, "pending"), sql`${orders.status} != 'cancelled'`)
      )
      .then((result) => result[0]?.count || 0);

    // Get total tables count
    const tablesCount = await db
      .select({ count: count() })
      .from(tables)
      .then((result) => result[0]?.count || 0);

    // Get occupied tables count
    const occupiedTablesCount = await db
      .select({ count: count() })
      .from(tables)
      .where(eq(tables.status, "occupied"))
      .then((result) => result[0]?.count || 0);

    // Get weekly revenue
    const weeklyRevenue = await db
      .select({
        total: sql<number>`sum(CAST(${payments.amount} AS numeric))`,
      })
      .from(payments)
      .where(gte(payments.createdAt, startOfWeek))
      .then((result) => result[0]?.total || 0);

    // Get weekly orders count
    const weeklyOrdersCount = await db
      .select({ count: count() })
      .from(orders)
      .where(gte(orders.createdAt, startOfWeek))
      .then((result) => result[0]?.count || 0);

    // Get top selling items for the week
    const topSellingItems = await db
      .select({
        menuItemId: orderItems.menuItemId,
        menuItemName: menuItems.name,
        count: count(),
        total: sql<number>`sum(CAST(${orderItems.price} AS numeric) * ${orderItems.quantity})`,
      })
      .from(orderItems)
      .leftJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
      .leftJoin(orders, eq(orderItems.orderId, orders.id))
      .where(gte(orders.createdAt, startOfWeek))
      .groupBy(orderItems.menuItemId, menuItems.name)
      // Using raw SQL for ordering to avoid type errors
      .orderBy(
        (eb) =>
          sql`sum(CAST(${orderItems.price} AS numeric) * ${orderItems.quantity}) desc`
      )
      .limit(5);

    return NextResponse.json({
      metrics: {
        todayOrdersCount,
        todayRevenue,
        activeOrdersCount,
        tablesCount,
        occupiedTablesCount,
        availableTablesCount: tablesCount - occupiedTablesCount,
        tableOccupancyRate:
          tablesCount > 0 ? (occupiedTablesCount / tablesCount) * 100 : 0,
        weeklyRevenue,
        weeklyOrdersCount,
      },
      topSellingItems,
    });
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard metrics" },
      { status: 500 }
    );
  }
}
