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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, Clock, AlertTriangle, Split } from "lucide-react";
import { Table } from "@/db/schema/tables";

interface SplitTableDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mergedTable: Table | null;
}

export function SplitTableDialog({
  isOpen,
  onClose,
  onSuccess,
  mergedTable,
}: SplitTableDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [totalOrdersCount, setTotalOrdersCount] = useState(0);

  // Fetch active orders count when dialog opens
  useEffect(() => {
    if (isOpen && mergedTable) {
      fetchActiveOrdersCount();
    }
  }, [isOpen, mergedTable]);

  const fetchActiveOrdersCount = async () => {
    if (!mergedTable) return;
    
    try {
      console.log("Fetching active orders for merged table:", mergedTable.id);
      // Only fetch orders that are still active (pending, in-progress, etc.)
      const response = await fetch(`/api/orders?tableId=${mergedTable.id}&status=pending,in-progress`);
      const data = await response.json();
      
      if (data.success) {
        setTotalOrdersCount(data.orders.length);
      }
    } catch (error) {
      console.error("Error fetching active orders:", error);
    }
  };

  const handleSplit = async () => {
    if (!mergedTable) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/tables/split", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mergedTableId: mergedTable.id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        onSuccess();
        onClose();
      } else {
        toast.error(data.message || "Failed to split table");
      }
    } catch (error) {
      console.error("Error splitting table:", error);
      toast.error("Failed to split table");
    } finally {
      setIsLoading(false);
    }
  };

  const canSplit = mergedTable && totalOrdersCount === 0;

  if (!mergedTable) {
    return null;
  }

  const originalTables = mergedTable.originalTableData || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Split className="h-5 w-5" />
            Split Merged Table
          </DialogTitle>
          <DialogDescription>
            Split the merged table "{mergedTable.name}" back into its original {originalTables.length} tables.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Merged Table Info */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4" />
                Current Merged Table
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{mergedTable.name}</p>
                  <p className="text-sm text-gray-600">
                    Capacity: {mergedTable.capacity} • Status: {mergedTable.status}
                  </p>
                </div>
                <Badge className="bg-blue-100 text-blue-800">
                  Merged Table
                </Badge>
              </div>
              
              {totalOrdersCount > 0 && (
                <div className="flex items-center gap-2 text-amber-700 bg-amber-100 p-2 rounded">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm">
                    {totalOrdersCount} active order(s) must be completed or cancelled before splitting
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Original Tables Preview */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Will Be Split Into
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {originalTables.map((table, index) => (
                  <div key={table.id} className="flex items-center justify-between p-3 bg-white rounded border">
                    <div>
                      <p className="font-medium text-sm">{table.name}</p>
                      <p className="text-xs text-gray-600">
                        Capacity: {table.capacity}
                      </p>
                      {table.notes && (
                        <p className="text-xs text-gray-500 mt-1">
                          Notes: {table.notes}
                        </p>
                      )}
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      Table {index + 1}
                    </Badge>
                  </div>
                ))}
              </div>
              
              <div className="pt-2 border-t border-green-200">
                <p className="text-sm font-medium text-green-800">
                  Total: {originalTables.length} tables will be reactivated
                </p>
                <p className="text-sm text-green-700">
                  Combined Capacity: {originalTables.reduce((sum, t) => sum + t.capacity, 0)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Warning Messages */}
          {totalOrdersCount > 0 ? (
            <div className="flex items-center gap-2 text-red-700 bg-red-100 p-3 rounded">
              <AlertTriangle className="h-5 w-5" />
              <div>
                <p className="font-medium">Cannot Split Table</p>
                <p className="text-sm">
                  Please complete or cancel all {totalOrdersCount} active order(s) before splitting this table.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-blue-700 bg-blue-100 p-3 rounded">
              <Users className="h-5 w-5" />
              <div>
                <p className="font-medium">Ready to Split</p>
                <p className="text-sm">
                  No active orders found. This table can be safely split back into its original tables.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSplit} 
            disabled={!canSplit || isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? "Splitting..." : `Split Into ${originalTables.length} Tables`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
