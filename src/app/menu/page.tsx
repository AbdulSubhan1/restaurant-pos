"use client";

import { useEffect, useState } from "react";
import { PublicMenuResponse } from "@/types/menu";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { CategoryTabs } from "@/components/menu/CategoryTabs";
import { CategorySection } from "@/components/menu/CategorySection";
import { useMenuAnalytics } from "@/hooks/useAnalytics";
import { usePerformanceMonitoring } from "@/hooks/usePerformance";

export default function MenuPage() {
  // Set up analytics and performance monitoring
  const { trackCategoryView } = useMenuAnalytics();
  const { reportError } = usePerformanceMonitoring();

  const [menuData, setMenuData] = useState<PublicMenuResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/public/menu");
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message || "Failed to load menu");
        }

        setMenuData(data);

        // Set the first category as active if menu has categories
        if (data.menu && data.menu.length > 0) {
          setActiveCategory(data.menu[0].id);

          // Track initial category view
          trackCategoryView(data.menu[0].id, data.menu[0].name);
        }
      } catch (err) {
        console.error("Error fetching menu:", err);
        setError("Could not load the menu. Please try again later.");

        // Report the error to our tracking system
        if (err instanceof Error) {
          reportError(err, { context: "MenuPage - fetchMenu" });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, [trackCategoryView, reportError]);

  // Handle category change with analytics tracking
  const handleCategoryChange = (categoryId: number) => {
    setActiveCategory(categoryId);

    // Find the category name for tracking
    const category = menuData?.menu.find((cat) => cat.id === categoryId);
    if (category) {
      // Track this category view
      trackCategoryView(categoryId, category.name);
    }

    // Smooth scroll to the category section
    const element = document.getElementById(`category-${categoryId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Loading menu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-destructive">Oops!</h1>
          <p className="mt-2 text-muted-foreground">{error}</p>
          <Link
            href="/"
            className="mt-4 inline-block text-primary hover:underline"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!menuData || !menuData.menu || menuData.menu.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          <h1 className="text-2xl font-bold">Our Menu</h1>
          <p className="mt-2 text-muted-foreground">
            We're currently updating our menu. Please check back later!
          </p>
          <Link
            href="/"
            className="mt-4 inline-block text-primary hover:underline"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-8 px-4 text-center shadow-md">
        <h1 className="text-3xl md:text-4xl font-bold">Our Menu</h1>
        <p className="mt-2 max-w-2xl mx-auto">
          Explore our delicious offerings - made with the freshest ingredients
        </p>
      </header>

      {/* Category Navigation */}
      <CategoryTabs
        categories={menuData.menu}
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
      />

      {/* Menu Categories and Items */}
      <main className="max-w-7xl mx-auto py-8 px-4">
        {menuData.menu.map((category) => (
          <CategorySection key={category.id} category={category} />
        ))}
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8 px-4 text-center">
        <p className="text-muted-foreground">
          Menu items and prices subject to change. Please contact us for the
          most up-to-date information.
        </p>
        <Link
          href="/"
          className="mt-2 inline-block text-primary hover:underline"
        >
          Return to Home
        </Link>
      </footer>
    </div>
  );
}
