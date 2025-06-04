"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Table } from "@/db/schema/tables";
import { Edit, Trash2 } from "lucide-react";
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
  const handleDeleteTable = async (tableId: number) => {
     try {
      const response = await fetch(`/api/tables/${tableId}`, {
      method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete menu item");
      }

      // Remove the item from the list
      setTables((prev) => prev.filter((item) => item.id !== tableId));
      toast.success("Menu item deleted successfully");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete menu item"
      );
      console.error("Error deleting menu item:", err);
    }
  };

  const getStatusBadge = (id: number, status: string) => {
    switch (status.toLowerCase()) {
      case "available":
        return <Badge onClick={() => toggleTableStatus(id, status)} className="bg-green-500 cursor-pointer">Available</Badge>;
      case "occupied":
        return <Badge onClick={() => toggleTableStatus(id, status)} className="bg-red-500 cursor-pointer">Occupied</Badge>;
      case "reserved":
        return <Badge onClick={() => toggleTableStatus(id, status)} className="bg-yellow-500 cursor-pointer">Reserved</Badge>;
      case "maintenance":
        return <Badge onClick={() => toggleTableStatus(id, status)} className="bg-gray-500 cursor-pointer">Maintenance</Badge>;
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
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => router.push("/tables/new")}>
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Table
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-12 h-12 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
          </div>
        ) : tables.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">No tables found.</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push("/tables/new")}
            >
              <PlusIcon className="w-4 h-4 mr-2" />
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
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tables.map((table) => (
                <TableRow key={table.id}>
                  <TableCell className="font-medium">{table.name}</TableCell>
                  <TableCell>{table.capacity}</TableCell>
                  <TableCell>{getStatusBadge(table.id, table.status)}</TableCell>
                  <TableCell>{table.notes || "-"}</TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/tables/${table.id}`)}
                        title="Edit table"
                    >
                    <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleDeleteTable(table.id)}
                  className="text-red-500 hover:text-red-700"
                  title="Delete table"
                >
                   <Trash2 className="w-4 h-4" />
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
