import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: "Forbidden in production" }, { status: 403 });
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { userId, action } = await req.json();

    if (!userId || !action) {
      return NextResponse.json({ 
        success: false,
        error: "User ID and action are required",
        details: `Missing: ${!userId ? 'userId ' : ''}${!action ? 'action' : ''}`
      }, { status: 400 });
    }

    // Validate action
    const validActions = ['reset', 'd3', 'expired', 'sync_db'];
    if (!validActions.includes(action)) {
      return NextResponse.json({ 
        success: false,
        error: "Invalid action",
        details: `Valid actions: ${validActions.join(', ')}`
      }, { status: 400 });
    }

    let targetDate: Date | null = null;
    let message: string;

    switch (action) {
      case 'reset':
        // Reset to today (D-14)
        targetDate = new Date();
        message = "Demo Mode (D-14)";
        break;
      
      case 'd3':
        // Set to D-3 (11 days ago)
        targetDate = new Date();
        targetDate.setDate(targetDate.getDate() - 11);
        message = "Trial set to D-3";
        break;
      
      case 'expired':
        // Set to expired (15 days ago)
        targetDate = new Date();
        targetDate.setDate(targetDate.getDate() - 15);
        message = "Trial set to expired (D-0)";
        break;
      
      case 'sync_db':
        // Clear trial_start_date to sync with actual DB subscription_ends_at
        targetDate = null;
        message = "Real Today (Synced with DB)";
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    try {
      // First check if store exists
      const { data: existingStore, error: checkError } = await supabase
        .from("stores")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // Not found error
        console.error("[time-machine] Store check error:", checkError);
        return NextResponse.json({ 
          success: false,
          error: "Failed to check store existence",
          details: checkError.message
        }, { status: 500 });
      }

      // If store doesn't exist, create it first
      if (!existingStore) {
        console.log("[time-machine] Store not found, creating new store");
        const { error: createError } = await supabase
          .from("stores")
          .insert({
            user_id: userId,
            name: "타임머신 테스트 매장",
            trial_start_date: targetDate ? targetDate.toISOString() : null,
            qr_scan_count: 0
          });

        if (createError) {
          console.error("[time-machine] Store creation error:", createError);
          return NextResponse.json({ 
            success: false,
            error: "Failed to create store",
            details: createError.message
          }, { status: 500 });
        }
      } else {
        // Update existing store
        const { error: updateError } = await supabase
          .from("stores")
          .update({ trial_start_date: targetDate ? targetDate.toISOString() : null })
          .eq("user_id", userId);

        if (updateError) {
          console.error("[time-machine] Update error:", updateError);
          return NextResponse.json({ 
            success: false,
            error: updateError.message,
            details: "Failed to update trial_start_date"
          }, { status: 500 });
        }
      }

      return NextResponse.json({ 
        success: true, 
        message: existingStore ? message : `Store created and ${message.toLowerCase()}`,
        trialStartDate: targetDate ? targetDate.toISOString() : null,
        daysRemaining: action === 'expired' ? 0 : action === 'sync_db' ? null : action === 'd3' ? 3 : 14,
        storeCreated: !existingStore
      });

    } catch (dbError) {
      console.error("[time-machine] Database operation error:", dbError);
      return NextResponse.json({ 
        success: false,
        error: "Database operation failed",
        details: dbError instanceof Error ? dbError.message : "Unknown database error"
      }, { status: 500 });
    }

  } catch (error) {
    console.error("[time-machine] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
