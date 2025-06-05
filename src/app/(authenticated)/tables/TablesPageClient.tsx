"use client";

import { useState } from "react";
import { TablesList } from "@/features/tables/components/TablesList";
import { TableLayout } from "@/features/tables/components/TableLayout";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List } from "lucide-react";

export default function TablesPageClient() {
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Table Management</h1>
        <div className="flex space-x-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className="flex items-center gap-1"
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden sm:inline">Grid View</span>
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="flex items-center gap-1"
          >
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">List View</span>
          </Button>
        </div>
      </div>

      {viewMode === "grid" ? <TableLayout /> : <TablesList />}
    </div>
  );
}
