"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import ImageUploader from "./ImageUploader";

// Define the schema for category validation
const categorySchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(50, "Name must be 50 characters or less"),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

// Props for the category form component
interface CategoryFormProps {
  category?: {
    id: number;
    name: string;
    description: string | null;
    imageUrl?: string | null;
  };
  onSubmit: (data: {
    name: string;
    description?: string;
    imageUrl?: string;
  }) => void;
  onCancel: () => void;
  isDialog?: boolean;
}

export default function CategoryForm({
  category,
  onSubmit,
  onCancel,
  isDialog = false,
}: CategoryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageData, setImageData] = useState<string | null>(
    category?.imageUrl || null
  );

  // Initialize the form with default values or existing category values
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name || "",
      description: category?.description || "",
    },
  });

  // Handle form submission
  const processSubmit = async (data: CategoryFormValues) => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...data,
        imageUrl: imageData || undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formContent = (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Category name"
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
              placeholder="Category description (optional)"
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
        </div>

        <div>
          <ImageUploader
            initialImage={category?.imageUrl || null}
            onImageChange={setImageData}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 mt-4 border-t">
        {!isDialog && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Saving..."
            : category
            ? "Update Category"
            : "Create Category"}
        </Button>
      </div>
    </>
  );

  if (isDialog) {
    return <form onSubmit={handleSubmit(processSubmit)}>{formContent}</form>;
  }

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <h3 className="text-lg font-medium mb-4">
          {category ? "Edit Category" : "Add New Category"}
        </h3>

        <form onSubmit={handleSubmit(processSubmit)}>{formContent}</form>
      </CardContent>
    </Card>
  );
}
