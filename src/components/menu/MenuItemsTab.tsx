"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import MenuItemList from "./MenuItemList";
import MenuItemForm from "./MenuItemForm";
import { toast } from "sonner";

// Define the MenuItem type
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

// Define the Category type
type Category = {
  id: number;
  name: string;
};

export default function MenuItemsTab() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Fetch menu items and categories on component mount
  useEffect(() => {
    fetchMenuItems();
    fetchCategories();
  }, []);

  // Function to fetch menu items from API
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

      // Make sure data.menuItems exists and is an array before setting state
      if (!data.menuItems || !Array.isArray(data.menuItems)) {
        console.warn("API did not return menu items array:", data);
        setMenuItems([]);
      } else {
        setMenuItems(data.menuItems);
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

  // Function to fetch categories for the dropdown
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
      // We don't set loading or error state here as it's a secondary fetch
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
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Menu Items</CardTitle>
          <Button
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
