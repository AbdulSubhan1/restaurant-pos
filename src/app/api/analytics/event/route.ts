import { NextRequest, NextResponse } from "next/server";
import { recordEvent, getEventData, getEventCount } from "@/lib/fileStorage";

// Ensure this route is always dynamically rendered
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, properties } = body;

    if (!event) {
      return NextResponse.json(
        { success: false, message: "Event name is required" },
        { status: 400 }
      );
    }

    // Record event using file storage
    recordEvent(event, properties || {});

    console.log(`[Analytics] Recorded event: ${event}`, properties);

    return NextResponse.json({
      success: true,
      event,
      count: getEventCount(event),
    });
  } catch (error) {
    console.error("[Analytics API] Error recording event:", error);
    return NextResponse.json(
      { success: false, message: "Failed to record event" },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve event data (for admin dashboard)
export async function GET(request: NextRequest) {
  try {
    // In a real app, you might want to check for authentication here
    const { searchParams } = new URL(request.url);
    const eventType = searchParams.get("type");

    if (eventType) {
      // Return counts for specific event type
      return NextResponse.json({
        success: true,
        eventType,
        count: getEventCount(eventType),
      });
    }

    // Get all event data from file storage
    const eventData = getEventData();

    // Return all event counts grouped by type
    return NextResponse.json({
      success: true,
      eventCounts: eventData.counts,
      // Return recent events for detailed view
      recentEvents: eventData.recentEvents,
    });
  } catch (error) {
    console.error("[Analytics API] Error retrieving events:", error);
    return NextResponse.json(
      { success: false, message: "Failed to retrieve events" },
      { status: 500 }
    );
  }
}
