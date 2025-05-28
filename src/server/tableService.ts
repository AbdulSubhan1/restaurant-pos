import { db } from "@/db";
import { tables } from "@/db/schema/tables";
import { unstable_cache } from "next/cache";
import { eq } from "drizzle-orm";

export const getAllTables = unstable_cache(
  async () =>
    db
      .select()
      .from(tables)
      .where(eq(tables.active, true))
      .orderBy(tables.name),
  ["tables-all"],
  { revalidate: 60 }
);

export const getPaginatedTables = (page: number = 1, limit: number = 10) =>
  unstable_cache(
    async () => {
      const offset = (page - 1) * limit;
      const [items, totalResult] = await Promise.all([
        db
          .select()
          .from(tables)
          .where(eq(tables.active, true))
          .orderBy(tables.name)
          .limit(limit)
          .offset(offset),
        db
          .select({ count: tables.id })
          .from(tables)
          .where(eq(tables.active, true)),
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
    [`tables-paginated-${page}-${limit}`],
    { revalidate: 60 }
  )();
