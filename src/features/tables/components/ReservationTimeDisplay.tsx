"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

interface ReservationTimeDisplayProps {
  tableId: number;
}

interface Reservation {
  id: number;
  customerName: string;
  reservationDate: string;
  reservationTime: string;
  expiresAt: string;
  duration: number;
}

export function ReservationTimeDisplay({ tableId }: ReservationTimeDisplayProps) {
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  useEffect(() => {
    fetchReservation();
    const interval = setInterval(updateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, [tableId]);

  const fetchReservation = async () => {
    try {
      const response = await fetch(`/api/reservations?tableId=${tableId}&status=confirmed`);
      const data = await response.json();
      
      if (data.success && data.reservations.length > 0) {
        const res = data.reservations[0];
        setReservation({
          id: res.id,
          customerName: res.customerName,
          reservationDate: res.reservationDate,
          reservationTime: res.reservationTime,
          expiresAt: res.expiresAt,
          duration: res.duration,
        });
      }
    } catch (error) {
      console.error("Error fetching reservation:", error);
    }
  };

  const updateTimeRemaining = () => {
    if (!reservation) return;

    const now = new Date();
    const expiresAt = new Date(reservation.expiresAt);
    const timeDiff = expiresAt.getTime() - now.getTime();

    if (timeDiff <= 0) {
      setTimeRemaining("Expired");
      return;
    }

    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      setTimeRemaining(`${hours}h ${minutes}m left`);
    } else if (minutes > 0) {
      setTimeRemaining(`${minutes}m left`);
    } else {
      setTimeRemaining("Less than 1m left");
    }
  };

  const formatReservationTime = (date: string, time: string) => {
    const dateObj = new Date(date);
    const formattedDate = dateObj.toLocaleDateString();
    return `${formattedDate} at ${time}`;
  };

  if (!reservation) {
    return null;
  }

  const isExpired = timeRemaining === "Expired";
  const isNearExpiry = timeRemaining.includes("m left") && !timeRemaining.includes("h");

  return (
    <div className="text-xs space-y-1">
      <div className="flex items-center gap-1">
        <Clock className="h-3 w-3" />
        <span className="text-gray-600">
          {formatReservationTime(reservation.reservationDate, reservation.reservationTime)}
        </span>
      </div>
      {/* <Badge 
        variant="outline" 
        className={`text-xs ${
          isExpired 
            ? "border-red-300 text-red-700 bg-red-50" 
            : isNearExpiry 
            ? "border-orange-300 text-orange-700 bg-orange-50"
            : "border-blue-300 text-blue-700 bg-blue-50"
        }`}
      >
        {timeRemaining}
      </Badge> */}
      {/* <div className="text-gray-500 text-xs">
        {reservation.customerName}
      </div> */}
    </div>
  );
}
