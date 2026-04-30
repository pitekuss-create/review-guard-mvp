import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { storeId } = await req.json();

    if (!storeId) {
      return NextResponse.json({ error: "Store ID is required" }, { status: 400 });
    }

    // Increment QR scan count
    const { data, error } = await supabase
      .from("stores")
      .update({ 
        qr_scan_count: supabase.rpc('increment_counter', { 
          current_count: 'qr_scan_count' 
        }) 
      })
      .eq("id", storeId)
      .select("qr_scan_count")
      .single();

    if (error) {
      // If RPC doesn't work, try manual increment
      const { data: storeData, error: fetchError } = await supabase
        .from("stores")
        .select("qr_scan_count")
        .eq("id", storeId)
        .single();

      if (fetchError) {
        return NextResponse.json({ error: "Store not found" }, { status: 404 });
      }

      const newCount = (storeData?.qr_scan_count || 0) + 1;

      const { error: updateError } = await supabase
        .from("stores")
        .update({ qr_scan_count: newCount })
        .eq("id", storeId);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      return NextResponse.json({ qrScanCount: newCount });
    }

    return NextResponse.json({ qrScanCount: data?.qr_scan_count });

  } catch (error) {
    console.error("[increment-qr-scan] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
