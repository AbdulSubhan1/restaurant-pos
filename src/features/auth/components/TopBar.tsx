"use client";

import Link from "next/link";
import { useAuthStore } from "../store/authStore";
import { LogoutButton } from "./LogoutButton";
import { UserCircle } from "lucide-react";
import { Menu } from "lucide-react";
import { useState } from "react";
import { MobileSidebar } from "./MobileSidebar";

export function TopBar() {
  const { user } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <div className="bg-white shadow-sm z-10">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              {/* Mobile menu button */}
              <button
                className="sm:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                onClick={() => setMobileMenuOpen(true)}
              >
                <span className="sr-only">Open main menu</span>
                <Menu className="block h-6 w-6" aria-hidden="true" />
              </button>

              {/* Logo */}
              <div className="flex-shrink-0 flex items-center">
                <Link
                  href="/dashboard"
                  className="text-blue-600 font-bold text-xl"
                >
                  Restaurant POS
                </Link>
              </div>
            </div>

            {/* User profile and logout */}
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <span className="mr-4 text-sm text-gray-500 hidden sm:inline-block">
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
      </div>

      {/* Mobile sidebar */}
      <MobileSidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </>
  );
}
