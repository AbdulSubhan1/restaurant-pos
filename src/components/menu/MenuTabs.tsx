"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import CategoriesTab from "@/components/menu/CategoriesTab";
import MenuItemsTab from "@/components/menu/MenuItemsTab";

// Add prop types
interface MenuTabsProps {
  initialCategories: any[];
  initialMenuItems: any[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function MenuTabs({
  initialCategories,
  initialMenuItems,
  pagination,
}: MenuTabsProps) {
  return (
    <Tabs defaultValue="categories" className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="categories">Categories</TabsTrigger>
        <TabsTrigger value="menuItems">Menu Items</TabsTrigger>
      </TabsList>

      <TabsContent value="categories">
        <CategoriesTab initialCategories={initialCategories} />
      </TabsContent>

      <TabsContent value="menuItems">
        <MenuItemsTab
          initialMenuItems={initialMenuItems}
          initialCategories={initialCategories}
          pagination={pagination}
        />
      </TabsContent>
    </Tabs>
  );
}
