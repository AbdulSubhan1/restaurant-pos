import { db } from "./index";
import { users, categories, menuItems, tables } from "./schema";
import { hashPassword } from "@/lib/auth-utils";
import * as dotenv from "dotenv";
import { eq } from "drizzle-orm";

dotenv.config();

async function seed() {
  try {
    console.log("Starting database seeding...");

    // Create default admin user
    const hashedPassword = await hashPassword("admin123");
    await db
      .insert(users)
      .values({
        name: "Admin User",
        email: "admin@restaurant.com",
        password: hashedPassword,
        role: "admin",
      })
      .onConflictDoNothing({ target: users.email });
    console.log("Admin user created");

    // Create sample categories
    const sampleCategories = [
      { name: "Appetizers", description: "Starter dishes" },
      { name: "Main Course", description: "Primary dishes" },
      { name: "Desserts", description: "Sweet treats" },
      { name: "Beverages", description: "Drinks and refreshments" },
    ];

    for (const category of sampleCategories) {
      await db
        .insert(categories)
        .values(category)
        .onConflictDoNothing({ target: categories.name });
    }
    console.log("Sample categories created");

    // Get category IDs from the database
    const categoryRecords = await db.select().from(categories);
    const categoryMap = new Map(
      categoryRecords.map((cat) => [cat.name, cat.id])
    );

    // Create sample menu items with the correct category IDs
    const sampleMenuItems = [
      {
        name: "Garlic Bread",
        description: "Toasted bread with garlic butter",
        price: "5.99",
        categoryId: categoryMap.get("Appetizers"),
        preparationTime: 5,
      },
      {
        name: "Spaghetti Bolognese",
        description: "Classic pasta with meat sauce",
        price: "12.99",
        categoryId: categoryMap.get("Main Course"),
        preparationTime: 15,
      },
      {
        name: "Chocolate Cake",
        description: "Rich chocolate cake with icing",
        price: "6.99",
        categoryId: categoryMap.get("Desserts"),
        preparationTime: 3,
      },
      {
        name: "Iced Tea",
        description: "Refreshing sweet iced tea",
        price: "2.99",
        categoryId: categoryMap.get("Beverages"),
        preparationTime: 2,
      },
    ];

    // Insert menu items one by one
    for (const item of sampleMenuItems) {
      // Check if this menu item already exists
      const existingItem = await db
        .select()
        .from(menuItems)
        .where(eq(menuItems.name, item.name))
        .limit(1);

      if (existingItem.length === 0) {
        await db.insert(menuItems).values(item);
      }
    }
    console.log("Sample menu items created");

    // Create sample tables
    const sampleTables = [
      { name: "Table 1", capacity: 2, xPosition: 100, yPosition: 100 },
      { name: "Table 2", capacity: 4, xPosition: 250, yPosition: 100 },
      { name: "Table 3", capacity: 4, xPosition: 400, yPosition: 100 },
      { name: "Table 4", capacity: 6, xPosition: 100, yPosition: 250 },
      { name: "Table 5", capacity: 8, xPosition: 250, yPosition: 250 },
    ];

    for (const table of sampleTables) {
      // Check if this table already exists
      const existingTable = await db
        .select()
        .from(tables)
        .where(eq(tables.name, table.name))
        .limit(1);

      if (existingTable.length === 0) {
        await db.insert(tables).values(table);
      }
    }
    console.log("Sample tables created");

    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

seed();
