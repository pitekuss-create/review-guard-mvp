import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

/**
 * GET /api/keywords?storeId=xxx
 * 특정 매장의 키워드(concept), 네이버 URL, 트라이얼 상태 조회
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");

    let query = supabase
      .from("stores")
      .select("concept, place_url, id, trial_start_date, name");

    if (storeId) {
      query = query.eq("id", storeId).eq("user_id", user.id);
    } else {
      // storeId가 없으면 사용자의 첫 번째 매장 조회 (하위 호환성)
      query = query.eq("user_id", user.id).limit(1);
    }

    const { data: store, error: findError } = await query.single();

    if (findError || !store) {
      console.warn("[GET /api/keywords] Store not found:", { storeId, userId: user.id });
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    // 트라이얼 시작일 자동 설정 (첫 진입 시)
    if (!store.trial_start_date) {
      await supabase
        .from("stores")
        .update({ trial_start_date: new Date().toISOString() })
        .eq("id", store.id);
    }

    return NextResponse.json({ 
      concept: store.concept ?? "", 
      placeUrl: store.place_url ?? "",
      trialStartDate: store.trial_start_date || new Date().toISOString(),
      storeName: store.name
    });
  } catch (error: any) {
    console.error("[GET /api/keywords] Internal Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * PATCH /api/keywords
 * 매장 키워드 및 관련 정보 업데이트
 */
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { storeId, concept, placeUrl, name } = body;

    if (!storeId && !concept && placeUrl === undefined && name === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 대상 매장 식별 (보안상 user_id 체크 병행 가능하나, RLS가 설정되어 있다고 가정)
    let targetStoreId = storeId;
    if (!targetStoreId) {
      const { data: defaultStore } = await supabase
        .from("stores")
        .select("id")
        .eq("user_id", user.id)
        .limit(1)
        .single();
      targetStoreId = defaultStore?.id;
    }

    if (!targetStoreId) {
      return NextResponse.json({ error: "Target store not found" }, { status: 404 });
    }

    const updateData: Record<string, any> = {};
    if (concept !== undefined) updateData.concept = concept;
    if (placeUrl !== undefined) updateData.place_url = placeUrl;
    if (name !== undefined) updateData.name = name;

    const { error } = await supabase
      .from("stores")
      .update(updateData)
      .eq("id", targetStoreId)
      .eq("user_id", user.id);

    if (error) {
      console.error("[PATCH /api/keywords] Update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, concept, name });
  } catch (error: any) {
    console.error("[PATCH /api/keywords] Internal Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
