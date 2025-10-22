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
import { PlusIcon, RefreshCw, Users, Split } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { MergeTableDialog } from "./MergeTableDialog";
import { SplitTableDialog } from "./SplitTableDialog";

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
  isMerged: boolean;
  mergedFromTables: number[] | null;
  originalTableData: any[] | null;
  createdAt: Date;
  updatedAt: Date;
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
  const [isMergeDialogOpen, setIsMergeDialogOpen] = useState(false);
  const [isSplitDialogOpen, setIsSplitDialogOpen] = useState(false);
  const [selectedMergedTable, setSelectedMergedTable] = useState<UITableType | null>(null);
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
            size="sm" 
            variant="outline"
            onClick={() => setIsMergeDialogOpen(true)}
            disabled={tables?.length < 2}
          >
            <Users className="h-4 w-4 mr-2" />
            Merge Tables
          </Button>
          <Button size="sm" id="addNew" onClick={() => router.push("/tables/new")}>
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
        ) : tables?.length === 0 ? (
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
              {tables?.map((table) => (
                <TableRow key={table.id}>
                  <TableCell className="font-medium">{table.name}</TableCell>
                  <TableCell>{table.capacity}</TableCell>
                  <TableCell>{getStatusBadge(table.id, table.status)}</TableCell>
                  <TableCell>{table.notes || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      {table.isMerged && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedMergedTable(table);
                            setIsSplitDialogOpen(true);
                          }}
                          className="text-green-600 hover:text-green-700"
                        >
                          <Split className="h-4 w-4 mr-1" />
                          Split
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/tables/${table.id}`)}
                      >
                        Edit
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </UITable>
        )}
      </CardContent>
      
      {/* Merge Table Dialog */}
      <MergeTableDialog
        isOpen={isMergeDialogOpen}
        onClose={() => setIsMergeDialogOpen(false)}
        onSuccess={() => {
          fetchTables();
          setIsMergeDialogOpen(false);
        }}
        availableTables={tables}
      />
      
      {/* Split Table Dialog */}
      <SplitTableDialog
        isOpen={isSplitDialogOpen}
        onClose={() => {
          setIsSplitDialogOpen(false);
          setSelectedMergedTable(null);
        }}
        onSuccess={() => {
          fetchTables();
          setIsSplitDialogOpen(false);
          setSelectedMergedTable(null);
        }}
        mergedTable={selectedMergedTable}
      />
    </Card>
  );
}
