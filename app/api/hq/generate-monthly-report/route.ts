import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

/**
 * 특정 매장의 월간 성과 리포트 스냅샷 생성 API
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { storeId } = await req.json();
  if (!storeId) {
    return NextResponse.json({ error: "Store ID is required" }, { status: 400 });
  }

  // 1. 접근 권한 확인 (관리자 또는 소유자)
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role, organization_id")
    .eq("user_id", user.id)
    .single();

  const { data: storeData } = await supabase
    .from("stores")
    .select("owner_id, organization_id")
    .eq("id", storeId)
    .single();

  if (!storeData) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  const isOwner = storeData.owner_id === user.id;
  const isOrgAdmin = roleData?.organization_id === storeData.organization_id && (roleData?.role === 'HQ_ADMIN' || roleData?.role === 'SUPER_ADMIN');

  if (!isOwner && !isOrgAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 2. 지난달 통계 산출 로직
  const now = new Date();
  const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const { data: reviews } = await supabase
    .from("reviews_log")
    .select("rating, created_at")
    .eq("store_id", storeId)
    .gte("created_at", firstDayLastMonth.toISOString())
    .lte("created_at", lastDayLastMonth.toISOString());

  const totalReviews = reviews?.length || 0;
  const avgRating = totalReviews > 0 
    ? reviews!.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews 
    : 0;

  const stats = {
    totalReviews,
    avgRating: avgRating.toFixed(2),
    generatedAt: now.toISOString(),
    period: `${firstDayLastMonth.getFullYear()}-${firstDayLastMonth.getMonth() + 1}`
  };

  // 3. monthly_reports 테이블에 스냅샷 저장 (Insert or Update)
  const reportMonth = `${firstDayLastMonth.getFullYear()}-${String(firstDayLastMonth.getMonth() + 1).padStart(2, '0')}-01`;

  const { error: upsertError } = await supabase
    .from("monthly_reports")
    .upsert({
      store_id: storeId,
      report_month: reportMonth,
      stats: stats
    }, {
      onConflict: 'store_id, report_month'
    });

  if (upsertError) {
    console.error("Monthly Report Upsert Error:", upsertError);
    return NextResponse.json({ error: "리포트 저장 중 오류가 발생했습니다." }, { status: 500 });
  }

  return NextResponse.json({ success: true, stats });
}
