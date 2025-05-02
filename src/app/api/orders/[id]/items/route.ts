import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema/orders";
import { orderItems } from "@/db/schema/order-items";
import { menuItems } from "@/db/schema/menu-items";
import { eq, and, inArray } from "drizzle-orm";
import { verifyToken } from "@/lib/auth-utils";

// POST /api/orders/[id]/items - Add items to an existing order
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: orderIdString } = await params;
    const orderId = parseInt(orderIdString);

    if (isNaN(orderId)) {
      return NextResponse.json(
        { success: false, message: "Invalid order ID" },
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

    // Only allow adding items to pending or in-progress orders
    if (
      existingOrder[0].status !== "pending" &&
      existingOrder[0].status !== "in-progress"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Cannot add items to a completed or cancelled order",
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: "At least one item is required" },
        { status: 400 }
      );
    }

    // Verify all menu items exist and calculate additional total
    let additionalTotal = 0;
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

      additionalTotal += parseFloat(menuItem.price.toString()) * item.quantity;
    }

    // Convert items to insert format
    const orderItemsToInsert = items.map((item: any) => {
      const menuItem = menuItemsMap.get(item.menuItemId);
      return {
        orderId,
        menuItemId: item.menuItemId,
        quantity: item.quantity || 1,
        price: menuItem.price.toString(),
        notes: item.notes || null,
        status: "pending",
      };
    });

    // Insert new order items
    await db.insert(orderItems).values(orderItemsToInsert);

    // Update order total
    const newTotal = (
      parseFloat(existingOrder[0].totalAmount.toString()) + additionalTotal
    ).toString();

    await db
      .update(orders)
      .set({
        totalAmount: newTotal,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    // Get the updated order with items
    const updatedOrder = await getOrderWithItems(orderId);

    return NextResponse.json({
      success: true,
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Error adding items to order:", error);
    return NextResponse.json(
      { success: false, message: "Failed to add items to order" },
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
