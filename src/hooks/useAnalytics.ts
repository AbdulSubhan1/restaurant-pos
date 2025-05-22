import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackPageView, trackEvent, trackCategoryView } from "@/lib/analytics";

export function usePageViewTracking() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Track page view on initial load and route changes
    if (pathname) {
      // Create full URL including search params
      const url = searchParams?.size
        ? `${pathname}?${searchParams.toString()}`
        : pathname;

      trackPageView(url);
    }
  }, [pathname, searchParams]);
}

export function useMenuAnalytics() {
  // Use the page view tracking
  usePageViewTracking();

  // Return utility functions for menu-specific tracking
  return {
    trackCategoryView,
    trackMenuEvent: trackEvent,
  };
}
