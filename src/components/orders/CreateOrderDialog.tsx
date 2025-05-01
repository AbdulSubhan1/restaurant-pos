"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

// Define our types
type MenuItem = {
  id: number;
  name: string;
  price: string;
  description: string | null;
  category: {
    id: number;
    name: string;
  } | null;
};

type Category = {
  id: number;
  name: string;
};

type OrderItem = {
  menuItemId: number;
  menuItemName: string;
  quantity: number;
  price: string;
  notes: string;
};

type Table = {
  id: number;
  name: string;
  capacity: number;
  status: string;
};

interface CreateOrderDialogProps {
  onClose: () => void;
  onSubmit: (data: {
    tableId: number;
    notes: string;
    items: OrderItem[];
  }) => void;
}

export default function CreateOrderDialog({
  onClose,
  onSubmit,
}: CreateOrderDialogProps) {
  // State for form data
  const [tableId, setTableId] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  // State for API data
  const [tables, setTables] = useState<Table[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // State for loading states
  const [loadingTables, setLoadingTables] = useState(true);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Fetch tables and menu items on component mount
  useEffect(() => {
    fetchTables();
    fetchMenuItems();
    fetchCategories();
  }, []);

  // Function to fetch tables
  const fetchTables = async () => {
    try {
      const response = await fetch("/api/tables", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch tables");
      }

      // Only include available tables
      const availableTables = data.tables.filter(
        (table: Table) => table.status === "available"
      );

      setTables(availableTables);
    } catch (error) {
      console.error("Error fetching tables:", error);
      toast.error("Failed to load tables");
    } finally {
      setLoadingTables(false);
    }
  };

  // Function to fetch menu items
  const fetchMenuItems = async () => {
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

      // Transform the data to match our MenuItem type
      const formattedItems = data.menuItems.map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.categoryId
          ? { id: item.categoryId, name: item.categoryName }
          : null,
      }));

      setMenuItems(formattedItems);
    } catch (error) {
      console.error("Error fetching menu items:", error);
      toast.error("Failed to load menu items");
    } finally {
      setLoadingMenu(false);
    }
  };

  // Function to fetch categories
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
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to load categories");
    }
  };

  // Filter menu items by selected category
  const filteredMenuItems =
    selectedCategory === "all"
      ? menuItems
      : menuItems.filter(
          (item) =>
            item.category && item.category.id === parseInt(selectedCategory)
        );

  // Function to add item to order
  const addItemToOrder = (item: MenuItem) => {
    // Check if item already exists in order
    const existingItemIndex = orderItems.findIndex(
      (orderItem) => orderItem.menuItemId === item.id
    );

    if (existingItemIndex >= 0) {
      // Update quantity if item already in order
      const updatedItems = [...orderItems];
      updatedItems[existingItemIndex].quantity += 1;
      setOrderItems(updatedItems);
    } else {
      // Add new item to order
      setOrderItems([
        ...orderItems,
        {
          menuItemId: item.id,
          menuItemName: item.name,
          quantity: 1,
          price: item.price,
          notes: "",
        },
      ]);
    }

    toast.success(`Added ${item.name} to order`);
  };

  // Function to update item quantity
  const updateItemQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;

    const updatedItems = [...orderItems];
    updatedItems[index].quantity = newQuantity;
    setOrderItems(updatedItems);
  };

  // Function to update item notes
  const updateItemNotes = (index: number, notes: string) => {
    const updatedItems = [...orderItems];
    updatedItems[index].notes = notes;
    setOrderItems(updatedItems);
  };

  // Function to remove item from order
  const removeItem = (index: number) => {
    const updatedItems = [...orderItems];
    const removedItem = updatedItems[index];
    updatedItems.splice(index, 1);
    setOrderItems(updatedItems);
    toast.info(`Removed ${removedItem.menuItemName} from order`);
  };

  // Calculate order total
  const calculateTotal = () => {
    return orderItems.reduce(
      (total, item) => total + parseFloat(item.price) * item.quantity,
      0
    );
  };

  // Function to handle form submission
  const handleSubmit = () => {
    if (!tableId) {
      toast.error("Please select a table");
      return;
    }

    if (orderItems.length === 0) {
      toast.error("Please add at least one item to the order");
      return;
    }

    setSubmitting(true);

    const orderData = {
      tableId: parseInt(tableId),
      notes: notes.trim(),
      items: orderItems,
    };

    onSubmit(orderData);
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Create New Order</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Table selection */}
          <div className="mb-4">
            <Label htmlFor="table">Select Table</Label>
            <Select
              value={tableId}
              onValueChange={setTableId}
              disabled={loadingTables}
            >
              <SelectTrigger id="table">
                <SelectValue placeholder="Select a table" />
              </SelectTrigger>
              <SelectContent>
                {tables.map((table) => (
                  <SelectItem key={table.id} value={table.id.toString()}>
                    Table {table.name} (Seats {table.capacity})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Menu items */}
          <div className="mb-4">
            <Label>Menu Items</Label>
            <Tabs defaultValue="menu" className="mt-2">
              <TabsList className="mb-4">
                <TabsTrigger value="menu">Add Menu Items</TabsTrigger>
                <TabsTrigger value="order">
                  Current Order ({orderItems.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="menu">
                <div className="mb-4">
                  <Label>Filter by Category</Label>
                  <Select
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem
                          key={category.id}
                          value={category.id.toString()}
                        >
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {loadingMenu ? (
                  <p className="text-center py-4">Loading menu items...</p>
                ) : filteredMenuItems.length === 0 ? (
                  <p className="text-center py-4">No menu items found</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2">
                    {filteredMenuItems.map((item) => (
                      <Card
                        key={item.id}
                        className="cursor-pointer hover:bg-muted transition-colors"
                        onClick={() => addItemToOrder(item)}
                      >
                        <CardContent className="p-3">
                          <div className="font-medium">{item.name}</div>
                          {item.description && (
                            <p className="text-xs text-gray-500 line-clamp-2">
                              {item.description}
                            </p>
                          )}
                          <div className="flex justify-between items-center mt-2">
                            <span>
                              {formatCurrency(parseFloat(item.price))}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="order">
                {orderItems.length === 0 ? (
                  <p className="text-center py-4 text-gray-500">
                    No items added to the order yet
                  </p>
                ) : (
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                    {orderItems.map((item, index) => (
                      <div
                        key={`${item.menuItemId}-${index}`}
                        className="border rounded-md p-3"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">
                              {item.menuItemName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatCurrency(parseFloat(item.price))} each
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="flex items-center mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() =>
                              updateItemQuantity(index, item.quantity - 1)
                            }
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="mx-3 font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() =>
                              updateItemQuantity(index, item.quantity + 1)
                            }
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <span className="ml-auto font-medium">
                            {formatCurrency(
                              parseFloat(item.price) * item.quantity
                            )}
                          </span>
                        </div>

                        <div className="mt-3">
                          <Input
                            value={item.notes}
                            onChange={(e) =>
                              updateItemNotes(index, e.target.value)
                            }
                            placeholder="Special instructions (optional)"
                            className="text-sm"
                          />
                        </div>
                      </div>
                    ))}

                    <div className="mt-4 pt-4 border-t">
                      <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span>{formatCurrency(calculateTotal())}</span>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Order notes */}
          <div className="mb-4">
            <Label htmlFor="notes">Order Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any special instructions for the entire order"
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || orderItems.length === 0 || !tableId}
            className="ml-2"
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            {submitting ? "Creating Order..." : "Create Order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
