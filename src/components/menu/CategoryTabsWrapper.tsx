"use client";

import { useState, useEffect } from "react";
import { useMenuAnalytics } from "@/hooks/useAnalytics";
import { CategoryTabs } from "@/components/menu/CategoryTabs";
import { PublicCategory } from "@/types/menu";

export function CategoryTabsWrapper({
  categories,
}: {
  categories: PublicCategory[];
}) {
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const { trackCategoryView } = useMenuAnalytics();

  useEffect(() => {
    if (categories.length > 0) {
      setActiveCategory(categories[0].id);
      trackCategoryView(categories[0].id, categories[0].name);
    }
  }, [categories, trackCategoryView]);

  const handleCategoryChange = (categoryId: number) => {
    setActiveCategory(categoryId);
    const category = categories.find((cat) => cat.id === categoryId);
    if (category) {
      trackCategoryView(categoryId, category.name);
    }

    const element = document.getElementById(`category-${categoryId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <CategoryTabs
      categories={categories}
      activeCategory={activeCategory}
      onCategoryChange={handleCategoryChange}
    />
  );
}
