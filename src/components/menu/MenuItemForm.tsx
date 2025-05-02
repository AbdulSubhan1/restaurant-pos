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
import { Card, CardContent } from "@/components/ui/card";
import ImageUploader from "./ImageUploader";

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
  available: z.boolean(),
  preparationTime: z.coerce
    .number()
    .min(0, "Preparation time cannot be negative")
    .max(120, "Preparation time must be 120 minutes or less")
    .optional(),
  // Image is handled separately
});

// Define the form values type based on the schema
interface MenuItemFormValues {
  name: string;
  price: number;
  available: boolean;
  description?: string;
  categoryId?: string;
  preparationTime?: number;
}

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
    preparationTime?: number | null;
  };
  categories: Array<{ id: number; name: string }>;
  onSubmit: (data: {
    name: string;
    description?: string;
    price: number;
    categoryId?: number;
    available: boolean;
    imageUrl?: string;
    preparationTime?: number;
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
  const [imageData, setImageData] = useState<string | null>(
    menuItem?.imageUrl || null
  );

  // Initialize the form with default values or existing menu item values
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<MenuItemFormValues>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name: menuItem?.name || "",
      description: menuItem?.description || "",
      price: menuItem?.price || 0,
      categoryId: menuItem?.categoryId
        ? String(menuItem.categoryId)
        : undefined,
      available: menuItem?.available ?? true,
      preparationTime: menuItem?.preparationTime || 0,
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
        imageUrl: imageData || undefined,
      };
      await onSubmit(processedData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <h3 className="text-lg font-medium mb-4">
          {menuItem ? "Edit Menu Item" : "Add New Menu Item"}
        </h3>

        <form onSubmit={handleSubmit(processSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-5">
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
                  <p className="text-sm text-red-500">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">
                    Price <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...register("price")}
                      className={`pl-7 ${errors.price ? "border-red-500" : ""}`}
                    />
                  </div>
                  {errors.price && (
                    <p className="text-sm text-red-500">
                      {errors.price.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preparationTime">
                    Preparation Time (min)
                  </Label>
                  <Input
                    id="preparationTime"
                    type="number"
                    min="0"
                    placeholder="Minutes"
                    {...register("preparationTime")}
                    className={errors.preparationTime ? "border-red-500" : ""}
                  />
                  {errors.preparationTime && (
                    <p className="text-sm text-red-500">
                      {errors.preparationTime.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoryId">Category</Label>
                <Select
                  value={watch("categoryId") || "null"}
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
                  <p className="text-sm text-red-500">
                    {errors.categoryId.message}
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-2 mt-4">
                <Switch
                  id="available"
                  checked={availableValue}
                  onCheckedChange={(checked) => setValue("available", checked)}
                />
                <Label htmlFor="available" className="font-medium">
                  {availableValue ? "Available for ordering" : "Not available"}
                </Label>
              </div>
            </div>

            <div>
              <ImageUploader
                initialImage={menuItem?.imageUrl || null}
                onImageChange={setImageData}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 mt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : menuItem
                ? "Update Item"
                : "Create Item"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
