import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import OpenAI from "openai";

export const dynamic = 'force-dynamic';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. 권한 확인 및 조직 ID 확보
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role, organization_id")
      .eq("user_id", user.id)
      .single();

    if (roleError || !roleData || (roleData.role !== 'HQ_ADMIN' && roleData.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const orgId = roleData.organization_id;

    // 2. 본사 소속 가맹점 목록 조회
    const { data: stores, error: storesError } = await supabase
      .from("stores")
      .select("id, name")
      .eq("organization_id", orgId);

    if (storesError || !stores || stores.length === 0) {
      return NextResponse.json({ topKeywords: [], redZoneStores: [] });
    }

    const storeIds = stores.map(s => s.id);

    // 3. 최근 30일치 리뷰 데이터 조회 (내용이 있는 것만)
    const thirtyDaysAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)).toISOString();
    
    const { data: reviews, error: reviewsError } = await supabase
      .from("reviews_log")
      .select("store_id, content, rating, created_at")
      .in("store_id", storeIds)
      .not("content", "is", null)
      .gte("created_at", thirtyDaysAgo);

    if (reviewsError || !reviews || reviews.length === 0) {
      return NextResponse.json({ topKeywords: [], redZoneStores: [] });
    }

    // 4. OpenAI 연동 (AI 분석용 텍스트 병합)
    const allReviewText = reviews.map(r => r.content).join("\n---\n");

    const prompt = `너는 프랜차이즈 CS 분석 전문가다. 제공된 리뷰들은 대부분 보상 이벤트로 인해 평점이 높지만, 문맥 속에 '주차, 대기시간, 화장실, 온도, 양, 가격, 직원 응대' 등 미세한 아쉬움이나 개선 요청이 숨어있다. 극찬 속에서도 향후 리스크가 될 수 있는 '개선 요망 키워드(불만/아쉬움)' 5개를 정확히 뽑아내고, 전체 리뷰 중 해당 뉘앙스가 포함된 예상 카운트를 산출해라. 반드시 JSON 배열 형태([{ "word": "주차공간", "count": 12 }, ...])로만 응답하고 마크다운이나 부가 설명은 절대 넣지 마라.

리뷰 데이터:
${allReviewText}`;

    let topKeywords: { word: string; count: number }[] = [];

    try {
      const aiResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
      });

      const content = aiResponse.choices[0].message.content;
      if (content) {
        // AI가 가끔 마크다운을 섞어줄 경우를 대비해 청소
        const cleanedContent = content.replace(/```json|```/g, "").trim();
        topKeywords = JSON.parse(cleanedContent);
      }
    } catch (aiError) {
      console.error("OpenAI Analysis Error:", aiError);
      // AI 실패 시 빈 배열로 진행
    }

    // 5. Red Zone 매장 집계 (4점 이하 리뷰가 가장 많은 상위 3개 매장)
    const storeStats = stores.map(store => {
      const storeReviews = reviews.filter(r => r.store_id === store.id);
      const complaints = storeReviews.filter(r => r.rating <= 4);
      
      // 해당 매장의 최신 리뷰 날짜
      const lastComplaintDate = complaints.length > 0 
        ? complaints.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
        : new Date().toISOString();

      // 해당 매장의 가장 빈번한 키워드 (단순 문자열 매칭)
      let topKeyword = "일반 개선";
      let maxMatch = 0;
      
      if (topKeywords.length > 0) {
        topKeywords.forEach(kw => {
          const matchCount = storeReviews.filter(r => r.content?.includes(kw.word)).length;
          if (matchCount > maxMatch) {
            maxMatch = matchCount;
            topKeyword = kw.word;
          }
        });
      }

      return {
        id: store.id,
        name: store.name,
        complaintCount: complaints.length,
        avgSentiment: 0, // 프론트엔드에서 사용하지 않으므로 0 처리
        lastComplaintDate,
        topKeyword
      };
    });

    const redZoneStores = storeStats
      .filter(s => s.complaintCount > 0)
      .sort((a, b) => b.complaintCount - a.complaintCount)
      .slice(0, 3);

    return NextResponse.json({
      topKeywords,
      redZoneStores
    });

  } catch (error) {
    console.error("HQ Complaints API Error:", error);
    return NextResponse.json({ topKeywords: [], redZoneStores: [] }, { status: 500 });
  }
}
