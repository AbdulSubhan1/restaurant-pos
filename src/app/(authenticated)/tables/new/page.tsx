"use client";

import { TableForm } from "@/features/tables/components/TableForm";

export default function NewTablePage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Add New Table</h1>
      <TableForm />
    </div>
  );
}
