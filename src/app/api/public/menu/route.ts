import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { menuItems } from "@/db/schema/menu-items";
import { categories } from "@/db/schema/categories";
import { eq } from "drizzle-orm";

// GET /api/public/menu - Get all menu items grouped by categories for public view
export async function GET(request: NextRequest) {
  try {
    // Fetch all available categories
    const allCategories = await db.select().from(categories);

    // Fetch all available menu items with their category information
    const allMenuItems = await db
      .select({
        id: menuItems.id,
        name: menuItems.name,
        description: menuItems.description,
        price: menuItems.price,
        imageUrl: menuItems.imageUrl,
        available: menuItems.available,
        categoryId: menuItems.categoryId,
      })
      .from(menuItems)
      .where(eq(menuItems.available, true)); // Only return available items

    // Group menu items by category
    const menuByCategory = allCategories.map((category) => {
      const items = allMenuItems.filter(
        (item) => item.categoryId === category.id
      );
      return {
        id: category.id,
        name: category.name,
        description: category.description,
        imageUrl: category.imageUrl,
        menuItems: items,
      };
    });

    // Only include categories that have available menu items
    const filteredMenu = menuByCategory.filter(
      (category) => category.menuItems.length > 0
    );

    return NextResponse.json({
      success: true,
      menu: filteredMenu,
    });
  } catch (error) {
    console.error("Error fetching public menu:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch menu" },
      { status: 500 }
    );
  }
}
