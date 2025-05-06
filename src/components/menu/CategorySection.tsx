"use client";

import { PublicCategory } from "@/types/menu";
import { MenuItem } from "./MenuItem";

interface CategorySectionProps {
  category: PublicCategory;
}

export function CategorySection({ category }: CategorySectionProps) {
  return (
    <section id={`category-${category.id}`} className="mb-12">
      <h2 className="text-2xl font-bold mb-6 pb-2 border-b">{category.name}</h2>

      {category.description && (
        <p className="text-muted-foreground mb-4">{category.description}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {category.menuItems.map((item) => (
          <MenuItem key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
