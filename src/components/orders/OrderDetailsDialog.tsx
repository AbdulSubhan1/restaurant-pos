"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Check, Clock, CreditCard, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import PaymentDialog from "@/components/payments/PaymentDialog";

// Define the types
type OrderItem = {
  id: number;
  menuItemId: number;
  menuItemName: string;
  quantity: number;
  price: string;
  status: string;
  notes: string | null;
  createdAt: string;
};

type Order = {
  id: number;
  tableId: number;
  tableName: string;
  serverId: number;
  serverName: string;
  status: string;
  totalAmount: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  items: OrderItem[];
};

interface OrderDetailsDialogProps {
  order: Order;
  onClose: () => void;
  onStatusChange?: (orderId: number, status: string) => void;
  readOnly?: boolean;
}

// Define Receipt type
interface Receipt {
  orderId: number;
  amount: string;
  paymentMethod: string;
  reference: string;
  [key: string]: unknown;
}

export default function OrderDetailsDialog({
  order,
  onClose,
  onStatusChange,
  readOnly = false,
}: OrderDetailsDialogProps) {
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  // Calculate total
  const subtotal = parseFloat(order.totalAmount);

  // Function to update order status
  const handleStatusChange = (status: string) => {
    if (onStatusChange) {
      onStatusChange(order.id, status);
    }
    onClose();
  };

  // Process payment
  const handleProcessPayment = () => {
    setShowPaymentDialog(true);
  };

  // Handle payment completion
  const handlePaymentComplete = () => {
    toast.success("Payment processed successfully");
    if (onStatusChange) {
      onStatusChange(order.id, "paid");
    }
    setShowPaymentDialog(false);
  };

  // Get a friendly status display
  const getStatusDisplay = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace(/-/g, " ");
  };

  // Get status badge class
  const getStatusClass = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      case "ready":
        return "bg-green-100 text-green-800";
      case "served":
        return "bg-purple-100 text-purple-800";
      case "completed":
        return "bg-purple-100 text-purple-800";
      case "paid":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // If payment dialog is showing, render it
  if (showPaymentDialog) {
    return (
      <PaymentDialog
        order={order}
        onClose={() => setShowPaymentDialog(false)}
        onPaymentComplete={handlePaymentComplete}
      />
    );
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Order #{order.id}</span>
            <span
              className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(
                order.status
              )}`}
            >
              {getStatusDisplay(order.status)}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex justify-between text-sm mb-4">
          <div>
            <p className="font-medium">Table</p>
            <p>{order.tableName}</p>
          </div>
          <div>
            <p className="font-medium">Server</p>
            <p>{order.serverName}</p>
          </div>
          <div>
            <p className="font-medium">Created</p>
            <p>{formatDate(order.createdAt)}</p>
          </div>
        </div>

        {order.notes && (
          <div className="bg-muted/50 p-3 rounded-md mb-4">
            <p className="text-sm font-medium mb-1">Notes:</p>
            <p className="text-sm">{order.notes}</p>
          </div>
        )}

        <div className="border rounded-md">
          <div className="bg-muted/50 p-2 border-b">
            <h3 className="font-medium text-sm">Order Items</h3>
          </div>
          <ul className="divide-y">
            {order.items.map((item) => (
              <li key={item.id} className="p-3 flex justify-between">
                <div>
                  <div className="flex items-center">
                    <span className="font-medium">{item.quantity}x</span>
                    <span className="ml-2">{item.menuItemName}</span>
                  </div>
                  {item.notes && (
                    <p className="text-xs text-gray-500 mt-1">
                      Note: {item.notes}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div>
                    {formatCurrency(parseFloat(item.price) * item.quantity)}
                  </div>
                  {!readOnly &&
                    order.status !== "paid" &&
                    order.status !== "cancelled" && (
                      <span
                        className={`text-xs ${item.status === "pending"
                            ? "text-yellow-600"
                            : item.status === "in-progress"
                              ? "text-blue-600"
                              : "text-green-600"
                          }`}
                      >
                        {getStatusDisplay(item.status)}
                      </span>
                    )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between">
            <span className="font-medium">Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between font-bold mt-2">
            <span>Total</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
        </div>

        <DialogFooter className="flex !flex-col sm:flex-row gap-2 mt-6">
          {!readOnly && (
            <>
              {order.status === "pending" && (
                <Button
                  onClick={() => handleStatusChange("in-progress")}
                  className="w-full bg-blue-500 hover:bg-blue-600"
                >
                  <Clock className="mr-2 h-4 w-4" /> Start Preparation
                </Button>
              )}

              {order.status === "in-progress" && (
                <Button
                  onClick={() => handleStatusChange("ready")}
                  className="w-full bg-green-500 hover:bg-green-600"
                >
                  <Check className="mr-2 h-4 w-4" /> Mark as Ready
                </Button>
              )}

              {order.status === "ready" && (
                <Button
                  onClick={() => handleStatusChange("served")}
                  className="w-full bg-purple-500 hover:bg-purple-600"
                >
                  <Check className="mr-2 h-4 w-4" /> Mark as Served
                </Button>
              )}

              {order.status === "served" && (
                <Button
                  onClick={() => handleStatusChange("completed")}
                  className="w-full bg-indigo-500 hover:bg-indigo-600"
                >
                  <Check className="mr-2 h-4 w-4" /> Complete Order
                </Button>
              )}

              {order.status !== "paid" && order.status !== "cancelled" && (
                <Button
                  id="processOrder"
                  onClick={handleProcessPayment}
                  variant="outline"
                  className="w-full mt-2"
                >
                  <CreditCard className="mr-2 h-4 w-4" /> Process Payment
                </Button>
              )}

              {order.status !== "cancelled" && order.status !== "paid" && (
                <Button
                  id="cancelOrder"
                  variant="outline"
                  onClick={() => handleStatusChange("cancelled")}
                  className="w-full text-red-500 hover:text-red-600"
                >
                  <X className="mr-2 h-4 w-4" /> Cancel Order
                </Button>
              )}
            </>
          )}

          <Button variant="outline" onClick={onClose} className="w-full">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
