"use client";

import { useState } from "react";
import { TablesList } from "@/features/tables/components/TablesList";
import { TableLayout } from "@/features/tables/components/TableLayout";
import { ReservationExpiryManager } from "@/features/tables/components/ReservationExpiryManager";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List, Layout } from "lucide-react";
import Link from "next/link";

export default function TablesPage() {
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  return (
    <div className="p-6">
      {/* Auto-expiry manager runs in background */}
      <ReservationExpiryManager />
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Table Management</h1>
        <div className="flex space-x-2">
          <Link href="/tables/designer">
            <Button variant="outline" className="flex items-center gap-1">
              <Layout className="h-4 w-4" />
              <span className="hidden sm:inline">Layout Designer</span>
            </Button>
          </Link>
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

      {viewMode === "grid" ? <TableLayout /> : <TablesList initialTables={[]} pagination={{ total: 0, page: 1, limit: 10, totalPages: 0 }} />}
    </div>
  );
}
