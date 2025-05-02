"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, GripVertical, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import CategoryForm from "./CategoryForm";
import Image from "next/image";
import { cn } from "@/lib/utils";

type Category = {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  position?: number;
  createdAt: string;
  updatedAt: string;
};

export default function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [hoveredItemIndex, setHoveredItemIndex] = useState<number | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);

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

      // Add position property based on array index
      const categoriesWithPosition = data.categories.map(
        (cat: Category, index: number) => ({
          ...cat,
          position: index,
        })
      );

      setCategories(categoriesWithPosition);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      console.error("Error fetching categories:", err);
    } finally {
      setLoading(false);
    }
  };

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

      // Add position property to new category at the end
      const newCategory = {
        ...data.category,
        position: categories.length,
      };

      setCategories((prev) => [...prev, newCategory]);
      setIsAddingCategory(false);
      toast.success("Category created successfully");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create category"
      );
      console.error("Error creating category:", err);
    }
  };

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

      // Preserve position when updating categories
      const updatedCategory = {
        ...data.category,
        position: categories.find((c) => c.id === id)?.position || 0,
      };

      setCategories((prev) =>
        prev.map((cat) => (cat.id === id ? updatedCategory : cat))
      );
      toast.success("Category updated successfully");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update category"
      );
      console.error("Error updating category:", err);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (
      !confirm(
        "Are you sure you want to delete this category? This may affect menu items assigned to this category."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to delete category");
      }

      // Remove the deleted category and update positions
      const updatedCategories = categories
        .filter((cat) => cat.id !== id)
        .map((cat, index) => ({ ...cat, position: index }));

      setCategories(updatedCategories);
      toast.success("Category deleted successfully");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete category"
      );
      console.error("Error deleting category:", err);
    }
  };

  const handleDragStart = (index: number) => {
    setIsDragging(true);
    setDraggedItemIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setHoveredItemIndex(index);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (
      draggedItemIndex === null ||
      hoveredItemIndex === null ||
      draggedItemIndex === hoveredItemIndex
    ) {
      setDraggedItemIndex(null);
      setHoveredItemIndex(null);
      return;
    }

    // Reorder the categories
    const newCategories = [...categories];
    const draggedItem = newCategories[draggedItemIndex];

    // Remove dragged item
    newCategories.splice(draggedItemIndex, 1);

    // Insert at new position
    newCategories.splice(hoveredItemIndex, 0, draggedItem);

    // Update positions
    const updatedCategories = newCategories.map((cat, index) => ({
      ...cat,
      position: index,
    }));

    setCategories(updatedCategories);
    setDraggedItemIndex(null);
    setHoveredItemIndex(null);

    // TODO: Save the new order to the server if needed
    // For now, we're just updating the UI
    toast.success("Categories reordered successfully");
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedItemIndex(null);
    setHoveredItemIndex(null);
  };

  if (loading) {
    return <div className="text-center p-8">Loading categories...</div>;
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-8">
        <p>{error}</p>
        <Button variant="outline" onClick={fetchCategories} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Menu Categories</h3>
        <Button onClick={() => setIsAddingCategory(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      {isAddingCategory && (
        <CategoryForm
          onSubmit={handleAddCategory}
          onCancel={() => setIsAddingCategory(false)}
        />
      )}

      {categories.length === 0 ? (
        <div className="text-center text-gray-500 p-8 border border-dashed rounded-md">
          No categories found. Create your first category to organize your menu
          items.
        </div>
      ) : (
        <div className="grid gap-3">
          {categories
            .sort((a, b) => (a.position || 0) - (b.position || 0))
            .map((category, index) => (
              <div
                key={category.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                className={cn(
                  "bg-white border rounded-md p-3 flex items-center justify-between cursor-grab",
                  isDragging && draggedItemIndex === index && "opacity-50",
                  isDragging &&
                    hoveredItemIndex === index &&
                    "border-primary border-2"
                )}
              >
                <div className="flex items-center space-x-3">
                  <GripVertical className="text-gray-400 h-5 w-5" />

                  {category.imageUrl && (
                    <div className="w-10 h-10 relative overflow-hidden flex-shrink-0">
                      <Image
                        src={category.imageUrl}
                        alt={category.name}
                        fill
                        className="object-cover rounded-md"
                      />
                    </div>
                  )}

                  <div>
                    <h4 className="font-medium">{category.name}</h4>
                    {category.description && (
                      <p className="text-sm text-gray-500 truncate max-w-md">
                        {category.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Pencil className="h-4 w-4 mr-1" /> Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Category</DialogTitle>
                      </DialogHeader>
                      <CategoryForm
                        category={category}
                        onSubmit={(data) =>
                          handleUpdateCategory(category.id, data)
                        }
                        onCancel={() => {}}
                        isDialog
                      />
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDeleteCategory(category.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                  </Button>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
