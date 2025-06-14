"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import MenuItemList from "./MenuItemList";
import MenuItemForm from "./MenuItemForm";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

// Define the MenuItem type for UI
type MenuItem = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  available: boolean; // This is the field name used in the database schema
  categoryId: number | null;
  createdAt: string;
  updatedAt: string;
  categoryName?: string;
};

// Add a type for DB menu items
// (matches the DB schema, with imageUrl)
type DBMenuItem = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  available: boolean;
  categoryId: number | null;
  createdAt: string;
  updatedAt: string;
  categoryName?: string;
};

// Define the Category type
type Category = {
  id: number;
  name: string;
};

// Add prop type
type MenuItemsTabProps = {
  initialMenuItems: DBMenuItem[];
  initialCategories: Category[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export default function MenuItemsTab({
  initialMenuItems,
  initialCategories,
  pagination,
}: MenuItemsTabProps) {
  // Map DB menu items to component's MenuItem type (imageUrl -> image)
  const mappedMenuItems: MenuItem[] = initialMenuItems.map((item) => ({
    ...item,
    image: item.imageUrl ?? null,
  }));
  const [menuItems, setMenuItems] = useState<MenuItem[]>(mappedMenuItems);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [loading, setLoading] = useState(false); // SSR: no loading on mount
  const [error, setError] = useState<string | null>(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Pagination controls
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`?${params.toString()}`);
  };

  // Add limit dropdown handler
  const handleLimitChange = (newLimit: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("limit", newLimit);
    params.set("page", "1"); // Reset to first page on limit change
    router.push(`?${params.toString()}`);
  };

  // Function to fetch menu items from API (for manual refresh)
  const fetchMenuItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/menu-items", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch menu items");
      }
      if (!data.menuItems || !Array.isArray(data.menuItems)) {
        setMenuItems([]);
      } else {
        const mappedData: MenuItem[] = data.menuItems.map(
          (item: DBMenuItem) => ({
            ...item,
            image: item.imageUrl ?? null,
          })
        );
        setMenuItems(mappedData);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      console.error("Error fetching menu items:", err);
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch categories for the dropdown (for manual refresh)
  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch categories");
      }
      setCategories(data.categories);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  // Function to add a new menu item
  const handleAddMenuItem = async (itemData: {
    name: string;
    description?: string;
    price: number;
    categoryId?: number;
    available?: boolean;
    image?: string;
  }) => {
    try {
      const response = await fetch("/api/menu-items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(itemData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create menu item");
      }

      // Add the new item to the list and update with category name if available
      const newItem = data.menuItem;
      if (newItem.categoryId) {
        const category = categories.find((c) => c.id === newItem.categoryId);
        if (category) {
          newItem.categoryName = category.name;
        }
      }

      setMenuItems((prev) => [...prev, newItem]);
      setIsAddingItem(false);
      toast.success("Menu item created successfully");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create menu item"
      );
      console.error("Error creating menu item:", err);
    }
  };

  // Function to update a menu item
  const handleUpdateMenuItem = async (
    id: number,
    itemData: {
      name: string;
      description?: string;
      price: number;
      categoryId?: number;
      available?: boolean;
      image?: string;
    }
  ) => {
    try {
      const response = await fetch(`/api/menu-items/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(itemData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update menu item");
      }

      // Update the item in the list with category name if available
      const updatedItem = data.menuItem;
      if (updatedItem.categoryId) {
        const category = categories.find(
          (c) => c.id === updatedItem.categoryId
        );
        if (category) {
          updatedItem.categoryName = category.name;
        }
      }

      setMenuItems((prev) =>
        prev.map((item) => (item.id === id ? updatedItem : item))
      );
      setEditingItem(null);
      toast.success("Menu item updated successfully");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update menu item"
      );
      console.error("Error updating menu item:", err);
    }
  };

  // Function to delete a menu item
  const handleDeleteMenuItem = async (id: number) => {
    try {
      const response = await fetch(`/api/menu-items/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete menu item");
      }

      // Remove the item from the list
      setMenuItems((prev) => prev.filter((item) => item.id !== id));
      toast.success("Menu item deleted successfully");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete menu item"
      );
      console.error("Error deleting menu item:", err);
    }
  };

  return (
    <div>
      <Card>
        {/* Limit Dropdown */}
        <div className="flex justify-end mb-2">
          <Select
            value={pagination.limit.toString()}
            onValueChange={handleLimitChange}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Rows per page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Menu Items</CardTitle>
          <Button
            id='addNew'
            onClick={() => setIsAddingItem(true)}
            className="ml-auto"
            disabled={isAddingItem}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Menu Item
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading menu items...</p>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded border border-red-200">
              <p className="text-red-600">{error}</p>
              <Button
                variant="outline"
                onClick={fetchMenuItems}
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          ) : (
            <>
              {isAddingItem && (
                <MenuItemForm
                  categories={categories}
                  onSubmit={(data) =>
                    handleAddMenuItem({
                      ...data,
                      image: data.imageUrl,
                    })
                  }
                  onCancel={() => setIsAddingItem(false)}
                />
              )}

              {editingItem && (
                <MenuItemForm
                  menuItem={{
                    ...editingItem,
                    imageUrl: editingItem.image,
                  }}
                  categories={categories}
                  onSubmit={(data) =>
                    handleUpdateMenuItem(editingItem.id, {
                      ...data,
                      image: data.imageUrl,
                    })
                  }
                  onCancel={() => setEditingItem(null)}
                />
              )}

              <MenuItemList
                menuItems={menuItems}
                onEdit={setEditingItem}
                onDelete={handleDeleteMenuItem}
              />

              {/* Pagination Controls */}
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-gray-500">
                  Showing page {pagination.page} of {pagination.totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
