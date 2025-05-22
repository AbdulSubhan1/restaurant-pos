// Analytics utility functions

// Track page views
export function trackPageView(url: string) {
  // This would be replaced with actual analytics service code
  if (typeof window !== "undefined") {
    console.log(`[Analytics] Page view: ${url}`);

    // Google Analytics example (if you add GA)
    // window.gtag('config', 'G-XXXXXXXXXX', {
    //   page_path: url,
    // });

    // Send to server
    try {
      fetch("/api/analytics/pageview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: url }),
      });
    } catch (error) {
      // Fail silently - analytics should never break the app
      console.error("[Analytics] Failed to track page view", error);
    }
  }
  // Server-side tracking is handled by API routes directly
}

// Track custom events (like category views, button clicks)
export function trackEvent(
  eventName: string,
  properties?: Record<string, any>
) {
  if (typeof window !== "undefined") {
    console.log(`[Analytics] Event: ${eventName}`, properties);

    // Google Analytics example
    // window.gtag('event', eventName, properties);

    // Send to server
    try {
      fetch("/api/analytics/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: eventName, properties }),
      });
    } catch (error) {
      // Fail silently
      console.error("[Analytics] Failed to track event", error);
    }
  }
  // Server-side tracking is handled by API routes directly
}

// Track which menu categories are viewed
export function trackCategoryView(categoryId: number, categoryName: string) {
  trackEvent("view_category", {
    category_id: categoryId,
    category_name: categoryName,
  });
}

// Track which menu items are viewed in detail (if you add that feature)
export function trackItemView(
  itemId: number,
  itemName: string,
  categoryName: string
) {
  trackEvent("view_item", {
    item_id: itemId,
    item_name: itemName,
    category_name: categoryName,
  });
}
