// app/api/shortcuts/route.ts
import "server-only"; // Ensures this module only runs on the server
import fs from "fs";
import path from "path";
import { NextResponse } from "next/server"; // Import for Next.js API route responses

// Define the path to your shortcuts.json file within the public directory
// When deployed, process.cwd() refers to the root of your Next.js project.
// The 'public' directory is served statically.
const SHORTCUTS_FILE_PATH = path.join(process.cwd(), "public", "shortcuts.json");

// Define your ShortcutsConfig interface (copy from your types or hook)
interface Shortcut {
  keys: string[];
  display: string;
  action?: string;
  targetId?: string;
  targetAction?: string;
  description: string;
}

interface ShortcutsConfig {
  global: Shortcut[];
  orderEntry: Shortcut[];
  payment: Shortcut[];
  [key: string]: Shortcut[];
}

/**
 * Handles GET requests to read shortcuts.json
 * (Optional, but good for testing or initial loading)
 */
export async function GET() {
  try {
    // Ensure the file exists before attempting to read
    if (!fs.existsSync(SHORTCUTS_FILE_PATH)) {
      // If the file doesn't exist, return a default empty config
      console.warn("shortcuts.json not found, returning default empty config.");
      return NextResponse.json(
        { global: [], orderEntry: [], payment: {} },
        { status: 200 }
      );
    }

    const data = fs.readFileSync(SHORTCUTS_FILE_PATH, "utf8");
    const config: ShortcutsConfig = JSON.parse(data);
    return NextResponse.json(config);
  } catch (error) {
    console.error("Error reading shortcuts.json:", error);
    return NextResponse.json(
      { message: "Failed to load shortcuts configuration." },
      { status: 500 }
    );
  }
}

/**
 * Handles POST requests to save (update) shortcuts.json
 */
export async function POST(request: Request) {
  try {
    const updatedConfig: ShortcutsConfig = await request.json();

    // Validate incoming data (basic validation for demonstration)
    if (!updatedConfig || typeof updatedConfig !== "object") {
      return NextResponse.json(
        { message: "Invalid data format for shortcuts configuration." },
        { status: 400 }
      );
    }

    // Write the updated configuration to the file
    fs.writeFileSync(
      SHORTCUTS_FILE_PATH,
      JSON.stringify(updatedConfig, null, 2), // Pretty print JSON
      "utf8"
    );

    console.log("shortcuts.json saved successfully.");
    return NextResponse.json({ message: "Shortcuts saved successfully!" });
  } catch (error) {
    console.error("Error saving shortcuts.json:", error);
    return NextResponse.json(
      { message: "Failed to save shortcuts configuration." },
      { status: 500 }
    );
  }
}