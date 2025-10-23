"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ReservationTimeDisplay } from "./ReservationTimeDisplay";

interface TableStatusSelectorProps {
  tableId: number;
  currentStatus: string;
  onStatusChange: (tableId: number, newStatus: string) => void;
}

const statusOptions = [
  { value: "available", label: "Available", color: "bg-green-500" },
  { value: "occupied", label: "Occupied", color: "bg-red-500" },
  { value: "reserved", label: "Reserved", color: "bg-blue-500" },
  { value: "maintenance", label: "Maintenance", color: "bg-gray-500" },
  { value: "disabled", label: "Disabled", color: "bg-slate-500" },
  { value: "cleaning", label: "Cleaning", color: "bg-yellow-500" },
];

export function TableStatusSelector({ 
  tableId, 
  currentStatus, 
  onStatusChange 
}: TableStatusSelectorProps) {
  const [isChanging, setIsChanging] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === currentStatus) return;
    
    setIsChanging(true);
    try {
      await onStatusChange(tableId, newStatus);
    } catch (error) {
      console.error("Error changing status:", error);
      toast.error("Failed to change table status");
    } finally {
      setIsChanging(false);
    }
  };

  const getCurrentStatusOption = () => {
    return statusOptions.find(option => option.value === currentStatus.toLowerCase());
  };

  const currentOption = getCurrentStatusOption();

  return (
    <div className="flex flex-col gap-1 border-0">
      <Select 
        value={currentStatus} 
        onValueChange={handleStatusChange}
        disabled={isChanging}
      >
        <SelectTrigger className="w-auto h-6 text-xs">
          <SelectValue>
            {/* <Badge className={`${currentOption?.color || "bg-gray-500"} text-white`}>
              {currentOption?.label || currentStatus}
            </Badge> */}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${option.color}`}></div>
                <span>{option.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {/* Show reservation info for reserved tables */}
      {currentStatus.toLowerCase() === "reserved" && (
        <ReservationTimeDisplay tableId={tableId} />
      )}
    </div>
  );
}
