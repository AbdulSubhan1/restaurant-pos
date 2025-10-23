"use client";

import { useState, useEffect } from "react";
import { Table } from "@/db/schema/tables";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Settings, Users, Split } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MergeTableDialog } from "./MergeTableDialog";
import { SplitTableDialog } from "./SplitTableDialog";
import { ReservationCancelDialog } from "./ReservationCancelDialog";
import { ReservationTimeDisplay } from "./ReservationTimeDisplay";
import { TableStatusSelector } from "./TableStatusSelector";

export function TableLayout() {
  const [tables, setTables] = useState<Table[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMergeDialogOpen, setIsMergeDialogOpen] = useState(false);
  const [isSplitDialogOpen, setIsSplitDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [selectedMergedTable, setSelectedMergedTable] = useState<Table | null>(null);
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

  useEffect(() => {
    setIsLoading(true);
    fetchTables();
  }, []);

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case "available":
        return "bg-green-100 border-green-500";
      case "occupied":
        return "bg-red-100 border-red-500";
      case "reserved":
        return "bg-blue-100 border-blue-500";
      case "maintenance":
        return "bg-gray-100 border-gray-500";
      case "disabled":
        return "bg-slate-100 border-slate-500";
      case "cleaning":
        return "bg-yellow-100 border-yellow-500";
      default:
        return "bg-blue-100 border-blue-500";
    }
  };

  const getBadgeForStatus = (status: string, tableId: number) => {
    return (
      <TableStatusSelector
        tableId={tableId}
        currentStatus={status}
        onStatusChange={toggleTableStatus}
      />
    );
  };

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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Table Layout</CardTitle>
          <CardDescription>
            Visual representation of restaurant tables
          </CardDescription>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMergeDialogOpen(true)}
            disabled={tables.length < 2}
          >
            <Users className="h-4 w-4 mr-2" />
            Merge Tables
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTables}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
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
              Create your first table
            </Button>
          </div>
        ) : (
          <div className="relative bg-gray-50 border border-gray-200 rounded-md p-6 min-h-[400px]">
            {/* Simple grid representation of tables */}
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {tables.map((table) => (
                <div
                  key={table.id}
                  className={`relative flex flex-col items-center justify-center p-4 border-2 rounded-md transition-all hover:shadow-md ${getStatusColor(
                    table.status
                  )}`}
                >
                  <div className="text-lg font-semibold">{table.name}</div>
                  <div className="text-sm mb-2">Seats: {table.capacity}</div>
                  <div className="flex items-center gap-2 mb-2">
                    {getBadgeForStatus(table.status, table.id)}
                    {table.isMerged && (
                      <Badge className="bg-purple-100 text-purple-800 text-xs">
                        Merged
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {table.isMerged && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="p-1 h-6 w-6 text-green-600 hover:text-green-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMergedTable(table);
                          setIsSplitDialogOpen(true);
                        }}
                      >
                        <Split className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="p-1 h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/tables/${table.id}`);
                      }}
                    >
                      <Settings className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
