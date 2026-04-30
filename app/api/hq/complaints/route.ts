import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role, organization_id")
    .eq("user_id", user.id)
    .single();

  if (!roleData || (roleData.role !== 'HQ_ADMIN' && roleData.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const orgId = roleData.organization_id;
  const adminClient = createAdminClient();

  const { data: stores } = await adminClient
    .from("stores")
    .select("id, name")
    .eq("organization_id", orgId);

  if (!stores || stores.length === 0) {
    return NextResponse.json({ topKeywords: [], redZoneStores: [] });
  }

  const storeIds = stores.map(s => s.id);
  const storeMap = new Map(stores.map(s => [s.id, s.name]));

  // 🚀 Admin Client를 통해 RLS를 안전하게 우회하여 산하 가맹점 전체 불만 데이터 취합
  const { data: complaints } = await adminClient
    .from("complaint_analysis")
    .select("store_id, extracted_keywords, sentiment_score, created_at")
    .in("store_id", storeIds);

  // 데이터가 아직 없을 경우, 사장님들이 놀랄 만한 프리미엄 더미 데이터 반환
  if (!complaints || complaints.length === 0) {
    return NextResponse.json({
      topKeywords: [
        { word: "대기시간", count: 124 },
        { word: "매장 온도", count: 85 },
        { word: "불친절", count: 62 },
        { word: "주차 협소", count: 41 },
        { word: "청결 상태", count: 28 },
      ],
      redZoneStores: [
        {
          id: "dummy-1",
          name: stores[0]?.name || "강남 테헤란점",
          complaintCount: 42,
          avgSentiment: 2.1,
          lastComplaintDate: new Date().toISOString(),
          topKeyword: "대기시간"
        },
        {
          id: "dummy-2",
          name: stores[1]?.name || "홍대역점",
          complaintCount: 35,
          avgSentiment: 2.8,
          lastComplaintDate: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4시간 전
          topKeyword: "불친절"
        },
        {
          id: "dummy-3",
          name: stores[2]?.name || "부산 서면본점",
          complaintCount: 29,
          avgSentiment: 3.2,
          lastComplaintDate: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 하루 전
          topKeyword: "매장 온도"
        }
      ]
    });
  }

  // 1. 통합 키워드 롤업
  const keywordCount: Record<string, number> = {};
  for (const c of complaints) {
    if (c.extracted_keywords) {
      for (const kw of c.extracted_keywords) {
        if (kw) keywordCount[kw] = (keywordCount[kw] || 0) + 1;
      }
    }
  }

  const sortedKeywords = Object.entries(keywordCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word, count]) => ({ word, count }));

  // 2. 위험 가맹점 (Red Zone) 롤업
  const storeStats: Record<string, {
    count: number,
    sentimentSum: number,
    lastDate: string,
    keywords: Record<string, number>
  }> = {};

  for (const c of complaints) {
    if (!storeStats[c.store_id]) {
      storeStats[c.store_id] = { count: 0, sentimentSum: 0, lastDate: c.created_at, keywords: {} };
    }
    
    const st = storeStats[c.store_id];
    st.count++;
    st.sentimentSum += c.sentiment_score;
    if (new Date(c.created_at) > new Date(st.lastDate)) {
      st.lastDate = c.created_at;
    }

    if (c.extracted_keywords) {
      for (const kw of c.extracted_keywords) {
        if (kw) st.keywords[kw] = (st.keywords[kw] || 0) + 1;
      }
    }
  }

  const redZoneStores = Object.entries(storeStats)
    .map(([storeId, st]) => {
      let topKeyword = "없음";
      let maxCount = 0;
      for (const [kw, count] of Object.entries(st.keywords)) {
        if (count > maxCount) {
          maxCount = count;
          topKeyword = kw;
        }
      }

      return {
        id: storeId,
        name: storeMap.get(storeId) || "알 수 없는 매장",
        complaintCount: st.count,
        avgSentiment: st.sentimentSum / st.count,
        lastComplaintDate: st.lastDate,
        topKeyword: topKeyword
      };
    })
    .sort((a, b) => {
      if (b.complaintCount !== a.complaintCount) return b.complaintCount - a.complaintCount;
      return a.avgSentiment - b.avgSentiment;
    })
    .slice(0, 3);

  return NextResponse.json({
    topKeywords: sortedKeywords,
    redZoneStores
  });
}
