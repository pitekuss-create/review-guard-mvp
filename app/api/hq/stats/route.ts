import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.log("🚨 [HQ Stats CCTV] 로그인 토큰이 없습니다.");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("==========================================");
  console.log(`🕵️ [HQ Stats CCTV] 현재 접속한 유저 ID: ${user.id}`);
  console.log("==========================================");

  // 1. 유저 권한 단독 조회 (조인 에러 원천 차단)
  const { data: roleData, error: roleError } = await supabase
    .from("user_roles")
    .select("role, organization_id")
    .eq("user_id", user.id)
    .single();

  console.log(`📊 [HQ Stats CCTV] DB에서 찾은 직급:`, roleData);
  if (roleError) console.log(`❌ [HQ Stats CCTV] 직급 조회 에러 (RLS 차단 의심):`, roleError.message);

  if (!roleData || (roleData.role !== 'HQ_ADMIN' && roleData.role !== 'SUPER_ADMIN')) {
    console.log("⛔ [HQ Stats CCTV] 403 에러 발생 - HQ_ADMIN 권한이 아닙니다.");
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const orgId = roleData.organization_id;

  // 2. 본사 소속 가맹점 목록 조회
  const { data: stores, error: storesError } = await supabase
    .from("stores")
    .select("id, name")
    .eq("organization_id", orgId);

  console.log(`🏪 [HQ Stats CCTV] 연결된 가맹점 개수:`, stores?.length);

  if (!stores || stores.length === 0) {
    return NextResponse.json({ stores: [] });
  }

  // 3. 리뷰 데이터 벌크 조회 (최근 14일)
  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000)).toISOString();
  const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000)).toISOString();
  const fourteenDaysAgo = new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000)).toISOString();

  const storeIds = stores.map(s => s.id);
  const { data: reviews } = await supabase
    .from("reviews_log")
    .select("store_id, rating, created_at")
    .in("store_id", storeIds)
    .gte("created_at", fourteenDaysAgo);

  const results = stores.map(store => {
    const storeReviews = reviews?.filter(r => r.store_id === store.id) || [];
    const currentWeek = storeReviews.filter(r => r.created_at >= sevenDaysAgo);
    const prevWeek = storeReviews.filter(r => r.created_at < sevenDaysAgo && r.created_at >= fourteenDaysAgo);

    const currentAvg = currentWeek.length > 0 ? currentWeek.reduce((acc, curr) => acc + curr.rating, 0) / currentWeek.length : 0;
    const prevAvg = prevWeek.length > 0 ? prevWeek.reduce((acc, curr) => acc + curr.rating, 0) / prevWeek.length : 0;
    const ratingDiff = prevAvg > 0 ? (prevAvg - currentAvg) : 0;

    const hasRecentBadReview = storeReviews.some(r => r.created_at >= threeDaysAgo && r.rating <= 3);
    const isCrisis = ratingDiff >= 0.3 || hasRecentBadReview;

    return {
      id: store.id,
      name: store.name,
      avgRating: currentAvg.toFixed(1),
      totalReviews: currentWeek.length,
      ratingDiff: ratingDiff.toFixed(2),
      status: isCrisis ? 'CRISIS' : (ratingDiff > 0 ? 'WARN' : 'GOOD'),
      isCrisis
    };
  });

  results.sort((a, b) => (b.isCrisis ? 1 : 0) - (a.isCrisis ? 1 : 0));
  return NextResponse.json({ stores: results });
}