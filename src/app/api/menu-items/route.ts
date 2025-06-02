import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { menuItems } from "@/db/schema/menu-items";
import { categories } from "@/db/schema/categories";
import { verifyToken } from "@/lib/auth-utils";
import { and, eq } from "drizzle-orm";
import { SQL } from "drizzle-orm";
// Remove incorrect import and move logic into handler

// Example GET handler (add this if you don't already have one)
export async function GET(request: NextRequest) {
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
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status")?.toLowerCase();

  const conditions: SQL<unknown>[] = [
    eq(menuItems.is_deleted, false),
    eq(categories.is_deleted, false),
  ];

  if (status === "available") {
    conditions.push(eq(menuItems.available, true));
  } else if (status === "unavailable") {
    conditions.push(eq(menuItems.available, false));
  }
  // else (status is "all" or missing), don't add any availability filter

  const limit = Number(searchParams.get("limit")) || 10;
  const offset = Number(searchParams.get("offset")) || 0;

  const items = await db
    .select({
      id: menuItems.id,
      name: menuItems.name,
      description: menuItems.description,
      price: menuItems.price,
      imageUrl: menuItems.imageUrl,
      available: menuItems.available,
      preparationTime: menuItems.preparationTime,
      categoryId: menuItems.categoryId,
      createdAt: menuItems.createdAt,
      updatedAt: menuItems.updatedAt,
      categoryName: categories.name,
    })
    .from(menuItems)
    .leftJoin(categories, eq(menuItems.categoryId, categories.id))
    .where(and(...conditions))
    .limit(limit)
    .offset(offset);

  return NextResponse.json({ success: true, items });
}

// POST /api/menu-items - Create a new menu item
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

    // Only admin and manager can create menu items
    if (payload.role !== "admin" && payload.role !== "manager") {
      return NextResponse.json(
        { success: false, message: "Insufficient permissions" },
        { status: 403 }
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

    // Create the menu item
    const result = await db
      .insert(menuItems)
      .values({
        name,
        description: description || null,
        price: price.toString(),
        imageUrl: imageUrl || null,
        available: available !== undefined ? available : true,
        preparationTime: preparationTime || null,
        categoryId: categoryId || null,
      })
      .returning();

    const newMenuItem = result[0];

    // Fetch the category name if applicable
    let categoryName = null;
    if (newMenuItem.categoryId) {
      const categoryResult = await db
        .select({ name: categories.name })
        .from(categories)
        .where(eq(categories.id, newMenuItem.categoryId))
        .limit(1);

      if (categoryResult.length > 0) {
        categoryName = categoryResult[0].name;
      }
    }

    return NextResponse.json(
      {
        success: true,
        menuItem: {
          ...newMenuItem,
          categoryName,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating menu item:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create menu item" },
      { status: 500 }
    );
  }
}
