import { Metadata } from "next";
import MenuTabs from "@/components/menu/MenuTabs";

export const metadata: Metadata = {
  title: "Menu - Restaurant POS",
  description: "Manage restaurant menu items",
};

export default function MenuPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Menu Management</h1>

      <MenuTabs />
    </div>
  );
}
