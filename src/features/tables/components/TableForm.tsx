"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Table } from "@/db/schema/tables";

const tableSchema = z.object({
  name: z.string().min(1, "Table name is required"),
  capacity: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Capacity must be a positive number",
  }),
  status: z.string(),
  notes: z.string().optional().nullable(),
  xPosition: z.string().optional(),
  yPosition: z.string().optional(),
});

type TableFormValues = z.infer<typeof tableSchema>;

interface TableFormProps {
  initialData?: Table;
  isEditMode?: boolean;
}

export function TableForm({ initialData, isEditMode = false }: TableFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [status, setStatus] = useState<string>("available");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<TableFormValues>({
    resolver: zodResolver(tableSchema),
    defaultValues: {
      name: "",
      capacity: "4",
      status: "available",
      notes: "",
      xPosition: "0",
      yPosition: "0",
    },
  });

  useEffect(() => {
    if (initialData) {
      setValue("name", initialData.name);
      setValue("capacity", initialData.capacity.toString());
      setValue("status", initialData.status);
      setValue("notes", initialData.notes || "");
      setValue("xPosition", initialData.xPosition.toString());
      setValue("yPosition", initialData.yPosition.toString());
      setStatus(initialData.status);
    }
  }, [initialData, setValue]);

  const onSubmit = async (data: TableFormValues) => {
    setIsLoading(true);
    try {
      const url = isEditMode ? `/api/tables/${initialData?.id}` : "/api/tables";
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          capacity: parseInt(data.capacity),
          status: data.status,
          notes: data.notes,
          xPosition: data.xPosition ? parseInt(data.xPosition) : 0,
          yPosition: data.yPosition ? parseInt(data.yPosition) : 0,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to save table");
      }

      toast.success(
        isEditMode ? "Table updated successfully" : "Table created successfully"
      );

      // Redirect back to tables list
      router.push("/tables");
      router.refresh();
    } catch (error) {
      console.error("Error saving table:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save table"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditMode ? "Edit Table" : "Add New Table"}</CardTitle>
        <CardDescription>
          {isEditMode
            ? "Update the details of an existing table"
            : "Create a new table for your restaurant"}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Table Name</Label>
            <Input
              id="name"
              placeholder="Table 1"
              {...register("name")}
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="capacity">Capacity</Label>
            <Input
              id="capacity"
              type="number"
              placeholder="4"
              min="1"
              {...register("capacity")}
              disabled={isLoading}
            />
            {errors.capacity && (
              <p className="text-sm text-red-500">{errors.capacity.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={status}
              onValueChange={(value: string) => {
                setStatus(value);
                setValue("status", value);
              }}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="occupied">Occupied</SelectItem>
                <SelectItem value="reserved">Reserved</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any special notes about this table"
              {...register("notes")}
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="xPosition">X Position</Label>
              <Input
                id="xPosition"
                type="number"
                placeholder="0"
                {...register("xPosition")}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="yPosition">Y Position</Label>
              <Input
                id="yPosition"
                type="number"
                placeholder="0"
                {...register("yPosition")}
                disabled={isLoading}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/tables")}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? isEditMode
                ? "Updating..."
                : "Creating..."
              : isEditMode
              ? "Update Table"
              : "Create Table"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
