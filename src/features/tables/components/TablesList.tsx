"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Table } from "@/db/schema/tables";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table as UITable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PlusIcon, RefreshCw } from "lucide-react";

export function TablesList() {
  const [tables, setTables] = useState<Table[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchTables = async () => {
    try {
      const response = await fetch("/api/tables");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch tables");
      }

      setTables(data.tables);
    } catch (error) {
      console.error("Error fetching tables:", error);
      toast.error("Failed to load tables");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchTables();
  }, []);

  // Function to update table status (simplified for demo)
  const toggleTableStatus = async (tableId: number, currentStatus: string) => {
    const newStatus = currentStatus === "available" ? "occupied" : "available";

    try {
      const response = await fetch(`/api/tables/${tableId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to update table status");
      }

      // Refresh tables after update
      fetchTables();
      toast.success(`Table status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating table status:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update table status"
      );
    }
  };

  const getStatusBadge = (id: number, status: string) => {
    switch (status.toLowerCase()) {
      case "available":
        return <Badge onClick={() => toggleTableStatus(id, status)} className="cursor-pointer bg-green-500">Available</Badge>;
      case "occupied":
        return <Badge onClick={() => toggleTableStatus(id, status)} className="cursor-pointer bg-red-500">Occupied</Badge>;
      case "reserved":
        return <Badge onClick={() => toggleTableStatus(id, status)} className="cursor-pointer bg-yellow-500">Reserved</Badge>;
      case "maintenance":
        return <Badge onClick={() => toggleTableStatus(id, status)} className="cursor-pointer bg-gray-500">Maintenance</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Tables</CardTitle>
          <CardDescription>Manage your restaurant tables</CardDescription>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTables}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => router.push("/tables/new")}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Table
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : tables.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No tables found.</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push("/tables/new")}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add your first table
            </Button>
          </div>
        ) : (
          <UITable>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tables.map((table) => (
                <TableRow key={table.id}>
                  <TableCell className="font-medium">{table.name}</TableCell>
                  <TableCell>{table.capacity}</TableCell>
                  <TableCell>{getStatusBadge(table.id, table.status)}</TableCell>
                  <TableCell>{table.notes || "-"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/tables/${table.id}`)}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </UITable>
        )}
      </CardContent>
    </Card>
  );
}
