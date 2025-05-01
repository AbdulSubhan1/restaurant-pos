"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

// Define the schema for menu item validation
const menuItemSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less"),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .optional(),
  price: z.coerce
    .number()
    .min(0.01, "Price must be greater than 0")
    .max(9999.99, "Price must be less than 10,000"),
  categoryId: z.string().optional(),
  available: z.boolean().default(true),
  imageUrl: z.string().optional(),
});

type MenuItemFormValues = z.infer<typeof menuItemSchema>;

// Props for the menu item form component
interface MenuItemFormProps {
  menuItem?: {
    id: number;
    name: string;
    description: string | null;
    price: number;
    categoryId: number | null;
    available: boolean;
    imageUrl: string | null;
  };
  categories: Array<{ id: number; name: string }>;
  onSubmit: (data: {
    name: string;
    description?: string;
    price: number;
    categoryId?: number;
    available: boolean;
    imageUrl?: string;
  }) => void;
  onCancel: () => void;
}

export default function MenuItemForm({
  menuItem,
  categories,
  onSubmit,
  onCancel,
}: MenuItemFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize the form with default values or existing menu item values
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<MenuItemFormValues>({
    resolver: zodResolver(menuItemSchema) as any,
    defaultValues: {
      name: menuItem?.name || "",
      description: menuItem?.description || "",
      price: menuItem?.price || 0,
      categoryId: menuItem?.categoryId
        ? String(menuItem.categoryId)
        : undefined,
      available: menuItem?.available ?? true,
      imageUrl: menuItem?.imageUrl || "",
    },
  });

  // Watch the available value to update it
  const availableValue = watch("available");

  // Handle form submission
  const processSubmit = async (data: MenuItemFormValues) => {
    setIsSubmitting(true);
    try {
      // Convert categoryId to number or undefined
      const processedData = {
        ...data,
        categoryId:
          data.categoryId && data.categoryId !== "null"
            ? parseInt(data.categoryId, 10)
            : undefined,
      };
      await onSubmit(processedData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-muted/50 p-4 rounded-md mb-6">
      <h3 className="text-lg font-medium mb-4">
        {menuItem ? "Edit Menu Item" : "Add New Menu Item"}
      </h3>

      <form onSubmit={handleSubmit(processSubmit as any)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">
            Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            placeholder="Item name"
            {...register("name")}
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Item description (optional)"
            {...register("description")}
            className={errors.description ? "border-red-500" : ""}
            rows={3}
          />
          {errors.description && (
            <p className="text-sm text-red-500">{errors.description.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">
            Price <span className="text-red-500">*</span>
          </Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0"
            placeholder="Price"
            {...register("price")}
            className={errors.price ? "border-red-500" : ""}
          />
          {errors.price && (
            <p className="text-sm text-red-500">{errors.price.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="categoryId">Category</Label>
          <Select
            value={watch("categoryId")}
            onValueChange={(value) => setValue("categoryId", value)}
          >
            <SelectTrigger id="categoryId">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="null">No Category</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={String(category.id)}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.categoryId && (
            <p className="text-sm text-red-500">{errors.categoryId.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="imageUrl">Image URL</Label>
          <Input
            id="imageUrl"
            placeholder="Image URL (optional)"
            {...register("imageUrl")}
            className={errors.imageUrl ? "border-red-500" : ""}
          />
          {errors.imageUrl && (
            <p className="text-sm text-red-500">{errors.imageUrl.message}</p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="available"
            checked={availableValue}
            onCheckedChange={(checked) => setValue("available", checked)}
          />
          <Label htmlFor="available">Available for ordering</Label>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : menuItem ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </div>
  );
}
