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
  X,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

type MobileSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();

  // Define all navigation items
  const navigationItems = [
    // Operations
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
      label: "Menu",
      href: "/menu",
      icon: <MenuSquare className="h-5 w-5" />,
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
    },
    {
      label: "Kitchen",
      href: "/kitchen",
      icon: <ChefHat className="h-5 w-5" />,
    },

    // Management (role-based)
    {
      label: "Reports",
      href: "/reports",
      icon: <BarChart className="h-5 w-5" />,
      roles: ["admin", "manager"],
    },
    {
      label: "Users",
      href: "/users",
      icon: <Users className="h-5 w-5" />,
      roles: ["admin"],
    },

    // System (role-based)
    {
      label: "Settings",
      href: "/settings",
      icon: <Settings className="h-5 w-5" />,
      roles: ["admin"],
    },
  ];

  // Filter items based on user role
  const filteredItems = navigationItems.filter((item) => {
    if (!item.roles) return true; // No role restriction
    return item.roles.includes(user?.role || "");
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 sm:hidden">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-gray-600 bg-opacity-75"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
        <div className="absolute top-0 right-0 -mr-12 pt-2">
          <button
            type="button"
            className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            onClick={onClose}
          >
            <span className="sr-only">Close sidebar</span>
            <X className="h-6 w-6 text-white" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
          <div className="flex-shrink-0 flex items-center px-4">
            <h1 className="text-xl font-bold text-blue-600">Restaurant POS</h1>
          </div>
          <nav className="mt-5 px-2 space-y-1">
            {filteredItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center px-2 py-2 text-base font-medium rounded-md",
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                  onClick={onClose}
                >
                  <span
                    className={cn(
                      "mr-4",
                      isActive
                        ? "text-blue-500"
                        : "text-gray-400 group-hover:text-gray-500"
                    )}
                  >
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
          <div className="flex-shrink-0 group block">
            <div className="flex items-center">
              <div>
                <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                  {user?.name}
                </p>
                <p className="text-xs font-medium text-gray-500 group-hover:text-gray-700">
                  {user?.role}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
