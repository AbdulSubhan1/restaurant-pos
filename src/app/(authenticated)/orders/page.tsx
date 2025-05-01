"use client";

import OrderTabs from "@/components/orders/OrderTabs";

export default function OrdersPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Order Management</h1>

      <OrderTabs />
    </div>
  );
}
