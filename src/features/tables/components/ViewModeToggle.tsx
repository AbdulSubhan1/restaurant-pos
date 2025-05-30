"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List } from "lucide-react";

interface ViewModeToggleProps {
  currentMode: string;
}

export default function ViewModeToggle({ currentMode }: ViewModeToggleProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setViewMode = (mode: "grid" | "list") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", mode);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex space-x-2">
      <Button
        variant={currentMode === "grid" ? "default" : "outline"}
        size="sm"
        onClick={() => setViewMode("grid")}
        className="flex items-center gap-1"
      >
        <LayoutGrid className="h-4 w-4" />
        <span className="hidden sm:inline">Grid View</span>
      </Button>
      <Button
        variant={currentMode === "list" ? "default" : "outline"}
        size="sm"
        onClick={() => setViewMode("list")}
        className="flex items-center gap-1"
      >
        <List className="h-4 w-4" />
        <span className="hidden sm:inline">List View</span>
      </Button>
    </div>
  );
}
