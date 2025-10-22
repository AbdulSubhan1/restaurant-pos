"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowRight, Users, Clock, AlertTriangle, Plus, X } from "lucide-react";
import { Table } from "@/db/schema/tables";

interface MergeTableDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  availableTables: Table[];
}

interface TableWithOrders extends Table {
  pendingOrdersCount?: number;
}

export function MergeTableDialog({
  isOpen,
  onClose,
  onSuccess,
  availableTables,
}: MergeTableDialogProps) {
  const [selectedTableIds, setSelectedTableIds] = useState<number[]>([]);
  const [mergedTableName, setMergedTableName] = useState<string>("");
  const [mergeNotes, setMergeNotes] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [tablesWithOrders, setTablesWithOrders] = useState<TableWithOrders[]>([]);

  // Filter out tables that are not active, are already merged, or in maintenance
  const filteredTables = availableTables?.filter((table: Table) =>
    table.active && table.status !== "maintenance" && !table.isMerged
  );

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedTableIds([]);
      setMergedTableName("");
      setMergeNotes("");
      fetchTablesWithOrders();
    }
  }, [isOpen]);

  const fetchTablesWithOrders = async () => {
    try {
      const response = await fetch("/api/orders");
      const data = await response.json();
      
      if (data.success) {
        // Count pending orders per table
        const orderCounts = data.orders.reduce((acc: Record<number, number>, order: any) => {
          if (order.status === "pending" && order.tableId) {
            acc[order.tableId] = (acc[order.tableId] || 0) + 1;
          }
          return acc;
        }, {});

        // Add order counts to tables
        const tablesWithOrderCounts = filteredTables.map(table => ({
          ...table,
          pendingOrdersCount: orderCounts[table.id] || 0,
        }));

        setTablesWithOrders(tablesWithOrderCounts);
      }
    } catch (error) {
      console.error("Error fetching tables with orders:", error);
    }
  };

  const addTableToSelection = (tableId: number) => {
    if (!selectedTableIds.includes(tableId)) {
      setSelectedTableIds([...selectedTableIds, tableId]);
    }
  };

  const removeTableFromSelection = (tableId: number) => {
    setSelectedTableIds(selectedTableIds.filter(id => id !== tableId));
  };

  const selectedTables = tablesWithOrders.filter(table => 
    selectedTableIds.includes(table.id)
  );

  const canMerge = selectedTableIds.length >= 2 && mergedTableName.trim().length > 0;

  const handleMerge = async () => {
    if (!canMerge) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/tables/merge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tableIds: selectedTableIds,
          mergedTableName: mergedTableName.trim(),
          mergeNotes: mergeNotes.trim() || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        onSuccess();
        onClose();
      } else {
        toast.error(data.message || "Failed to merge tables");
      }
    } catch (error) {
      console.error("Error merging tables:", error);
      toast.error("Failed to merge tables");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "available":
        return "bg-green-100 text-green-800";
      case "occupied":
        return "bg-red-100 text-red-800";
      case "reserved":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const totalCapacity = selectedTables.reduce((sum, table) => sum + table.capacity, 0);
  const totalOrders = selectedTables.reduce((sum, table) => sum + (table.pendingOrdersCount || 0), 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Merge Multiple Tables
          </DialogTitle>
          <DialogDescription>
            Select multiple tables to merge into a new combined table. All orders will be moved to the new table.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Merged Table Name */}
          <div className="space-y-2">
            <Label htmlFor="merged-table-name">New Merged Table Name</Label>
            <Input
              id="merged-table-name"
              placeholder="Enter name for the merged table..."
              value={mergedTableName}
              onChange={(e) => setMergedTableName(e.target.value)}
            />
          </div>

          {/* Table Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Select Tables to Merge</Label>
              <Badge variant="outline">
                {selectedTableIds.length} table(s) selected
              </Badge>
            </div>
            
            {/* Available Tables */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-40 overflow-y-auto border rounded-md p-3">
              {tablesWithOrders?.map((table) => (
                <div
                  key={table.id}
                  className={`flex items-center justify-between p-3 border rounded-md cursor-pointer transition-all ${
                    selectedTableIds.includes(table.id)
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => addTableToSelection(table.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 border-2 rounded border-gray-300 flex items-center justify-center">
                      {selectedTableIds.includes(table.id) && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{table.name}</p>
                      <p className="text-sm text-gray-600">
                        Capacity: {table.capacity}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(table.status)}>
                      {table.status}
                    </Badge>
                    {table.pendingOrdersCount! > 0 && (
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {table.pendingOrdersCount}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Tables Preview */}
          {selectedTables.length > 0 && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ArrowRight className="h-4 w-4" />
                  Merge Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {selectedTables.map((table) => (
                    <div key={table.id} className="flex items-center justify-between p-2 bg-white rounded border">
                      <div>
                        <p className="font-medium text-sm">{table.name}</p>
                        <p className="text-xs text-gray-600">
                          Capacity: {table.capacity}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeTableFromSelection(table.id)}
                        className="p-1 h-6 w-6"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                
                <div className="pt-2 border-t border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-800">
                        New Table: <span className="font-bold">{mergedTableName || "Unnamed"}</span>
                      </p>
                      <p className="text-sm text-blue-700">
                        Total Capacity: {totalCapacity} • Total Orders: {totalOrders}
                      </p>
                    </div>
                  </div>
                </div>

                {totalOrders > 0 && (
                  <div className="flex items-center gap-2 text-amber-700 bg-amber-100 p-2 rounded">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">
                      {totalOrders} pending order(s) will be moved to the new merged table
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Merge Notes */}
          <div className="space-y-2">
            <Label htmlFor="merge-notes">Merge Notes (Optional)</Label>
            <Textarea
              id="merge-notes"
              placeholder="Add notes about this merge operation..."
              value={mergeNotes}
              onChange={(e) => setMergeNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleMerge} 
            disabled={!canMerge || isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? "Merging..." : `Merge ${selectedTableIds.length} Tables`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
