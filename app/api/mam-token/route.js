import { NextResponse } from "next/server";
import { validateMamToken } from "@/src/lib/utilities";
import { MAM_TOKEN_FILE } from "@/src/lib/constants";
import { readMamToken } from "@/src/lib/config";
import fs from "node:fs";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Get current token
export async function GET() {
  try {
    const exists = fs.existsSync(MAM_TOKEN_FILE);
    
    if (!exists) {
      return NextResponse.json({ 
        exists: false, 
        token: null, 
        location: MAM_TOKEN_FILE 
      });
    }

    const token = readMamToken();
    
    // Don't send the full token for security - just first/last few chars
    const maskedToken = token.length > 10 
      ? `${token.slice(0, 6)}...${token.slice(-4)}`
      : token.length > 0 ? "***" : "";

    return NextResponse.json({ 
      exists: true, 
      token: maskedToken,
      fullLength: token.length,
      location: MAM_TOKEN_FILE 
    });
  } catch (error) {
    console.error(`Failed to read MAM token: ${error.message}`);
    return NextResponse.json(
      { 
        exists: false, 
        error: error.message, 
        location: MAM_TOKEN_FILE 
      }, 
      { status: 500 }
    );
  }
}

// Update/create token
export async function POST(req) {
  try {
    const body = await req.json();
    const { token } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Token is required and must be a string" },
        { status: 400 }
      );
    }

    const trimmedToken = token.trim();
    
    if (trimmedToken.length === 0) {
      return NextResponse.json(
        { error: "Token cannot be empty" },
        { status: 400 }
      );
    }

    // Validate token format
    if (!validateMamToken(trimmedToken)) {
      return NextResponse.json(
        { 
          error: "Token format appears invalid. MAM tokens are typically long alphanumeric strings (50+ characters).",
          warning: true // This is a warning, not a hard error
        },
        { status: 400 }
      );
    }

    // Ensure the directory exists
    const tokenDir = path.dirname(MAM_TOKEN_FILE);
    if (!fs.existsSync(tokenDir)) {
      fs.mkdirSync(tokenDir, { recursive: true });
    }

    // Write the token to the file
    fs.writeFileSync(MAM_TOKEN_FILE, trimmedToken, "utf8");

    console.log(`Successfully updated MAM token file: ${MAM_TOKEN_FILE}`);

    return NextResponse.json({ 
      success: true, 
      message: "Token updated successfully",
      location: MAM_TOKEN_FILE,
      length: trimmedToken.length
    });
  } catch (error) {
    console.error(`Failed to write MAM token: ${error.message}`);
    return NextResponse.json(
      { error: `Failed to save token: ${error.message}` },
      { status: 500 }
    );
  }
}

// Delete token
export async function DELETE() {
  try {
    if (fs.existsSync(MAM_TOKEN_FILE)) {
      fs.unlinkSync(MAM_TOKEN_FILE);
      console.log(`Successfully deleted MAM token file: ${MAM_TOKEN_FILE}`);
    }

    return NextResponse.json({ 
      success: true, 
      message: "Token deleted successfully",
      location: MAM_TOKEN_FILE
    });
  } catch (error) {
    console.error(`Failed to delete MAM token: ${error.message}`);
    return NextResponse.json(
      { error: `Failed to delete token: ${error.message}` },
      { status: 500 }
    );
  }
}