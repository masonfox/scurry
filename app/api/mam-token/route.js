import { NextResponse } from "next/server";
import { validateMamToken } from "@/src/lib/utilities";
import { MAM_TOKEN_FILE } from "@/src/lib/constants";
import { readMamToken, isMouseholeMode, config } from "@/src/lib/config";
import fs from "node:fs";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Helper function to mask token for display
function maskToken(token) {
  return token.length > 10 
    ? `${token.slice(0, 6)}...${token.slice(-4)}`
    : token.length > 0 ? "***" : "";
}

// Get current token
export async function GET() {
  try {
    const mouseholeEnabled = isMouseholeMode();
    
    if (mouseholeEnabled) {
      try {
        const stateFile = config.mouseholeStateFile;
        const state = JSON.parse(fs.readFileSync(stateFile, "utf8"));
        const decodedToken = decodeURIComponent(state.currentCookie);
        
        return NextResponse.json({
          exists: true,
          token: maskToken(decodedToken),
          fullLength: decodedToken.length,
          location: stateFile,
          mouseholeInfo: {
            enabled: true,
            stateFile,
            lastUpdate: state.lastUpdate?.at || state.lastMam?.request?.at,
            mamUpdated: state.lastUpdate?.mamUpdated,
          },
        });
      } catch (err) {
        // Fall through to regular token file check
        console.warn("Mousehole read failed, checking static token:", err.message);
      }
    }
    
    const exists = fs.existsSync(MAM_TOKEN_FILE);
    
    if (!exists) {
      return NextResponse.json({ 
        exists: false, 
        token: null, 
        location: MAM_TOKEN_FILE,
        mouseholeInfo: mouseholeEnabled ? { enabled: true, error: "state.json not found" } : { enabled: false },
      });
    }

    const token = readMamToken();

    return NextResponse.json({ 
      exists: true, 
      token: maskToken(token),
      fullLength: token.length,
      location: MAM_TOKEN_FILE,
      mouseholeInfo: mouseholeEnabled ? { 
        enabled: true, 
        usingFallback: true,
        error: "state.json not found, using fallback token file" 
      } : { enabled: false },
    });
  } catch (error) {
    console.error(`Failed to read MAM token: ${error.message}`);
    return NextResponse.json(
      { 
        exists: false, 
        error: error.message, 
        location: MAM_TOKEN_FILE,
        mouseholeInfo: { enabled: isMouseholeMode() },
      }, 
      { status: 500 }
    );
  }
}

// Update/create token
export async function POST(req) {
  if (isMouseholeMode()) {
    return NextResponse.json(
      { error: "Token management is disabled when MOUSEHOLE_ENABLED=true. Tokens are managed by mousehole." },
      { status: 400 }
    );
  }

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
  if (isMouseholeMode()) {
    return NextResponse.json(
      { error: "Token management is disabled when MOUSEHOLE_ENABLED=true. Tokens are managed by mousehole." },
      { status: 400 }
    );
  }

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