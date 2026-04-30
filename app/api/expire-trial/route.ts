import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // 15 days ago from now
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

    const { error } = await supabase
      .from("stores")
      .update({ trial_start_date: fifteenDaysAgo.toISOString() })
      .eq("user_id", userId);

    if (error) {
      console.error("[expire-trial] Update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Trial period has been set to expired (15 days ago)",
      expiredDate: fifteenDaysAgo.toISOString()
    });

  } catch (error) {
    console.error("[expire-trial] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
