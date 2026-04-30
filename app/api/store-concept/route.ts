import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

/* GET — 현재 매장의 concept 조회 및 트라이얼 시작일 기록 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");

    if (!storeId) {
      return NextResponse.json({ error: "storeId is required" }, { status: 400 });
    }

    const { data: store, error: findError } = await supabase
      .from("stores")
      .select("concept, place_url, id, trial_start_date")
      .eq("user_id", user.id)
      .eq("id", storeId)
      .single();

    if (findError || !store) {
      return NextResponse.json({ error: "Store not found for this user" }, { status: 404 });
    }

    // 트라이얼 시작일이 없으면 현재 시간으로 기록 (첫 대시보드 진입 시점)
    if (!store.trial_start_date) {
      await supabase
        .from("stores")
        .update({ trial_start_date: new Date().toISOString() })
        .eq("id", store.id);
    }

    return NextResponse.json({ 
      concept: store.concept ?? "", 
      placeUrl: store.place_url ?? "",
      trialStartDate: store.trial_start_date || new Date().toISOString()
    });
  } catch (error: any) {
    console.error("[GET /api/store-concept] Internal Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

/* PATCH — 매장 concept 업데이트 */
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { storeId } = body;
    const concept = typeof body.concept === "string" ? body.concept.trim() : "";
    const placeUrl = typeof body.placeUrl === "string" ? body.placeUrl.trim() : undefined;

    if (!storeId) {
      return NextResponse.json({ error: "storeId is required" }, { status: 400 });
    }

    const { data: store, error: findError } = await supabase
      .from("stores")
      .select("id")
      .eq("user_id", user.id)
      .eq("id", storeId)
      .single();

    if (findError || !store) {
      return NextResponse.json({ error: "Store not found for this user" }, { status: 404 });
    }

    console.log("[PATCH /api/store-concept] Updating store:", store.id, { concept, placeUrl });

    const updateData: Record<string, any> = { concept };
    if (placeUrl !== undefined) {
      updateData.place_url = placeUrl;
    }

    const { error } = await supabase
      .from("stores")
      .update(updateData)
      .eq("id", store.id);

    if (error) {
      console.error("[PATCH /api/store-concept] Update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, concept });
  } catch (error: any) {
    console.error("[PATCH /api/store-concept] Internal Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
