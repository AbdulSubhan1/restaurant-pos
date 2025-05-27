import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { menuItems } from "@/db/schema/menu-items";
import { eq, and, isNull } from "drizzle-orm";
import { verifyToken } from "@/lib/auth-utils";
import { categories } from "@/db/schema/categories";

// GET /api/menu-items/[id] - Get a specific menu item by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: idString } = await params;
    const id = parseInt(idString);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid menu item ID" },
        { status: 400 }
      );
    }

    // Fetch menu item with category information
    const itemResult = await db
      .select({
        id: menuItems.id,
        name: menuItems.name,
        description: menuItems.description,
        price: menuItems.price,
        image: menuItems.imageUrl,
        available: menuItems.available,
        categoryId: menuItems.categoryId,
        createdAt: menuItems.createdAt,
        updatedAt: menuItems.updatedAt,
        categoryName: categories.name,
      })
      .from(menuItems)
      .leftJoin(categories, eq(menuItems.categoryId, categories.id))
      .where(eq(menuItems.id, id))
      .limit(1);
    if (!itemResult || itemResult.length === 0) {
      return NextResponse.json(
        { success: false, message: "Menu item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      menuItem: itemResult[0],
    });
  } catch (error) {
    console.error("Error fetching menu item:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch menu item" },
      { status: 500 }
    );
  }
}

// PUT /api/menu-items/[id] - Update a menu item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    // Only admin and manager can update menu items
    if (payload.role !== "admin" && payload.role !== "manager") {
      return NextResponse.json(
        { success: false, message: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { id: idString } = await params;
    const id = parseInt(idString);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid menu item ID" },
        { status: 400 }
      );
    }

    // Check if menu item exists
    const existingItem = await db
      .select()
      .from(menuItems)
      .where(eq(menuItems.id, id))
      .limit(1);

    if (!existingItem || existingItem.length === 0) {
      return NextResponse.json(
        { success: false, message: "Menu item not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      price,
      imageUrl,
      available,
      categoryId,
      preparationTime,
    } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { success: false, message: "Menu item name is required" },
        { status: 400 }
      );
    }

    if (
      price === undefined ||
      isNaN(parseFloat(price)) ||
      parseFloat(price) < 0
    ) {
      return NextResponse.json(
        { success: false, message: "Valid price is required" },
        { status: 400 }
      );
    }

    // Check if the category exists (if provided)
    if (categoryId) {
      const category = await db
        .select()
        .from(categories)
        .where(eq(categories.id, categoryId))
        .limit(1);

      if (!category || category.length === 0) {
        return NextResponse.json(
          { success: false, message: "Category not found" },
          { status: 400 }
        );
      }
    }

    // Update the menu item
    const updatedMenuItem = await db
      .update(menuItems)
      .set({
        name,
        description: description || null,
        price: price.toString(),
        imageUrl: imageUrl || null,
        available: available !== undefined ? available : true,
        preparationTime: preparationTime || null,
        categoryId: categoryId || null,
        updatedAt: new Date(),
      })
      .where(eq(menuItems.id, id))
      .returning();

    // Fetch the category information if there's a categoryId
    let categoryName = null;
    if (updatedMenuItem[0].categoryId) {
      const categoryResult = await db
        .select()
        .from(categories)
        .where(eq(categories.id, updatedMenuItem[0].categoryId))
        .limit(1);

      if (categoryResult && categoryResult.length > 0) {
        categoryName = categoryResult[0].name;
      }
    }

    return NextResponse.json({
      success: true,
      menuItem: {
        ...updatedMenuItem[0],
        categoryName,
      },
    });
  } catch (error) {
    console.error("Error updating menu item:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update menu item" },
      { status: 500 }
    );
  }
}

// DELETE /api/menu-items/[id] - Soft delete a menu item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || (payload.role !== "admin" && payload.role !== "manager")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    const { id: idString } = await params;
    const id = parseInt(idString);

    if (isNaN(id)) {
      return NextResponse.json({ success: false, message: "Invalid ID" }, { status: 400 });
    }

    // Check if item exists and is not deleted
    const existingItem = await db
      .select()
      .from(menuItems)
      .where(and(eq(menuItems.id, id), eq(menuItems.is_deleted, false)))


    if (!existingItem || existingItem.length === 0) {
      return NextResponse.json({ success: false, message: "Menu item not found" }, { status: 404 });
    }

    // Perform soft delete
  await db
  .update(menuItems)
  .set({ is_deleted: true })
  .where(eq(menuItems.id, id));

    return NextResponse.json({ success: true, message: "Menu item deleted successfully" });
  } catch (error) {
    console.error("Error deleting menu item:", error);
    return NextResponse.json({ success: false, message: "Failed to delete menu item" }, { status: 500 });
  }
}
