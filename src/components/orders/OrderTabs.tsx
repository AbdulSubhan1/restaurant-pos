"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ActiveOrdersTab from "@/components/orders/ActiveOrdersTab";
import OrderHistoryTab from "@/components/orders/OrderHistoryTab";
import KitchenDisplayTab from "@/components/orders/KitchenDisplayTab";

export default function OrderTabs() {
  const [activeTab, setActiveTab] = useState("active");

  return (
    <Tabs defaultValue="active" className="w-full" onValueChange={setActiveTab}>
      <TabsList className="mb-6">
        <TabsTrigger value="active">Active Orders</TabsTrigger>
        <TabsTrigger value="history">Order History</TabsTrigger>
        <TabsTrigger value="kitchen">Kitchen Display</TabsTrigger>
      </TabsList>

      <TabsContent value="active">
        <ActiveOrdersTab />
      </TabsContent>

      <TabsContent value="history">
        <OrderHistoryTab />
      </TabsContent>

      <TabsContent value="kitchen">
        <KitchenDisplayTab />
      </TabsContent>
    </Tabs>
  );
}
