"use client";

import { useSearchParams } from "next/navigation";
import ViewModeToggle from "./ViewModeToggle";
import { TablesList } from "./TablesList";
import { TableLayout } from "./TableLayout";

interface TablesViewWrapperProps {
  initialTables: any[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function TablesViewWrapper({
  initialTables,
  pagination,
}: TablesViewWrapperProps) {
  const searchParams = useSearchParams();
  const viewMode = searchParams.get("view") || "list";

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Table Management</h1>
        <ViewModeToggle currentMode={viewMode} />
      </div>
      {viewMode === "grid" ? (
        <TableLayout />
      ) : (
        <TablesList initialTables={initialTables} pagination={pagination} />
      )}
    </div>
  );
}
