import { NextRequest, NextResponse } from "next/server";
import { recordError, getErrorData } from "@/lib/fileStorage";

// Ensure this route is always dynamically rendered
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, stack, context, url, timestamp } = body;

    if (!message) {
      return NextResponse.json(
        { success: false, message: "Error message is required" },
        { status: 400 }
      );
    }

    // Store error report using file storage
    recordError({
      message,
      stack,
      url,
      context,
    });

    console.error(`[Error Tracking] Recorded error: ${message}`);

    return NextResponse.json({
      success: true,
      recorded: true,
    });
  } catch (error) {
    console.error("[Error API] Error recording error report:", error);
    return NextResponse.json(
      { success: false, message: "Failed to record error report" },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve error data (for admin dashboard)
export async function GET(request: NextRequest) {
  try {
    // In a real app, you'd check for authentication here

    // Get error data from file storage
    const errorData = getErrorData();

    return NextResponse.json({
      success: true,
      recentErrors: errorData.recentErrors,
      mostCommonErrors: errorData.mostCommonErrors,
      totalErrors: errorData.totalErrors,
    });
  } catch (error) {
    console.error("[Error API] Error retrieving error reports:", error);
    return NextResponse.json(
      { success: false, message: "Failed to retrieve error reports" },
      { status: 500 }
    );
  }
}
