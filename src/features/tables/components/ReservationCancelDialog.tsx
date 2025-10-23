"use client";

import { useState } from "react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, AlertTriangle, X } from "lucide-react";

interface ReservationCancelDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  tableName: string;
  reservation: {
    id: number;
    customerName: string;
    customerPhone: string | null;
    reservationDate: string;
    reservationTime: string;
    partySize: number;
    duration: number;
  } | null;
}

export function ReservationCancelDialog({
  isOpen,
  onClose,
  onConfirm,
  tableName,
  reservation,
}: ReservationCancelDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error("Error cancelling reservation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateTime = (date: string, time: string) => {
    const dateObj = new Date(date);
    const formattedDate = dateObj.toLocaleDateString();
    return `${formattedDate} at ${time}`;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${mins}m`;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Cancel Reservation
          </DialogTitle>
          <DialogDescription>
            This table has an active reservation. Cancelling will make the table available immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Table Info */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Table Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-100 text-blue-800">
                  {tableName}
                </Badge>
                <span className="text-sm text-gray-600">Currently Reserved</span>
              </div>
            </CardContent>
          </Card>

          {/* Reservation Details */}
          {reservation && (
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Reservation Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium">{reservation.customerName}</p>
                  {reservation.customerPhone && (
                    <p className="text-sm text-gray-600">{reservation.customerPhone}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>{formatDateTime(reservation.reservationDate, reservation.reservationTime)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span>{reservation.partySize} people</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>{formatDuration(reservation.duration)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Warning */}
          <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-md">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-red-800">Warning</p>
              <p className="text-red-700">
                Cancelling this reservation will notify the customer and make the table available for other bookings.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Keep Reservation
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm} 
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? "Cancelling..." : "Cancel Reservation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
