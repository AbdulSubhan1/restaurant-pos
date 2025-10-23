"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export function ReservationExpiryManager() {
  useEffect(() => {
    // Check for expired reservations every minute
    const interval = setInterval(async () => {
      try {
        const response = await fetch("/api/reservations/expire", {
          method: "POST",
        });

        const data = await response.json();

        if (data.success && data.expiredCount > 0) {
          // Show notification for expired reservations
          toast.info(`Auto-expired ${data.expiredCount} reservation(s)`, {
            description: "Tables have been made available",
            duration: 5000,
          });
        }
      } catch (error) {
        console.error("Error checking expired reservations:", error);
      }
    }, 60000); // Check every minute

    // Also check immediately on mount
    const checkExpired = async () => {
      try {
        const response = await fetch("/api/reservations/expire", {
          method: "POST",
        });

        const data = await response.json();

        if (data.success && data.expiredCount > 0) {
          toast.info(`Auto-expired ${data.expiredCount} reservation(s)`, {
            description: "Tables have been made available",
            duration: 5000,
          });
        }
      } catch (error) {
        console.error("Error checking expired reservations:", error);
      }
    };

    checkExpired();

    return () => clearInterval(interval);
  }, []);

  return null; // This component doesn't render anything
}
