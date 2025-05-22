"use client";

import { PublicCategory } from "@/types/menu";
import { cn } from "@/lib/utils";

interface CategoryTabsProps {
  categories: PublicCategory[];
  activeCategory: number | null;
  onCategoryChange: (categoryId: number) => void;
}

export function CategoryTabs({
  categories,
  activeCategory,
  onCategoryChange,
}: CategoryTabsProps) {
  return (
    <div className="sticky top-0 z-10 bg-card shadow-sm border-b border-border">
      <div className="max-w-7xl mx-auto overflow-x-auto">
        <div className="flex p-2 space-x-2 min-w-max">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                activeCategory === category.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
