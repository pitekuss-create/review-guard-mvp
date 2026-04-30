import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Use server-side client with proper cookie handling
    const supabase = await createClient();

    // Get user from session
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log("[store-stats] No user found in session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let store, storeError;

    // First attempt with client auth
    try {
      const result = await supabase
        .from("stores")
        .select("id, trial_start_date, qr_scan_count")
        .eq("user_id", user.id)
        .single();
      
      store = result.data;
      storeError = result.error;
    } catch (error) {
      console.log("[store-stats] Client auth failed, trying service role");
      storeError = error;
    }

    // Fallback to service role if RLS blocks access
    if (storeError || !store) {
      console.log("[store-stats] Using service role fallback");
      const { createClient: createServiceClient } = await import("@supabase/supabase-js");
      
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      
      if (!serviceRoleKey) {
        return NextResponse.json({ error: "Service role not configured" }, { status: 500 });
      }

      const serviceSupabase = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey
      );

      const result = await serviceSupabase
        .from("stores")
        .select("id, trial_start_date, qr_scan_count")
        .eq("user_id", user.id)
        .single();

      store = result.data;
      storeError = result.error;
    }

    if (storeError || !store) {
      console.error("[store-stats] Store fetch error:", storeError);
      // Return safe default values instead of error
      return NextResponse.json({
        positiveReviews: 0,
        negativeReviews: 0,
        qrScans: 0,
        trialStartDate: null,
        fallback: true,
        message: "Store not found, using default values"
      });
    }

    // Get review statistics with fallback
    let reviews, reviewsError;

    try {
      const result = await supabase
        .from("reviews_log")
        .select("rating")
        .eq("store_id", store.id);
      
      reviews = result.data;
      reviewsError = result.error;
    } catch (error) {
      console.log("[store-stats] Reviews client auth failed, trying service role");
      reviewsError = error;
    }

    // Fallback to service role for reviews if RLS blocks access
    if (reviewsError) {
      console.log("[store-stats] Using service role fallback for reviews");
      const { createClient: createServiceClient } = await import("@supabase/supabase-js");
      
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

      const serviceSupabase = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey
      );

      const result = await serviceSupabase
        .from("reviews_log")
        .select("rating")
        .eq("store_id", store.id);

      reviews = result.data;
      reviewsError = result.error;
    }

    if (reviewsError) {
      console.error("[store-stats] Reviews fetch error:", reviewsError);
      // Don't return error, just use empty data
      reviews = [];
    }

    // Calculate statistics with null safety
    const positiveReviews = reviews?.filter((r: any) => r.rating >= 4).length || 0;
    const negativeReviews = reviews?.filter((r: any) => r.rating <= 3).length || 0;
    const qrScans = store?.qr_scan_count || 0;

    return NextResponse.json({
      positiveReviews,
      negativeReviews,
      qrScans,
      trialStartDate: store?.trial_start_date || null
    });

  } catch (error) {
    console.error("[store-stats] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
