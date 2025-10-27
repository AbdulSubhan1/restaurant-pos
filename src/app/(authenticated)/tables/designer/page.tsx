import { Suspense } from "react";
import { TableLayoutDesigner } from "@/features/tables/components/TableLayoutDesigner";
import { db } from "@/db";
import { tables } from "@/db/schema";
import { eq } from "drizzle-orm";

async function getTables() {
  try {
    const allTables = await db
      .select()
      .from(tables)
      .where(eq(tables.active, true))
      .orderBy(tables.name);

    return allTables;
  } catch (error) {
    console.error("Error fetching tables:", error);
    return [];
  }
}

export default async function TableLayoutDesignerPage() {
  const tables = await getTables();

  return (
    <Suspense fallback={<div>Loading layout designer...</div>}>
      <TableLayoutDesigner initialTables={tables} />
    </Suspense>
  );
}
