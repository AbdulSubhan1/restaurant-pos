import { Suspense } from "react";
import { ReservationsList } from "@/features/tables/components/ReservationsList";
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

export default async function ReservationsPage() {
  const tables = await getTables();

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Reservations</h1>
        <p className="text-muted-foreground">
          Manage table reservations and bookings
        </p>
      </div>
      
      <Suspense fallback={<div>Loading reservations...</div>}>
        <ReservationsList initialTables={tables} />
      </Suspense>
    </div>
  );
}
