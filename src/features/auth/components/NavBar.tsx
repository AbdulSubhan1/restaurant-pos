import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "../store/authStore";
import { LogoutButton } from "./LogoutButton";
import { UserCircle } from "lucide-react";

export function NavBar() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const navItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Tables", href: "/tables" },
    { label: "Menu", href: "/menu" },
    { label: "Orders", href: "/orders" },
    { label: "Payments", href: "/payments" },
    { label: "Kitchen", href: "/kitchen" },
  ];

  // Add admin/manager specific nav items
  if (user?.role === "admin" || user?.role === "manager") {
    navItems.push({ label: "Reports", href: "/reports" });
  }

  // Add admin specific nav items
  if (user?.role === "admin") {
    navItems.push({ label: "Users", href: "/users" });
  }

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link
                href="/dashboard"
                className="text-blue-600 font-bold text-xl"
              >
                Restaurant POS
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${
                      isActive
                        ? "border-blue-500 text-gray-900"
                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <span className="mr-4 text-sm text-gray-500">
                {user?.email} ({user?.role})
              </span>
              <Link
                href="/profile"
                className="inline-flex items-center px-3 py-1 mr-3 text-sm font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                <UserCircle className="mr-1 h-4 w-4" />
                Profile
              </Link>
              <div className="border-l border-gray-300 h-6 mx-2"></div>
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="sm:hidden">
        <div className="pt-2 pb-3 space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${
                  isActive
                    ? "bg-blue-50 border-blue-500 text-blue-700"
                    : "border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
                } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
