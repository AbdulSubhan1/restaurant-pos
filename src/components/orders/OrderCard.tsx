"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ReactNode } from "react";

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

interface OrderCardProps {
  order: Order;
  onViewDetails: () => void;
  actionButton?: ReactNode;
}

export default function OrderCard({
  order,
  onViewDetails,
  actionButton,
}: OrderCardProps) {
  // Get order status in a display-friendly format
  const getStatusDisplay = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace(/-/g, " ");
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onViewDetails}
    >
      <CardContent className="p-4">
        <div className="flex flex-col space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium">Table {order.tableName}</h3>
              <p className="text-sm text-gray-500">Order #{order.id}</p>
            </div>
            <span
              className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                order.status === "pending"
                  ? "bg-yellow-100 text-yellow-800"
                  : order.status === "in-progress"
                  ? "bg-blue-100 text-blue-800"
                  : order.status === "ready"
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {getStatusDisplay(order.status)}
            </span>
          </div>

          <div className="text-xs text-gray-500">
            <div className="flex justify-between mb-1">
              <span>Server:</span>
              <span>{order.serverName}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span>Created:</span>
              <span>{formatDate(order.createdAt)}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span>Items:</span>
              <span>{order.items?.length || 0}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Total:</span>
              <span>{formatCurrency(parseFloat(order.totalAmount))}</span>
            </div>
          </div>

          {actionButton && (
            <div className="mt-2" onClick={(e) => e.stopPropagation()}>
              {actionButton}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
