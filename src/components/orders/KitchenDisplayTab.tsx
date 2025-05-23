"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Check, ArrowRight, Bell } from "lucide-react";
import { toast } from "sonner";

// Define the types (same as in other tabs)
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

export default function KitchenDisplayTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch orders on component mount and at regular intervals
  useEffect(() => {
    fetchKitchenOrders();

    // Set up a refresh interval (every 15 seconds)
    const intervalId = setInterval(fetchKitchenOrders, 15000);

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  // Function to fetch kitchen orders (pending and in-progress)
  const fetchKitchenOrders = async () => {
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

      const pendingData = await pendingResponse.json();
      const inProgressData = await inProgressResponse.json();

      if (!pendingResponse.ok || !inProgressResponse.ok) {
        throw new Error("Failed to fetch orders");
      }

      // Combine all orders
      const allOrders = [
        ...(pendingData.orders || []),
        ...(inProgressData.orders || []),
      ];

      setOrders(allOrders);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      console.error("Error fetching kitchen orders:", err);
    } finally {
      setLoading(false);
    }
  };

  // Function to update order status
  const handleOrderStatusUpdate = async (
    orderId: number,
    newStatus: string
  ) => {
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

      // If ready, refresh the list after a short delay
      if (newStatus === "ready") {
        toast.success(`Order #${orderId} marked as ready for service`);
        setTimeout(fetchKitchenOrders, 1000);
      } else {
        toast.success(`Order #${orderId} is now in preparation`);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update order"
      );
      console.error("Error updating order:", err);
    }
  };

  // Function to update an item's status
  const handleItemStatusUpdate = async (
    orderId: number,
    itemId: number,
    newStatus: string
  ) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/items/${itemId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update item");
      }

      // Update the order in the list
      setOrders((prev) =>
        prev.map((order) => (order.id === orderId ? data.order : order))
      );

      toast.success(`Item marked as ${newStatus}`);

      // Check if all items are ready, if so, suggest marking the order as ready
      const updatedOrder = data.order;
      if (updatedOrder && updatedOrder.items) {
        const allItemsReady = updatedOrder.items.every(
          (item: OrderItem) => item.status === "ready"
        );
        if (allItemsReady && updatedOrder.status !== "ready") {
          toast.info(
            "All items for this order are ready. Consider marking the order as ready for service.",
            {
              action: {
                label: "Mark Ready",
                onClick: () => handleOrderStatusUpdate(orderId, "ready"),
              },
            }
          );
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update item");
      console.error("Error updating item:", err);
    }
  };

  // Calculate time passed since order creation
  const getTimePassed = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? "s" : ""}`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}h ${mins}m`;
    }
  };

  // Sort orders: pending first, then by creation time (oldest first)
  const sortedOrders = [...orders].sort((a, b) => {
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (a.status !== "pending" && b.status === "pending") return 1;

    // Then by creation time (oldest first)
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  // Determine if an order has been waiting too long (more than 15 mins for pending, 30 for in-progress)
  const isOrderUrgent = (order: Order) => {
    const created = new Date(order.createdAt);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    return (
      (order.status === "pending" && diffMins > 15) ||
      (order.status === "in-progress" && diffMins > 30)
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Kitchen Display</h2>
        <Button onClick={fetchKitchenOrders} variant="outline">
          Refresh
        </Button>
      </div>

      {loading && <p className="text-center py-4">Loading orders...</p>}

      {error && (
        <div className="bg-red-50 p-4 rounded border border-red-200 mb-6">
          <p className="text-red-600">{error}</p>
          <Button
            variant="outline"
            onClick={fetchKitchenOrders}
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
              No pending orders in the kitchen queue.
            </p>
          </CardContent>
        </Card>
      )}

      {sortedOrders.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sortedOrders.map((order) => {
            const isUrgent = isOrderUrgent(order);

            return (
              <Card
                key={order.id}
                className={`${isUrgent ? "border-red-500 border-2" : ""}`}
              >
                <CardHeader className={`pb-2 ${isUrgent ? "bg-red-50" : ""}`}>
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center">
                      {isUrgent && (
                        <Bell className="mr-1 h-5 w-5 text-red-500 animate-pulse" />
                      )}
                      Table {order.tableName} - Order #{order.id}
                    </CardTitle>
                    <div className="flex items-center text-sm">
                      <Clock className="h-4 w-4 mr-1 text-gray-500" />
                      <span
                        className={isUrgent ? "text-red-500 font-bold" : ""}
                      >
                        {getTimePassed(order.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between mt-2 text-sm text-gray-500">
                    <span>Server: {order.serverName}</span>
                    <span>
                      Status:{" "}
                      {order.status === "pending" ? "Pending" : "In Progress"}
                    </span>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold mb-3">Items:</h4>
                    <ul className="space-y-4">
                      {order.items.map((item) => (
                        <li
                          key={item.id}
                          className="flex justify-between items-center"
                        >
                          <div>
                            <span className="font-medium">
                              {item.quantity}x {item.menuItemName}
                            </span>
                            {item.notes && (
                              <p className="text-xs text-gray-500 mt-1">
                                Note: {item.notes}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center">
                            {item.status === "pending" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleItemStatusUpdate(
                                    order.id,
                                    item.id,
                                    "in-progress"
                                  )
                                }
                              >
                                Start
                              </Button>
                            )}

                            {item.status === "in-progress" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleItemStatusUpdate(
                                    order.id,
                                    item.id,
                                    "ready"
                                  )
                                }
                                className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                              >
                                Ready <Check className="ml-1 h-3 w-3" />
                              </Button>
                            )}

                            {item.status === "ready" && (
                              <span className="text-sm text-green-600 flex items-center">
                                <Check className="mr-1 h-4 w-4" /> Ready
                              </span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-6 pt-4 border-t flex justify-between">
                    {order.status === "pending" && (
                      <Button
                        className="w-full bg-blue-500 hover:bg-blue-600"
                        onClick={() =>
                          handleOrderStatusUpdate(order.id, "in-progress")
                        }
                      >
                        Start Preparing <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    )}

                    {order.status === "in-progress" && (
                      <Button
                        className="w-full bg-green-500 hover:bg-green-600"
                        onClick={() =>
                          handleOrderStatusUpdate(order.id, "ready")
                        }
                      >
                        Order Ready for Service{" "}
                        <Check className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
