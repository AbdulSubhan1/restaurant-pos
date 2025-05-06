import { NextRequest, NextResponse } from "next/server";
import { recordPerformanceTiming, getPerformanceData } from "@/lib/fileStorage";

// Ensure this route is always dynamically rendered
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pageLoadTime, url, timeToFirstByte, domContentLoaded, timestamp } =
      body;

    if (!pageLoadTime || !url) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Store performance data using file storage
    recordPerformanceTiming({
      pageLoadTime,
      url,
      timeToFirstByte: timeToFirstByte || 0,
      domContentLoaded: domContentLoaded || 0,
    });

    console.log(`[Performance] Recorded timing for ${url}: ${pageLoadTime}ms`);

    return NextResponse.json({
      success: true,
      recorded: true,
    });
  } catch (error) {
    console.error("[Performance API] Error recording timing:", error);
    return NextResponse.json(
      { success: false, message: "Failed to record performance data" },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve performance data (for admin dashboard)
export async function GET(request: NextRequest) {
  try {
    // In a real app, you'd check for authentication here

    // Allow filtering by URL
    const url = new URL(request.url);
    const path = url.searchParams.get("path");

    // Get performance data from file storage
    const performanceData = getPerformanceData(path || undefined);

    return NextResponse.json({
      success: true,
      recentTimings: performanceData.recentTimings,
      averages: performanceData.averages,
    });
  } catch (error) {
    console.error("[Performance API] Error retrieving timing data:", error);
    return NextResponse.json(
      { success: false, message: "Failed to retrieve performance data" },
      { status: 500 }
    );
  }
}
