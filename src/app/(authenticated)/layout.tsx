"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Toaster } from "sonner";
import { TopBar } from "@/features/auth/components/TopBar";
import { Sidebar } from "@/features/auth/components/Sidebar";
import { useAuthStore } from "@/features/auth/store/authStore";
import { type User } from "@/features/auth/store/authStore";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, setUser, setIsLoading, isLoading } = useAuthStore();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // If already authenticated from store, skip server check
        if (user) {
          console.log("Already authenticated from store:", user);
          setIsLoading(false);
          return;
        }

        console.log("Checking auth with server...");
        // Check auth status from server
        const response = await fetch("/api/auth/me");

        if (!response.ok) {
          // If response is not ok, redirect to login
          console.log("Auth check failed, redirecting to login");
          router.push("/login");
          return;
        }

        const result = await response.json();

        if (result.success && result.user) {
          // Update auth store
          console.log("Auth successful, user:", result.user);
          setUser(result.user as User);
          setIsLoading(false);
        } else {
          // Redirect to login if not authenticated
          console.log("No user found, redirecting to login");
          router.push("/login");
        }
      } catch (error) {
        console.error("Auth check error:", error);
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, user, setUser, setIsLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Only render if authenticated
  if (!user) {
    return null; // Don't render anything while redirecting
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar />
      <div className="flex flex-grow">
        <Sidebar />
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}
