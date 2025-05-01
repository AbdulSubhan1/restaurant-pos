"use client";

import { useState, useEffect } from "react";
import { TableForm } from "@/features/tables/components/TableForm";
import { notFound } from "next/navigation";
import { toast } from "sonner";
import { Table } from "@/db/schema/tables";

interface EditTablePageProps {
  params: Promise<{ id: string }>;
}

export default function EditTablePage({ params }: EditTablePageProps) {
  const [table, setTable] = useState<Table | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tableId, setTableId] = useState<string | null>(null);

  // First, resolve the params promise to get the ID
  useEffect(() => {
    async function resolveParams() {
      try {
        const resolvedParams = await params;
        setTableId(resolvedParams.id);
      } catch (error) {
        console.error("Error resolving params:", error);
        toast.error("Error loading table information");
        setIsLoading(false);
      }
    }

    resolveParams();
  }, [params]);

  // Once we have the ID, fetch the table data
  useEffect(() => {
    if (!tableId) return;

    const fetchTable = async () => {
      try {
        const response = await fetch(`/api/tables/${tableId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch table");
        }

        setTable(data.table);
      } catch (error) {
        console.error("Error fetching table:", error);
        toast.error("Failed to load table data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTable();
  }, [tableId]);

  if (!isLoading && !table) {
    return notFound();
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Edit Table</h1>
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        table && <TableForm initialData={table} isEditMode={true} />
      )}
    </div>
  );
}
