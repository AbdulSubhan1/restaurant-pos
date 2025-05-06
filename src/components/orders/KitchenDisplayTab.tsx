"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Check, ArrowRight, Bell, AlertCircle } from "lucide-react";
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

      // Fetch in-progress orders (now called "started")
      const startedResponse = await fetch("/api/orders?status=in-progress", {
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

      const pendingData = await pendingResponse.json();
      const startedData = await startedResponse.json();
      const readyData = await readyResponse.json();

      if (!pendingResponse.ok || !startedResponse.ok || !readyResponse.ok) {
        throw new Error("Failed to fetch orders");
      }

      // Combine all orders
      const allOrders = [
        ...(pendingData.orders || []),
        ...(startedData.orders || []),
        ...(readyData.orders || []),
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

  // Function to check if all items in an order are ready
  const areAllItemsReady = (order: Order): boolean => {
    return order.items.every((item) => item.status === "ready");
  };

  // Function to update order status
  const handleOrderStatusUpdate = async (
    orderId: number,
    newStatus: string
  ) => {
    try {
      // If attempting to mark as ready, check if all items are ready
      if (newStatus === "ready") {
        const order = orders.find((o) => o.id === orderId);
        if (order && !areAllItemsReady(order)) {
          toast.error(
            "All items must be ready before marking the order as ready for service"
          );
          return;
        }
      }

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

      // Create a human-readable status message
      let statusMessage = newStatus;
      if (newStatus === "pending") statusMessage = "pending";
      if (newStatus === "in-progress") statusMessage = "started";
      if (newStatus === "in-process") statusMessage = "cooking";
      if (newStatus === "ready") statusMessage = "ready";

      toast.success(`Item marked as ${statusMessage}`);

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
    // First by status priority (pending > in-progress > ready)
    const statusPriority = {
      pending: 0,
      "in-progress": 1,
      ready: 2,
    };

    const priorityA =
      statusPriority[a.status as keyof typeof statusPriority] || 999;
    const priorityB =
      statusPriority[b.status as keyof typeof statusPriority] || 999;

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

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

  // Get a count of items by status for an order
  const getItemStatusCounts = (order: Order) => {
    // Initialize with new status names
    const counts = {
      pending: 0,
      started: 0,
      cooking: 0,
      ready: 0,
      total: order.items.length,
    };

    order.items.forEach((item) => {
      // Map old status names to new ones
      let countKey: keyof typeof counts;

      if (item.status === "pending") countKey = "pending";
      else if (item.status === "in-progress") countKey = "started";
      else if (item.status === "in-process") countKey = "cooking";
      else if (item.status === "ready") countKey = "ready";
      else countKey = "pending"; // Default fallback

      counts[countKey] += 1;
    });

    return counts;
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
        return "bg-indigo-100 text-indigo-800";
      case "paid":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
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
            const statusCounts = getItemStatusCounts(order);
            const allReady = areAllItemsReady(order);

            return (
              <Card
                key={order.id}
                className={`${isUrgent ? "border-red-500 border-2" : ""}`}
              >
                <CardHeader
                  className={`pb-2 ${
                    isUrgent
                      ? "bg-red-50"
                      : order.status === "ready"
                      ? "bg-green-50"
                      : ""
                  }`}
                >
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

                  {/* Item status summary */}
                  <div className="flex gap-2 mt-2 text-xs">
                    <span className="px-2 py-1 rounded bg-red-100 text-red-700">
                      Pending: {statusCounts.pending}
                    </span>
                    <span className="px-2 py-1 rounded bg-blue-100 text-blue-700">
                      Started: {statusCounts.started}
                    </span>
                    <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-700">
                      Cooking: {statusCounts.cooking}
                    </span>
                    <span className="px-2 py-1 rounded bg-green-100 text-green-700">
                      Ready: {statusCounts.ready}/{statusCounts.total}
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
                                    "started"
                                  )
                                }
                              >
                                Start
                              </Button>
                            )}

                            {(item.status === "in-progress" ||
                              item.status === "started") && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleItemStatusUpdate(
                                    order.id,
                                    item.id,
                                    "cooking"
                                  )
                                }
                                className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                              >
                                Cooking
                              </Button>
                            )}

                            {(item.status === "in-process" ||
                              item.status === "cooking") && (
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
                        className={`w-full ${
                          allReady
                            ? "bg-green-500 hover:bg-green-600"
                            : "bg-gray-400 hover:bg-gray-500"
                        }`}
                        onClick={() =>
                          handleOrderStatusUpdate(order.id, "ready")
                        }
                        disabled={!allReady}
                      >
                        {allReady ? (
                          <>
                            Order Ready for Service{" "}
                            <Check className="ml-2 h-4 w-4" />
                          </>
                        ) : (
                          <>
                            Waiting for Items{" "}
                            <AlertCircle className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    )}

                    {order.status === "ready" && (
                      <Button
                        className="w-full bg-purple-500 hover:bg-purple-600"
                        onClick={() =>
                          handleOrderStatusUpdate(order.id, "served")
                        }
                      >
                        Mark as Served <Check className="ml-2 h-4 w-4" />
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
