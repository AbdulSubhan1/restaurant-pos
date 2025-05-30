import Link from "next/link";
import { PublicMenuResponse } from "@/types/menu";
import { CategoryTabs } from "@/components/menu/CategoryTabs";
import { CategorySection } from "@/components/menu/CategorySection";
import { CategoryTabsWrapper } from "@/components/menu/CategoryTabsWrapper";

// Server Component
export default async function MenuPage() {
  let menuData: PublicMenuResponse | null = null;

  try {
    const res = await fetch(`$http://localhost:3000/api/public/menu`, {
      next: { revalidate: 60 }, // ISR: cache and revalidate every 60 seconds
    });

    const data = await res.json();

    if (!data.success) {
      throw new Error(data.message || "Menu fetch failed");
    }

    menuData = data;
  } catch (err) {
    console.error("Failed to fetch menu:", err);
  }

  if (!menuData || !menuData.menu || menuData.menu.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold">Our Menu</h1>
          <p className="mt-2 text-muted-foreground">
            We're currently updating our menu. Please check back later!
          </p>
          <Link
            href="/"
            className="inline-block mt-4 text-primary hover:underline"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="px-4 py-8 text-center shadow-md bg-primary text-primary-foreground">
        <h1 className="text-3xl font-bold md:text-4xl">Our Menu</h1>
        <p className="max-w-2xl mx-auto mt-2">
          Explore our delicious offerings - made with the freshest ingredients
        </p>
      </header>

      {/* This part needs to be a client component */}
      <CategoryTabsWrapper categories={menuData.menu} />

      <main className="px-4 py-8 mx-auto max-w-7xl">
        {menuData.menu.map((category) => (
          <CategorySection key={category.id} category={category} />
        ))}
      </main>

      <footer className="px-4 py-8 text-center border-t bg-card border-border">
        <p className="text-muted-foreground">
          Menu items and prices subject to change. Please contact us for the
          most up-to-date information.
        </p>
        <Link
          href="/"
          className="inline-block mt-2 text-primary hover:underline"
        >
          Return to Home
        </Link>
      </footer>
    </div>
  );
}
