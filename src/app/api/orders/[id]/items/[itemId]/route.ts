import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema/orders";
import { orderItems } from "@/db/schema/order-items";
import { menuItems } from "@/db/schema/menu-items";
import { eq } from "drizzle-orm";
import { verifyToken } from "@/lib/auth-utils";

// PUT /api/orders/[id]/items/[itemId] - Update an order item (quantity, notes, status)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
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
    const orderId = parseInt(paramsData.id);
    const itemId = parseInt(paramsData.itemId);

    if (isNaN(orderId) || isNaN(itemId)) {
      return NextResponse.json(
        { success: false, message: "Invalid order or item ID" },
        { status: 400 }
      );
    }

    // Check if order exists
    const existingOrder = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!existingOrder || existingOrder.length === 0) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    // Check if order item exists and belongs to the order
    const existingItem = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.id, itemId))
      .limit(1);

    if (!existingItem || existingItem.length === 0) {
      return NextResponse.json(
        { success: false, message: "Order item not found" },
        { status: 404 }
      );
    }

    if (existingItem[0].orderId !== orderId) {
      return NextResponse.json(
        { success: false, message: "Item does not belong to this order" },
        { status: 400 }
      );
    }

    // Only allow updating items in pending or in-progress orders
    if (
      existingOrder[0].status !== "pending" &&
      existingOrder[0].status !== "in-progress"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Cannot update items in a completed or cancelled order",
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { quantity, notes, status } = body;

    const updateData: any = {
      updatedAt: new Date(),
    };

    // Update quantity if provided
    if (quantity !== undefined) {
      if (quantity <= 0) {
        return NextResponse.json(
          { success: false, message: "Quantity must be greater than 0" },
          { status: 400 }
        );
      }
      updateData.quantity = quantity;
    }

    // Update notes if provided
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    // Update status if provided
    if (status) {
      // Validate status
      const validStatuses = [
        "pending",
        "in-progress",
        "ready",
        "served",
        "cancelled",
      ];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { success: false, message: "Invalid status" },
          { status: 400 }
        );
      }
      updateData.status = status;

      // If item is completed, set completed timestamp
      if (status === "ready" || status === "served") {
        updateData.completedAt = new Date();
      }
    }

    // Update the order item
    await db
      .update(orderItems)
      .set(updateData)
      .where(eq(orderItems.id, itemId));

    // Recalculate order total if quantity changed
    if (quantity !== undefined) {
      // Get all order items to recalculate total
      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));

      let totalAmount = 0;
      for (const item of items) {
        totalAmount += parseFloat(item.price.toString()) * item.quantity;
      }

      // Update order total
      await db
        .update(orders)
        .set({
          totalAmount: totalAmount.toString(),
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));
    }

    // Get the updated order with items
    const updatedOrder = await getOrderWithItems(orderId);

    return NextResponse.json({
      success: true,
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Error updating order item:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update order item" },
      { status: 500 }
    );
  }
}

// DELETE /api/orders/[id]/items/[itemId] - Remove an item from an order
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
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
    const orderId = parseInt(paramsData.id);
    const itemId = parseInt(paramsData.itemId);

    if (isNaN(orderId) || isNaN(itemId)) {
      return NextResponse.json(
        { success: false, message: "Invalid order or item ID" },
        { status: 400 }
      );
    }

    // Check if order exists
    const existingOrder = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!existingOrder || existingOrder.length === 0) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    // Only allow removing items from pending or in-progress orders
    if (
      existingOrder[0].status !== "pending" &&
      existingOrder[0].status !== "in-progress"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Cannot remove items from a completed or cancelled order",
        },
        { status: 400 }
      );
    }

    // Check if item exists and belongs to the order
    const existingItem = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.id, itemId))
      .limit(1);

    if (!existingItem || existingItem.length === 0) {
      return NextResponse.json(
        { success: false, message: "Order item not found" },
        { status: 404 }
      );
    }

    if (existingItem[0].orderId !== orderId) {
      return NextResponse.json(
        { success: false, message: "Item does not belong to this order" },
        { status: 400 }
      );
    }

    // Remove the item
    await db.delete(orderItems).where(eq(orderItems.id, itemId));

    // Recalculate order total
    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    let totalAmount = 0;
    for (const item of items) {
      totalAmount += parseFloat(item.price.toString()) * item.quantity;
    }

    // Update order total
    await db
      .update(orders)
      .set({
        totalAmount: totalAmount.toString(),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    // Check if order has no items left
    if (items.length === 0) {
      // If no items left, mark order as cancelled
      await db
        .update(orders)
        .set({
          status: "cancelled",
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));

      return NextResponse.json({
        success: true,
        message: "Item removed and order cancelled (no items left)",
      });
    }

    // Get the updated order with items
    const updatedOrder = await getOrderWithItems(orderId);

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: "Item removed successfully",
    });
  } catch (error) {
    console.error("Error removing order item:", error);
    return NextResponse.json(
      { success: false, message: "Failed to remove order item" },
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
      status: orders.status,
      serverId: orders.serverId,
      totalAmount: orders.totalAmount,
      notes: orders.notes,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
      completedAt: orders.completedAt,
    })
    .from(orders)
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
