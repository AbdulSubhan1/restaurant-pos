"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import CategoriesTab from "@/components/menu/CategoriesTab";
import MenuItemsTab from "@/components/menu/MenuItemsTab";

export default function MenuTabs() {
  const [activeTab, setActiveTab] = useState("categories");

  return (
    <Tabs
      defaultValue="categories"
      className="w-full"
      onValueChange={setActiveTab}
    >
      <TabsList className="mb-6">
        <TabsTrigger value="categories">Categories</TabsTrigger>
        <TabsTrigger value="menuItems">Menu Items</TabsTrigger>
      </TabsList>

      <TabsContent value="categories">
        <CategoriesTab />
      </TabsContent>

      <TabsContent value="menuItems">
        <MenuItemsTab />
      </TabsContent>
    </Tabs>
  );
}
