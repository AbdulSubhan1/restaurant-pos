"use client";

import { PublicMenuItem } from "@/types/menu";
import Image from "next/image";

interface MenuItemProps {
  item: PublicMenuItem;
}

export function MenuItem({ item }: MenuItemProps) {
  return (
    <div className="bg-card rounded-lg shadow-md overflow-hidden border border-border hover:shadow-lg transition-shadow">
      {item.imageUrl ? (
        <div className="relative h-48 w-full">
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
            priority={item.id < 4} // Prioritize loading for first few items
          />
        </div>
      ) : (
        <div className="bg-muted h-48 flex items-center justify-center text-muted-foreground">
          <p>No image available</p>
        </div>
      )}

      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold">{item.name}</h3>
          <span className="font-medium text-primary">
            $
            {typeof item.price === "string"
              ? parseFloat(item.price).toFixed(2)
              : item.price.toFixed(2)}
          </span>
        </div>

        {item.description && (
          <p className="text-muted-foreground text-sm">{item.description}</p>
        )}
      </div>
    </div>
  );
}
