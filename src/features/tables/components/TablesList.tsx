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
import { PlusIcon, RefreshCw, Users, Split, Calendar, RotateCcw } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { MergeTableDialog } from "./MergeTableDialog";
import { SplitTableDialog } from "./SplitTableDialog";
import { ReservationFormDialog } from "./ReservationFormDialog";
import { ReservationCancelDialog } from "./ReservationCancelDialog";
import { ReservationTimeDisplay } from "./ReservationTimeDisplay";
import { TableStatusSelector } from "./TableStatusSelector";

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
  const [isReservationDialogOpen, setIsReservationDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [selectedMergedTable, setSelectedMergedTable] = useState<UITableType | null>(null);
  const [selectedTableForCancel, setSelectedTableForCancel] = useState<{
    tableId: number;
    tableName: string;
    reservation: any;
    newStatus?: string;
  } | null>(null);
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

  const syncTableStatuses = async () => {
    try {
      const response = await fetch("/api/tables/sync-status", {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        fetchTables(); // Refresh tables after sync
      } else {
        toast.error(data.message || "Failed to sync table statuses");
      }
    } catch (error) {
      console.error("Error syncing table statuses:", error);
      toast.error("Failed to sync table statuses");
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchTables();
  }, []);

  // Function to update table status with reservation handling
  const toggleTableStatus = async (tableId: number, newStatus: string) => {
    // If changing from reserved to another status, show confirmation dialog
    const currentTable = tables.find(t => t.id === tableId);
    if (currentTable?.status === "reserved" && newStatus !== "reserved") {
      try {
        // Fetch reservation details
        const reservationsResponse = await fetch(`/api/reservations?tableId=${tableId}&status=confirmed`);
        const reservationsData = await reservationsResponse.json();
        
        if (reservationsData.success && reservationsData.reservations.length > 0) {
          const reservation = reservationsData.reservations[0];
          
          setSelectedTableForCancel({
            tableId,
            tableName: currentTable.name || `Table ${tableId}`,
            newStatus,
            reservation: {
              id: reservation.id,
              customerName: reservation.customerName,
              customerPhone: reservation.customerPhone,
              reservationDate: reservation.reservationDate,
              reservationTime: reservation.reservationTime,
              partySize: reservation.partySize,
              duration: reservation.duration,
            }
          });
          setIsCancelDialogOpen(true);
          return; // Don't proceed with status change
        }
      } catch (error) {
        console.error("Error fetching reservation details:", error);
        toast.error("Failed to fetch reservation details");
        return;
      }
    }

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

  const handleReservationCancel = async () => {
    if (!selectedTableForCancel) return;

    try {
      const cancelResponse = await fetch(`/api/reservations/${selectedTableForCancel.reservation.id}`, {
        method: "DELETE",
      });
      
      if (!cancelResponse.ok) {
        const cancelData = await cancelResponse.json();
        throw new Error(cancelData.message || "Failed to cancel reservation");
      }
      
      // Update table status to the originally selected status
      const tableResponse = await fetch(`/api/tables/${selectedTableForCancel.tableId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: selectedTableForCancel.newStatus || "available",
        }),
      });

      if (!tableResponse.ok) {
        const tableData = await tableResponse.json();
        throw new Error(tableData.message || "Failed to update table status");
      }
      
      toast.success("Reservation cancelled and table made available");
      fetchTables(); // Refresh tables
    } catch (error) {
      console.error("Error cancelling reservation:", error);
      toast.error("Failed to cancel reservation");
      throw error; // Re-throw to let dialog handle it
    }
  };

  const getStatusBadge = (id: number, status: string) => {
    return (
      <TableStatusSelector
        tableId={id}
        currentStatus={status}
        onStatusChange={toggleTableStatus}
      />
    );
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
            onClick={syncTableStatuses}
            disabled={isLoading}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Sync Status
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setIsReservationDialogOpen(true)}
            disabled={tables?.length === 0}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Reserve Table
          </Button>
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
      
      {/* Reservation Form Dialog */}
      <ReservationFormDialog
        isOpen={isReservationDialogOpen}
        onClose={() => setIsReservationDialogOpen(false)}
        onSuccess={() => {
          fetchTables();
          setIsReservationDialogOpen(false);
        }}
        availableTables={tables}
      />
      
      {/* Reservation Cancel Dialog */}
      <ReservationCancelDialog
        isOpen={isCancelDialogOpen}
        onClose={() => {
          setIsCancelDialogOpen(false);
          setSelectedTableForCancel(null);
        }}
        onConfirm={handleReservationCancel}
        tableName={selectedTableForCancel?.tableName || ""}
        reservation={selectedTableForCancel?.reservation || null}
      />
    </Card>
  );
}
