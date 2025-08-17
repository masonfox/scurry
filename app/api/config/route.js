import { NextResponse } from "next/server";
import { initializeDatabases, getConfig, setConfig } from "@/src/lib/database";
import { getHardcoverUserId } from "@/src/lib/hardcover";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await initializeDatabases();
    
    const config = {
      mamToken: await getConfig('mam_token'),
      hardcoverToken: await getConfig('hardcover_token'),
      hardcoverUserId: await getConfig('hardcover_user_id'),
    };

    // Don't expose actual tokens in response, just indicate if they exist
    return NextResponse.json({
      mamTokenExists: !!config.mamToken,
      hardcoverTokenExists: !!config.hardcoverToken,
      hardcoverUserIdExists: !!config.hardcoverUserId,
    });
  } catch (error) {
    console.error('Error fetching config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch configuration' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await initializeDatabases();
    const body = await req.json();
    
    const { mamToken, hardcoverToken, hardcoverUserId } = body;

    if (mamToken !== undefined) {
      await setConfig('mam_token', mamToken);
    }
    
    if (hardcoverToken !== undefined) {
      await setConfig('hardcover_token', hardcoverToken);
      
      // Automatically fetch and save user ID when token is provided
      if (hardcoverToken) {
        try {
          const userId = await getHardcoverUserId();
          if (userId) {
            await setConfig('hardcover_user_id', userId.toString());
          }
        } catch (error) {
          console.error('Could not automatically fetch user ID:', error.message);
          // Don't fail the entire request if user ID fetch fails
        }
      }
    }
    
    if (hardcoverUserId !== undefined) {
      await setConfig('hardcover_user_id', hardcoverUserId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating config:', error);
    return NextResponse.json(
      { error: 'Failed to update configuration' },
      { status: 500 }
    );
  }
}
