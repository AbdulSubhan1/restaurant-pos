import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema/orders";
import { orderItems } from "@/db/schema/order-items";
import { tables } from "@/db/schema/tables";
import { users } from "@/db/schema/users";
import { menuItems } from "@/db/schema/menu-items";
import { eq, and } from "drizzle-orm";
import { verifyToken } from "@/lib/auth-utils";

// GET /api/orders/[id] - Get a specific order by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid order ID" },
        { status: 400 }
      );
    }

    // Get order details with table and server information
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
      .where(eq(orders.id, id))
      .limit(1);

    if (!orderData || orderData.length === 0) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    // Get order items with their menu item details
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
      .where(eq(orderItems.orderId, id));

    return NextResponse.json({
      success: true,
      order: {
        ...orderData[0],
        items,
      },
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch order" },
      { status: 500 }
    );
  }
}

// PUT /api/orders/[id] - Update order status, notes, or table
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const paramsData = await params;
    const id = parseInt(paramsData.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { message: "Invalid order ID" },
        { status: 400 }
      );
    }

    // Check if order exists
    const existingOrder = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    if (!existingOrder || existingOrder.length === 0) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { status, notes, tableId } = body;

    const updateData: any = {
      updatedAt: new Date(),
    };

    // Only update provided fields
    if (status) {
      updateData.status = status;

      // If completing the order, set completedAt
      if (status === "completed" || status === "paid") {
        updateData.completedAt = new Date();
      }
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    if (tableId) {
      // Verify table exists
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

      updateData.tableId = tableId;
    }

    // Update the order
    const updatedOrder = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, id))
      .returning();

    // Get the updated order with items
    const orderWithItems = await getOrderWithItems(id);

    return NextResponse.json({
      success: true,
      order: orderWithItems,
    });
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update order" },
      { status: 500 }
    );
  }
}

// DELETE /api/orders/[id] - Cancel an order
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Only admin, manager, or original server can cancel orders
    if (payload.role !== "admin" && payload.role !== "manager") {
      // Check if user is the server who created the order
      const orderId = parseInt(params.id);
      if (isNaN(orderId)) {
        return NextResponse.json(
          { success: false, message: "Invalid order ID" },
          { status: 400 }
        );
      }

      const orderData = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (!orderData || orderData.length === 0) {
        return NextResponse.json(
          { success: false, message: "Order not found" },
          { status: 404 }
        );
      }

      if (orderData[0].serverId !== payload.id) {
        return NextResponse.json(
          { success: false, message: "Insufficient permissions" },
          { status: 403 }
        );
      }
    }

    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid order ID" },
        { status: 400 }
      );
    }

    // Update order to cancelled status (soft delete)
    await db
      .update(orders)
      .set({
        status: "cancelled",
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id));

    return NextResponse.json({
      success: true,
      message: "Order cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling order:", error);
    return NextResponse.json(
      { success: false, message: "Failed to cancel order" },
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
