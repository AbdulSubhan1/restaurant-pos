import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, Order } from "@/db/schema/orders";
import { orderItems } from "@/db/schema/order-items";
import { tables } from "@/db/schema/tables";
import { users } from "@/db/schema/users";
import { menuItems } from "@/db/schema/menu-items";
import { eq, desc, and, inArray, or } from "drizzle-orm";
import { verifyToken } from "@/lib/auth-utils";

// GET /api/orders - Get all orders with optional filtering
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

    // Build query conditions
    
    let conditions = [];

    if (status) {
      // Handle comma-separated status values
      if (status.includes(",")) {
        const statusValues = status.split(",").map((s) => s.trim());
        conditions.push(
          or(...statusValues.map((value) => eq(orders.status, value)))
        );
      } else {
        conditions.push(eq(orders.status, status));
      }
    }

    if (tableId) {
      conditions.push(eq(orders.tableId, parseInt(tableId)));
    }

    if (date) {
      // This requires more complex date handling, for simplicity we'll skip it for now
    }

    // Fetch all orders with their table information
    let whereClause = undefined;
    if (conditions.length > 0) {
      whereClause = and(...conditions);
}

    const query = db
      .select({
        id: orders.id,
        tableId: orders.tableId,
        tableName: tables.name,
        serverId: orders.serverId,
        serverName: users.name,
        status: orders.status,
        totalAmount: orders.totalAmount,
        notes: orders.notes,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        completedAt: orders.completedAt,
      })
      .from(orders)
      .leftJoin(tables, eq(orders.tableId, tables.id))
      .leftJoin(users, eq(orders.serverId, users.id))
      .orderBy(desc(orders.createdAt));

    // Apply conditions if any
    const allOrders = whereClause
      ? await query.where(whereClause)
      : await query;

    // Fetch items for each order
    const ordersWithItems = await Promise.all(
      allOrders.map(async (order) => {
        const items = await db
          .select({
            id: orderItems.id,
            menuItemId: orderItems.menuItemId,
            menuItemName: menuItems.name,
            quantity: orderItems.quantity,
            price: orderItems.price,
            status: orderItems.status,
            notes: orderItems.notes,
            createdAt: orderItems.createdAt,
          })
          .from(orderItems)
          .leftJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
          .where(eq(orderItems.orderId, order.id));

        return {
          ...order,
          items,
        };
      })
    );

    return NextResponse.json({
      success: true,
      orders: ordersWithItems,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

// POST /api/orders - Create a new order
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
    const { tableId, notes, items } = body;

    // Validate required fields
    if (!tableId) {
      return NextResponse.json(
        { success: false, message: "Table ID is required" },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: "At least one item is required" },
        { status: 400 }
      );
    }

    // Check if table exists
    const table = await db
      .select()
      .from(tables)
      .where(eq(tables.id, tableId))
      .limit(1);

    if (!table || table.length === 0) {
      return NextResponse.json(
        { success: false, message: "Table not found" },
        { status: 400 }
      );
    }

    // Verify all menu items exist and calculate total
    let totalAmount = 0;
    const menuItemIds = items.map(
      (item: { menuItemId: number }) => item.menuItemId
    );

    const menuItemsData = await db
      .select({
        id: menuItems.id,
        price: menuItems.price,
      })
      .from(menuItems)
      .where(
        and(inArray(menuItems.id, menuItemIds), eq(menuItems.available, true))
      );

    // Create a map for quick lookup
    const menuItemsMap = new Map();
    menuItemsData.forEach((item) => {
      menuItemsMap.set(item.id, item);
    });

    // Validate all items exist and are available
    for (const item of items) {
      const menuItem = menuItemsMap.get(item.menuItemId);
      if (!menuItem) {
        return NextResponse.json(
          {
            success: false,
            message: `Menu item with ID ${item.menuItemId} does not exist or is not available`,
          },
          { status: 400 }
        );
      }

      totalAmount += parseFloat(menuItem.price.toString()) * item.quantity;
    }

    // Create the order
    const [newOrder] = await db
      .insert(orders)
      .values({
        tableId,
        serverId: payload.id, // Current user is the server
        status: "pending",
        totalAmount: totalAmount.toString(),
        notes: notes || null,
      })
      .returning();

    // Add order items
    const orderItemsToInsert = items.map((item: any) => {
      const menuItem = menuItemsMap.get(item.menuItemId);
      return {
        orderId: newOrder.id,
        menuItemId: item.menuItemId,
        quantity: item.quantity || 1,
        price: menuItem.price.toString(),
        notes: item.notes || null,
        status: "pending",
      };
    });

    await db.insert(orderItems).values(orderItemsToInsert);

    // Get the created order with items
    const orderWithItems = await getOrderWithItems(newOrder.id);

    return NextResponse.json(
      {
        success: true,
        order: orderWithItems,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create order" },
      { status: 500 }
    );
  }
}

// Helper function to get an order with its items
async function getOrderWithItems(orderId: number) {
  const orderData = await db
    .select({
      id: orders.id,
      tableId: orders.tableId,
      tableName: tables.name,
      serverId: orders.serverId,
      serverName: users.name,
      status: orders.status,
      totalAmount: orders.totalAmount,
      notes: orders.notes,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
      completedAt: orders.completedAt,
    })
    .from(orders)
    .leftJoin(tables, eq(orders.tableId, tables.id))
    .leftJoin(users, eq(orders.serverId, users.id))
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!orderData || orderData.length === 0) {
    return null;
  }

  const order = orderData[0];

  const items = await db
    .select({
      id: orderItems.id,
      menuItemId: orderItems.menuItemId,
      menuItemName: menuItems.name,
      quantity: orderItems.quantity,
      price: orderItems.price,
      status: orderItems.status,
      notes: orderItems.notes,
      createdAt: orderItems.createdAt,
    })
    .from(orderItems)
    .leftJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
    .where(eq(orderItems.orderId, orderId));

  return {
    ...order,
    items,
  };
}
