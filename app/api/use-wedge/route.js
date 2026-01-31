import { NextResponse } from "next/server";
import { purchaseFlWedge } from "@/src/lib/wedge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const { torrentId } = await req.json();
    
    const result = await purchaseFlWedge(torrentId);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error, tokenExpired: result.tokenExpired },
        { status: result.statusCode || 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true,
      message: "FL wedge applied successfully",
      torrentId: result.torrentId
    });
  } catch (err) {
    console.error("Error using FL wedge:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to use FL wedge" },
      { status: 500 }
    );
  }
}
