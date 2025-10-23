"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, Phone, Mail, MapPin, Plus } from "lucide-react";
import { Table } from "@/db/schema/tables";

interface ReservationFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  availableTables: Table[];
}

interface ReservationFormData {
  tableId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  partySize: string;
  reservationDate: string;
  reservationTime: string;
  duration: string;
  specialRequests: string;
  notes: string;
}

export function ReservationFormDialog({
  isOpen,
  onClose,
  onSuccess,
  availableTables,
}: ReservationFormDialogProps) {
  const [formData, setFormData] = useState<ReservationFormData>({
    tableId: "",
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    partySize: "2",
    reservationDate: "",
    reservationTime: "",
    duration: "120",
    specialRequests: "",
    notes: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      // Set default date to today
      const today = new Date().toISOString().split('T')[0];
      setFormData(prev => ({
        ...prev,
        reservationDate: today,
        reservationTime: "19:00", // Default to 7 PM
      }));
    }
  }, [isOpen]);

  const handleInputChange = (field: keyof ReservationFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.tableId || !formData.customerName || !formData.partySize || 
        !formData.reservationDate || !formData.reservationTime) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tableId: parseInt(formData.tableId),
          customerName: formData.customerName,
          customerPhone: formData.customerPhone || null,
          customerEmail: formData.customerEmail || null,
          partySize: parseInt(formData.partySize),
          reservationDate: formData.reservationDate,
          reservationTime: formData.reservationTime,
          duration: parseInt(formData.duration),
          specialRequests: formData.specialRequests || null,
          notes: formData.notes || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message || "Reservation created successfully");
        onSuccess();
        onClose();
      } else {
        toast.error(data.message || "Failed to create reservation");
      }
    } catch (error) {
      console.error("Error creating reservation:", error);
      toast.error("Failed to create reservation");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTables = availableTables.filter(
    table => table.active && table.status === "available"
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Create New Reservation
          </DialogTitle>
          <DialogDescription>
            Book a table for your customers. The table will be marked as reserved.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Table Selection */}
          <div className="space-y-2">
            <Label htmlFor="tableId">Table *</Label>
            <Select value={formData.tableId} onValueChange={(value) => handleInputChange("tableId", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a table" />
              </SelectTrigger>
              <SelectContent>
                {filteredTables.map((table) => (
                  <SelectItem key={table.id} value={table.id.toString()}>
                    <div className="flex items-center justify-between w-full">
                      <span>{table.name}</span>
                      <Badge variant="outline" className="ml-2">
                        Capacity: {table.capacity}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Customer Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name *</Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) => handleInputChange("customerName", e.target.value)}
                placeholder="Enter customer name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerPhone">Phone Number</Label>
              <Input
                id="customerPhone"
                value={formData.customerPhone}
                onChange={(e) => handleInputChange("customerPhone", e.target.value)}
                placeholder="Enter phone number"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerEmail">Email Address</Label>
            <Input
              id="customerEmail"
              type="email"
              value={formData.customerEmail}
              onChange={(e) => handleInputChange("customerEmail", e.target.value)}
              placeholder="Enter email address"
            />
          </div>

          {/* Reservation Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="partySize">Party Size *</Label>
              <Select value={formData.partySize} onValueChange={(value) => handleInputChange("partySize", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 20 }, (_, i) => i + 1).map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size} {size === 1 ? "person" : "people"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reservationDate">Date *</Label>
              <Input
                id="reservationDate"
                type="date"
                value={formData.reservationDate}
                onChange={(e) => handleInputChange("reservationDate", e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reservationTime">Time *</Label>
              <Input
                id="reservationTime"
                type="time"
                value={formData.reservationTime}
                onChange={(e) => handleInputChange("reservationTime", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Select value={formData.duration} onValueChange={(value) => handleInputChange("duration", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="90">1.5 hours</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
                <SelectItem value="150">2.5 hours</SelectItem>
                <SelectItem value="180">3 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Special Requests */}
          <div className="space-y-2">
            <Label htmlFor="specialRequests">Special Requests</Label>
            <Textarea
              id="specialRequests"
              value={formData.specialRequests}
              onChange={(e) => handleInputChange("specialRequests", e.target.value)}
              placeholder="Any special requests or dietary requirements..."
              rows={3}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Internal Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Internal notes for staff..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
              {isLoading ? "Creating..." : "Create Reservation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
