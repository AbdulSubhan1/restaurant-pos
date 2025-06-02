"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Clock,
  Check,
  ArrowRight,
  Utensils,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import CreateOrderDialog from "./CreateOrderDialog";
import OrderCard from "./OrderCard";
import OrderDetailsDialog from "./OrderDetailsDialog";

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

// Define a new type for OrderItem in form submissions that matches CreateOrderDialog
type OrderItemInput = {
  menuItemId: number;
  menuItemName: string;
  quantity: number;
  price: string;
  notes: string;
};

// Define the OrderData type for new orders
type OrderData = {
  tableId: number;
  notes: string;
  items: OrderItemInput[];
};

export default function ActiveOrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Fetch active orders on component mount and at regular intervals
  useEffect(() => {
    fetchActiveOrders();

    // Set up a refresh interval (every 30 seconds)
    const intervalId = setInterval(fetchActiveOrders, 30000);

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  // Function to fetch active orders
  const fetchActiveOrders = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch pending orders
      const pendingResponse = await fetch("/api/orders?status=pending", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      // Fetch in-progress orders
      const inProgressResponse = await fetch("/api/orders?status=in-progress", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      // Fetch ready orders
      const readyResponse = await fetch("/api/orders?status=ready", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      // Fetch served orders
      const servedResponse = await fetch("/api/orders?status=served", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const pendingData = await pendingResponse.json();
      const inProgressData = await inProgressResponse.json();
      const readyData = await readyResponse.json();
      const servedData = await servedResponse.json();

      if (
        !pendingResponse.ok ||
        !inProgressResponse.ok ||
        !readyResponse.ok ||
        !servedResponse.ok
      ) {
        throw new Error("Failed to fetch orders");
      }

      // Combine all orders
      const allOrders = [
        ...(pendingData.orders || []),
        ...(inProgressData.orders || []),
        ...(readyData.orders || []),
        ...(servedData.orders || []),
      ];

      setOrders(allOrders);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  // Function to handle order status updates
  const handleStatusUpdate = async (orderId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update order");
      }

      // Update the order in the list
      setOrders((prev) =>
        prev.map((order) => (order.id === orderId ? data.order : order))
      );

      toast.success(`Order #${orderId} marked as ${newStatus}`);

      // If completed or cancelled, refresh the list after a short delay
      if (newStatus === "completed" || newStatus === "cancelled") {
        setTimeout(fetchActiveOrders, 1000);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update order"
      );
      console.error("Error updating order:", err);
    }
  };

  // Function to add a new order
  const handleAddOrder = async (orderData: OrderData) => {
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create order");
      }

      // Add the new order to the list and close the dialog
      setOrders((prev) => [data.order, ...prev]);
      setIsCreatingOrder(false);
      toast.success("Order created successfully");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create order"
      );
      console.error("Error creating order:", err);
    }
  };

  // Group orders by status
  const pendingOrders = orders.filter((order) => order.status === "pending");
  const inProgressOrders = orders.filter(
    (order) => order.status === "in-progress"
  );
  const readyOrders = orders.filter((order) => order.status === "ready");
  const servedOrders = orders.filter((order) => order.status === "served");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Active Orders</h2>
        <Button onClick={() => setIsCreatingOrder(true)}>
          <Plus className="w-4 h-4 mr-2" /> New Order
        </Button>
      </div>

      {loading && <p className="py-4 text-center">Loading orders...</p>}

      {error && (
        <div className="p-4 mb-6 border border-red-200 rounded bg-red-50">
          <p className="text-red-600">{error}</p>
          <Button
            variant="outline"
            onClick={fetchActiveOrders}
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">
              No active orders. Create a new order to get started.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Pending Orders Column */}
        <div>
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2 text-yellow-500" />
                Pending Orders
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingOrders.length === 0 ? (
                <p className="py-2 text-center text-gray-500">
                  No pending orders
                </p>
              ) : (
                pendingOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onViewDetails={() => {
                      setSelectedOrder(order);
                      setShowDetails(true);
                    }}
                    actionButton={
                      <Button
                        size="sm"
                        onClick={() =>
                          handleStatusUpdate(order.id, "in-progress")
                        }
                        className="w-full bg-blue-500 hover:bg-blue-600"
                      >
                        Start Preparing <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    }
                  />
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* In Progress Orders Column */}
        <div>
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center">
                <Utensils className="w-5 h-5 mr-2 text-blue-500" />
                In Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {inProgressOrders.length === 0 ? (
                <p className="py-2 text-center text-gray-500">
                  No in-progress orders
                </p>
              ) : (
                inProgressOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onViewDetails={() => {
                      setSelectedOrder(order);
                      setShowDetails(true);
                    }}
                    // actionButton={
                    //   <Button
                    //     size="sm"
                    //     onClick={() => handleStatusUpdate(order.id, "ready")}
                    //     className="w-full bg-green-500 hover:bg-green-600"
                    //   >
                    //     Mark Ready <Check className="w-4 h-4 ml-2" />
                    //   </Button>
                    // }
                  />
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Ready Orders Column */}
        <div>
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                Ready for Service
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {readyOrders.length === 0 ? (
                <p className="py-2 text-center text-gray-500">
                  No orders ready for service
                </p>
              ) : (
                readyOrders.map((order) => (
                  <div key={order.id} className="relative">
                    <OrderCard
                      order={order}
                      onViewDetails={() => {
                        setSelectedOrder(order);
                        setShowDetails(true);
                      }}
                    />
                    {/* <div className="flex justify-end mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-purple-700 border-purple-200 bg-purple-50 hover:bg-purple-100"
                        onClick={() => handleStatusUpdate(order.id, "served")}
                      >
                        Mark as Served
                      </Button>
                    </div> */}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Served Orders Column */}
        <div>
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center">
                <Check className="w-5 h-5 mr-2 text-purple-500" />
                Served Orders
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {servedOrders.length === 0 ? (
                <p className="py-2 text-center text-gray-500">
                  No served orders
                </p>
              ) : (
                servedOrders.map((order) => (
                  <div key={order.id} className="relative">
                    <OrderCard
                      order={order}
                      onViewDetails={() => {
                        setSelectedOrder(order);
                        setShowDetails(true);
                      }}
                    />
                    <div className="flex justify-end mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-indigo-700 border-indigo-200 bg-indigo-50 hover:bg-indigo-100"
                        onClick={() =>
                          handleStatusUpdate(order.id, "completed")
                        }
                      >
                        Complete Order
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Order Dialog */}
      {isCreatingOrder && (
        <CreateOrderDialog
          onClose={() => setIsCreatingOrder(false)}
          onSubmit={(data: {
            tableId: number;
            notes: string;
            items: OrderItemInput[];
          }) => handleAddOrder(data)}
        />
      )}

      {/* Order Details Dialog */}
      {showDetails && selectedOrder && (
        <OrderDetailsDialog
          order={selectedOrder}
          onClose={() => {
            setShowDetails(false);
            setSelectedOrder(null);
          }}
          onStatusChange={handleStatusUpdate}
        />
      )}
    </div>
  );
}
