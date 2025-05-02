"use client";

import { Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Define the MenuItem type
type MenuItem = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  available: boolean;
  categoryId: number | null;
  createdAt: string;
  updatedAt: string;
  categoryName?: string;
};

interface MenuItemListProps {
  menuItems: MenuItem[];
  onEdit: (menuItem: MenuItem) => void;
  onDelete: (id: number) => void;
}

export default function MenuItemList({
  menuItems,
  onEdit,
  onDelete,
}: MenuItemListProps) {
  if (menuItems.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        <p>No menu items found. Create your first menu item!</p>
      </div>
    );
  }

  // Format price to display as currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Available</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {menuItems.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">
              {item.name}
              {item.description && (
                <p className="text-xs text-gray-500 mt-1 truncate max-w-xs">
                  {item.description}
                </p>
              )}
            </TableCell>
            <TableCell>{formatPrice(item.price)}</TableCell>
            <TableCell>{item.categoryName || "No Category"}</TableCell>
            <TableCell>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  item.available
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {item.available ? "Available" : "Unavailable"}
              </span>
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onEdit(item)}
                  title="Edit menu item"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onDelete(item.id)}
                  className="text-red-500 hover:text-red-700"
                  title="Delete menu item"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
