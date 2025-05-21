"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import CategoryList from "./CategoryList";
import CategoryForm from "./CategoryForm";
import { toast } from "sonner";

// Define the Category type
type Category = {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function CategoriesTab() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Function to fetch categories from API
  const fetchCategories = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/categories", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Ensure cookies are sent with the request
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch categories");
      }

      setCategories(data.categories);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      console.error("Error fetching categories:", err);
    } finally {
      setLoading(false);
    }
  };

  // Function to add a new category
  const handleAddCategory = async (categoryData: {
    name: string;
    description?: string;
    imageUrl?: string;
  }) => {
    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(categoryData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create category");
      }

      // Add the new category to the list
      setCategories((prev) => [...prev, data.category]);
      setIsAddingCategory(false);
      toast.success("Category created successfully");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create category"
      );
      console.error("Error creating category:", err);
    }
  };

  // Function to update a category
  const handleUpdateCategory = async (
    id: number,
    categoryData: {
      name: string;
      description?: string;
      imageUrl?: string;
    }
  ) => {
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(categoryData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update category");
      }

      // Update the category in the list
      setCategories((prev) =>
        prev.map((cat) => (cat.id === id ? data.category : cat))
      );
      setEditingCategory(null);
      toast.success("Category updated successfully");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update category"
      );
      console.error("Error updating category:", err);
    }
  };

  // Function to delete a category
  const handleDeleteCategory = async (id: number) => {
  try {
    const response = await fetch(`/api/categories/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    const data = await response.json();
console.log("Delete response:", response.status, data);
    if (!response.ok) {
      throw new Error(data.message || "Failed to delete category");
    }

    setCategories((prev) => prev.filter((cat) => cat.id !== id));
    toast.success("Category deleted successfully");
  } catch (err) {
    toast.error(
      err instanceof Error ? err.message : "Failed to delete category"
    );
    console.error(`Error deleting category with id ${id}:`, err);
  }
};


  return (
    <div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Categories</CardTitle>
          <Button
            onClick={() => setIsAddingCategory(true)}
            className="ml-auto"
            disabled={isAddingCategory}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Category
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading categories...</p>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded border border-red-200">
              <p className="text-red-600">{error}</p>
              <Button
                variant="outline"
                onClick={fetchCategories}
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          ) : (
            <>
              {isAddingCategory && (
                <CategoryForm
                  onSubmit={handleAddCategory}
                  onCancel={() => setIsAddingCategory(false)}
                />
              )}

              {editingCategory && (
                <CategoryForm
                  category={editingCategory}
                  onSubmit={(data) =>
                    handleUpdateCategory(editingCategory.id, data)
                  }
                  onCancel={() => setEditingCategory(null)}
                />
              )}

              <CategoryList
                categories={categories}
                onEdit={setEditingCategory}
                onDelete={handleDeleteCategory}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
