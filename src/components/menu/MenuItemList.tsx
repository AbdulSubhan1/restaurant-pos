"use client";

import { Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { MenuItem } from "../../types/shared"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Define the MenuItem type


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
      <div className="p-8 text-center text-gray-500">
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
              <TableHead>Image</TableHead>
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
                  <TableCell>
                         {item.imageUrl ? (
                           <div className="relative w-12 h-12 overflow-hidden rounded-md">
                             <Image
                               src={item.imageUrl}
                               alt={item.name}
                               fill
                               className="object-cover"
                             />
                           </div>
                         ) : (
                           <div className="flex items-center justify-center w-12 h-12 text-gray-400 bg-gray-100 rounded-md">
                             No img
                           </div>
                         )}
                       </TableCell>
            <TableCell className="font-medium">
           
              {item.name}
              {item.description && (
                <p className="max-w-xs mt-1 text-xs text-gray-500 truncate">
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
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onDelete(item.id)}
                  className="text-red-500 hover:text-red-700"
                  title="Delete menu item"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
