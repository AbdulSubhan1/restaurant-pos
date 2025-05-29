"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Button } from "@/components/ui/button";
import { PlusIcon, RefreshCw } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

// Define a UI Table type
// (matches the UI needs, not DB schema directly)
type UITableType = {
  id: number;
  name: string;
  capacity: number;
  status: string;
  xPosition: number;
  yPosition: number;
  active: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

interface TablesListProps {
  initialTables: UITableType[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function TablesList({ initialTables, pagination }: TablesListProps) {
  const [tables, setTables] = useState<UITableType[]>(initialTables);
  const [isLoading, setIsLoading] = useState(false); // SSR: no loading on mount
  const router = useRouter();
  const searchParams = useSearchParams();

  const fetchTables = async () => {
    try {
      const url = new URL("/api/tables", window.location.origin);
      url.searchParams.append('page', pagination.page.toString());
      url.searchParams.append('limit', pagination.limit.toString());

      const response = await fetch(url.toString(), {
        cache: 'no-store',
        next: { revalidate: 0 },
      });
      const data = await response.json();
      console.log('data', response);

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
  const toggleTableStatus = async (tableId: number, currentStatus: string) => {
    const newStatus = currentStatus === "available" ? "occupied" : "available";

    console.log(`Updating table ${tableId} ${currentStatus} status to ${newStatus}`);

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
  }

  // Pagination controls
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`?${params.toString()}`);
  };
  // Limit dropdown handler
  const handleLimitChange = (newLimit: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("limit", newLimit);
    params.set("page", "1"); // Reset to first page on limit change
    router.push(`?${params.toString()}`);
  };

  const getStatusBadge = (table: UITableType, status: string) => {
    console.log(table.id, status);
    switch (table.status.toLowerCase()) {
      case "available":
        return <Badge onClick={() => toggleTableStatus(table.id, status)} className="bg-green-500 cursor-pointer">Available</Badge>;
      case "occupied":
        return <Badge onClick={() => toggleTableStatus(table.id, status)} className="bg-red-500 cursor-pointer">Occupied</Badge>;
      case "reserved":
        return <Badge onClick={() => toggleTableStatus(table.id, status)} className="bg-yellow-500 cursor-pointer">Reserved</Badge>;
      case "maintenance":
        return <Badge onClick={() => toggleTableStatus(table.id, status)} className="bg-gray-500 cursor-pointer">Maintenance</Badge>;
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
          <Button size="sm" onClick={() => router.push("/tables/new")}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Table
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Limit Dropdown */}
        <div className="flex justify-end mb-2">
          <Select
            value={pagination.limit.toString()}
            onValueChange={handleLimitChange}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Rows per page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
                  <TableCell>
                    {getStatusBadge(table, table.status)}
                  </TableCell>
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
        {/* Pagination Controls */}
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-500">
            Showing page {pagination.page} of {pagination.totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
