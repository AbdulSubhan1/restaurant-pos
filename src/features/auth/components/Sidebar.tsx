"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "../store/authStore";
import {
  LayoutDashboard,
  Utensils,
  MenuSquare,
  ClipboardList,
  CreditCard,
  ChefHat,
  BarChart,
  Users,
  ChevronDown,
  Settings,
  QrCode,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

// Define navigation item type
type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles?: string[];
};

// Define navigation category type
type NavCategory = {
  name: string;
  items: NavItem[];
  expanded?: boolean;
};

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  // State to track expanded categories
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({
    operations: true,
    management: true,
    system: true,
  });

  // Define all navigation items organized by category
  const navigationCategories: NavCategory[] = [
    {
      name: "Operations",
      items: [
        {
          label: "Dashboard",
          href: "/dashboard",
          icon: <LayoutDashboard className="h-5 w-5" />,
        },
        {
          label: "Tables",
          href: "/tables",
          icon: <Utensils className="h-5 w-5" />,
        },
        {
          label: "Menu Management",
          href: "/menu-management",
          icon: <MenuSquare className="h-5 w-5" />,
        },
        {
          label: "Menu QR Code",
          href: "/menu-qr",
          icon: <QrCode className="h-5 w-5" />,
        },
        {
          label: "Orders",
          href: "/orders",
          icon: <ClipboardList className="h-5 w-5" />,
        },
        {
          label: "Payments",
          href: "/payments",
          icon: <CreditCard className="h-5 w-5" />,
          roles: ["admin", "manager"],
        },
        {
          label: "Kitchen",
          href: "/kitchen",
          icon: <ChefHat className="h-5 w-5" />,
        },
      ],
    },
    {
      name: "Management",
      items: [
        {
          label: "Reports",
          href: "/reports",
          icon: <BarChart className="h-5 w-5" />,
          roles: ["admin", "manager"],
        },
        {
          label: "Analytics",
          href: "/analytics",
          icon: <BarChart className="h-5 w-5" />,
          roles: ["admin"],
        },
        {
          label: "Users",
          href: "/users",
          icon: <Users className="h-5 w-5" />,
          roles: ["admin"],
        },
      ],
    },
    {
      name: "System",
      items: [
        {
          label: "Settings",
          href: "/settings",
          icon: <Settings className="h-5 w-5" />,
          roles: ["admin"],
        },
      ],
    },
  ];

  // Function to toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  // Filter items based on user role
  const filterItemsByRole = (items: NavItem[]) => {
    return items.filter((item) => {
      if (!item.roles) return true; // No role restriction
      return item.roles.includes(user?.role || "");
    });
  };

  return (
    <div className="w-64 bg-white shadow-sm overflow-y-auto h-full flex-shrink-0 hidden sm:block">
      <div className="p-4">
        {navigationCategories.map((category) => {
          const filteredItems = filterItemsByRole(category.items);

          // Don't render empty categories
          if (filteredItems.length === 0) return null;

          return (
            <div key={category.name} className="mb-6">
              <div
                className="flex items-center justify-between mb-2 cursor-pointer"
                onClick={() => toggleCategory(category.name)}
              >
                <h3 className="font-medium text-gray-500 text-sm uppercase tracking-wider">
                  {category.name}
                </h3>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-gray-500 transition-transform duration-200",
                    expandedCategories[category.name]
                      ? "transform rotate-180"
                      : ""
                  )}
                />
              </div>

              {expandedCategories[category.name] && (
                <ul className="space-y-1">
                  {filteredItems.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      pathname.startsWith(`${item.href}/`);

                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center px-2 py-2 text-sm rounded-md group",
                            isActive
                              ? "bg-blue-50 text-blue-700 font-medium"
                              : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                          )}
                        >
                          <span
                            className={cn(
                              "mr-3",
                              isActive
                                ? "text-blue-500"
                                : "text-gray-500 group-hover:text-gray-600"
                            )}
                          >
                            {item.icon}
                          </span>
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
