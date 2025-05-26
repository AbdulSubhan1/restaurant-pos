// Add server-only marker to indicate this module should only be used on the server
import "server-only";
import fs from "fs";
import path from "path";

// Ensure data directory exists
const DATA_DIR = path.join(process.cwd(), "data");
const ANALYTICS_FILE = path.join(DATA_DIR, "analytics.json");

// Make sure the data directory exists
if (typeof process !== "undefined") {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (error) {
    console.error("Error creating data directory:", error);
  }
}

// Define types for all analytics data
export interface AnalyticsData {
  pageViews: Record<string, PageViewData>;
  events: {
    records: EventData[];
    counts: Record<string, number>;
  };
  performance: {
    timings: PerformanceData[];
  };
  errors: {
    records: ErrorData[];
  };
  lastUpdated: string;
}

export interface PageViewData {
  path: string;
  count: number;
  lastViewed: string;
}

export interface EventData {
  event: string;
  properties: Record<string, any>;
  timestamp: string;
}

export interface PerformanceData {
  pageLoadTime: number;
  url: string;
  timeToFirstByte: number;
  domContentLoaded: number;
  timestamp: string;
}

export interface ErrorData {
  message: string;
  stack?: string;
  url?: string;
  context?: Record<string, any>;
  timestamp: string;
}

// Default empty analytics data structure
const defaultAnalyticsData: AnalyticsData = {
  pageViews: {},
  events: {
    records: [],
    counts: {},
  },
  performance: {
    timings: [],
  },
  errors: {
    records: [],
  },
  lastUpdated: new Date().toISOString(),
};

// In-memory cache of analytics data
let analyticsCache: AnalyticsData | null = null;

// Initialize the analytics data from file or create default if not exists
function initAnalyticsData(): AnalyticsData {
  try {
    if (fs.existsSync(ANALYTICS_FILE)) {
      const data = fs.readFileSync(ANALYTICS_FILE, "utf8");
      return JSON.parse(data) as AnalyticsData;
    }
  } catch (error) {
    console.error("Error reading analytics file:", error);
  }

  // If file doesn't exist or has an error, initialize with defaults
  return { ...defaultAnalyticsData };
}

// Get the analytics data, initializing from file if needed
export function getAnalyticsData(): AnalyticsData {
  if (!analyticsCache) {
    analyticsCache = initAnalyticsData();
  }
  return analyticsCache;
}

// Save the analytics data to file
function saveAnalyticsData(): void {
  if (!analyticsCache) return;

  try {
    // Update the last updated timestamp
    analyticsCache.lastUpdated = new Date().toISOString();

    // Write to file
    fs.writeFileSync(
      ANALYTICS_FILE,
      JSON.stringify(analyticsCache, null, 2),
      "utf8"
    );
  } catch (error) {
    console.error("Error writing analytics file:", error);
  }
}

// --- Page View Functions ---

// Record a page view
export function recordPageView(path: string): void {
  const analytics = getAnalyticsData();

  if (!analytics.pageViews[path]) {
    analytics.pageViews[path] = {
      path,
      count: 0,
      lastViewed: new Date().toISOString(),
    };
  }

  analytics.pageViews[path].count += 1;
  analytics.pageViews[path].lastViewed = new Date().toISOString();

  saveAnalyticsData();
}

// Get all page views
export function getPageViews(): Record<string, PageViewData> {
  return getAnalyticsData().pageViews;
}

// --- Event Functions ---

// Record an event
export function recordEvent(
  eventName: string,
  properties?: Record<string, any>
): void {
  const analytics = getAnalyticsData();

  // Create event data
  const eventData: EventData = {
    event: eventName,
    properties: properties || {},
    timestamp: new Date().toISOString(),
  };

  // Add to records
  analytics.events.records.push(eventData);

  // Update counts
  analytics.events.counts[eventName] =
    (analytics.events.counts[eventName] || 0) + 1;

  // Handle category view special case
  if (eventName === "view_category" && properties?.category_name) {
    const categoryKey = `category_${properties.category_name}`;
    analytics.events.counts[categoryKey] =
      (analytics.events.counts[categoryKey] || 0) + 1;
  }

  // Keep only the most recent 1000 events to manage file size
  if (analytics.events.records.length > 1000) {
    analytics.events.records = analytics.events.records.slice(-1000);
  }

  saveAnalyticsData();
}

// Get all event data
export function getEventData() {
  const analytics = getAnalyticsData();
  return {
    counts: analytics.events.counts,
    recentEvents: analytics.events.records.slice(-100).reverse(), // Last 100 events, newest first
  };
}

// Get specific event count
export function getEventCount(eventType: string): number {
  return getAnalyticsData().events.counts[eventType] || 0;
}

// --- Performance Functions ---

// Record performance timing
export function recordPerformanceTiming(
  data: Omit<PerformanceData, "timestamp">
): void {
  const analytics = getAnalyticsData();

  const timingData: PerformanceData = {
    ...data,
    timestamp: new Date().toISOString(),
  };

  analytics.performance.timings.push(timingData);

  // Keep only the most recent 1000 performance records
  if (analytics.performance.timings.length > 1000) {
    analytics.performance.timings = analytics.performance.timings.slice(-1000);
  }

  saveAnalyticsData();
}

// Get performance data with optional URL filtering
export function getPerformanceData(filterUrl?: string) {
  const analytics = getAnalyticsData();
  const timings = analytics.performance.timings;

  // Filter by URL if specified
  const filteredTimings = filterUrl
    ? timings.filter((item) => item.url === filterUrl)
    : timings;

  // Calculate averages by URL
  const urlGroups: Record<string, number[]> = {};

  timings.forEach((item) => {
    if (!urlGroups[item.url]) {
      urlGroups[item.url] = [];
    }
    urlGroups[item.url].push(item.pageLoadTime);
  });

  const averages = Object.entries(urlGroups).map(([url, times]) => {
    const sum = times.reduce((a, b) => a + b, 0);
    return {
      url,
      averageLoadTime: Math.round(sum / times.length),
      sampleCount: times.length,
    };
  });

  return {
    recentTimings: filteredTimings.slice(-100).reverse(), // Last 100 timings, newest first
    averages,
  };
}

// --- Error Functions ---

// Record an error
export function recordError(error: Omit<ErrorData, "timestamp">): void {
  const analytics = getAnalyticsData();

  const errorData: ErrorData = {
    ...error,
    timestamp: new Date().toISOString(),
  };

  analytics.errors.records.push(errorData);

  // Keep only the most recent 1000 errors
  if (analytics.errors.records.length > 1000) {
    analytics.errors.records = analytics.errors.records.slice(-1000);
  }

  saveAnalyticsData();
}

// Get error data
export function getErrorData() {
  const analytics = getAnalyticsData();
  const errors = analytics.errors.records;

  // Count errors by message type
  const errorCounts: Record<string, number> = {};

  errors.forEach((error) => {
    // Use first 50 chars of error message as key
    const key = error.message.substring(0, 50);
    errorCounts[key] = (errorCounts[key] || 0) + 1;
  });

  // Sort by frequency
  const mostCommonErrors = Object.entries(errorCounts)
    .map(([message, count]) => ({ message, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    recentErrors: errors.slice(-100).reverse(), // Last 100 errors, newest first
    mostCommonErrors,
    totalErrors: errors.length,
  };
}
