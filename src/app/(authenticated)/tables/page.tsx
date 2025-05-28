import { getPaginatedTables } from "@/server/tableService";
import TablesViewWrapper from "@/features/tables/components/TablesViewWrapper";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Table Management - Restaurant POS",
  description: "Manage restaurant tables",
};

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function TablesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = parseInt(
    Array.isArray(params?.page) ? params.page[0] : params?.page || "1"
  );
  const limit = parseInt(
    Array.isArray(params?.limit) ? params.limit[0] : params?.limit || "10"
  );

  const paginatedTables = await getPaginatedTables(page, limit);
  const mappedTables = paginatedTables.items.map((table) => ({
    ...table,
    createdAt:
      typeof table.createdAt === "string"
        ? table.createdAt
        : table.createdAt.toISOString(),
    updatedAt:
      typeof table.updatedAt === "string"
        ? table.updatedAt
        : table.updatedAt.toISOString(),
  }));

  return (
    <div className="p-6">
      <TablesViewWrapper
        initialTables={mappedTables}
        pagination={{
          total: paginatedTables.total,
          page: paginatedTables.page,
          limit: paginatedTables.limit,
          totalPages: paginatedTables.totalPages,
        }}
      />
    </div>
  );
}
