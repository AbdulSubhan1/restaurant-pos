import { db } from "@/db";
import { categories } from "@/db/schema/categories";
import { menuItems } from "@/db/schema/menu-items";
import { unstable_cache } from "next/cache";

export const getAllCategories = unstable_cache(
  async () => db.select().from(categories),
  ["categories-all"],
  { revalidate: 60 }
);

export const getAllMenuItems = unstable_cache(
  async () => db.select().from(menuItems),
  ["menu-items-all"],
  { revalidate: 60 }
);

export const getPaginatedMenuItems = (page: number = 1, limit: number = 10) =>
  unstable_cache(
    async () => {
      const offset = (page - 1) * limit;
      const [items, totalResult] = await Promise.all([
        db.select().from(menuItems).limit(limit).offset(offset),
        db.select({ count: menuItems.id }).from(menuItems),
      ]);
      const total = Number(totalResult[0]?.count ?? 0);
      return {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    },
    [`menu-items-paginated-${page}-${limit}`],
    { revalidate: 60 }
  )();
