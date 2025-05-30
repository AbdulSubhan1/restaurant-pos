"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ActiveOrdersTab from "@/components/orders/ActiveOrdersTab";
import OrderHistoryTab from "@/components/orders/OrderHistoryTab";
import KitchenDisplayTab from "@/components/orders/KitchenDisplayTab";
import useKeyboardShortcuts from "@/config/short-cut/hook";
import { useState } from "react";

const TabsConfig = [
  {
    label: "Active Orders",
    value: "active",
    component: <ActiveOrdersTab />
  },
  {
    label: "Order History",
    value: "history",
    component: <OrderHistoryTab />
  },
  {
    label: "Kitchen Display",
    value: "kitchen",
    component: <KitchenDisplayTab />
  }
]
export default function OrderTabs() {

  const [TabIndex, setTabIndex] = useState(0);
  useKeyboardShortcuts('orderScreen', {
    switchToRightTab: () => {
      console.log("right")
      if (TabIndex === TabsConfig.length - 1) return
      setTabIndex(TabIndex + 1);
    },
    switchToLeftTab: () => {
      console.log("left")
      if (TabIndex === 0) return
      setTabIndex(TabIndex - 1);
    },
  });

  console.log('TabIndex', TabIndex)

  return (
    <Tabs defaultValue="active" value={TabsConfig[TabIndex].value} className="w-full" >
      <TabsList className="mb-6">
        {
          TabsConfig.map((tab, index) => (
            <TabsTrigger key={tab.value} tabIndex={index} onClick={() => setTabIndex(index)} value={tab.value}>{tab.label}</TabsTrigger>
          ))
        }
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
