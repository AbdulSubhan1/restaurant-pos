import { NextRequest, NextResponse } from "next/server";
import { recordPageView, getPageViews } from "@/lib/fileStorage";

// Ensure this route is always dynamically rendered
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path } = body;

    if (!path) {
      return NextResponse.json(
        { success: false, message: "Path is required" },
        { status: 400 }
      );
    }

    // Record page view using file storage
    recordPageView(path);
    const pageViews = getPageViews();

    console.log(
      `[Analytics] Recorded page view for: ${path} (${
        pageViews[path]?.count || 0
      } views)`
    );

    return NextResponse.json({
      success: true,
      path,
      views: pageViews[path]?.count || 0,
    });
  } catch (error) {
    console.error("[Analytics API] Error recording page view:", error);
    return NextResponse.json(
      { success: false, message: "Failed to record page view" },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve analytics data (for admin dashboard)
export async function GET(request: NextRequest) {
  try {
    // In a real app, you might want to check for authentication here
    const pageViews = getPageViews();

    return NextResponse.json({
      success: true,
      pageViews,
    });
  } catch (error) {
    console.error("[Analytics API] Error retrieving page views:", error);
    return NextResponse.json(
      { success: false, message: "Failed to retrieve page views" },
      { status: 500 }
    );
  }
}
