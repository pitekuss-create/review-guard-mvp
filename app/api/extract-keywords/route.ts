import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

/**
 * [Billing Lock] 14-day trial period check middleware
 */
async function checkTrialPeriod(userId: string): Promise<{ valid: boolean; error?: string }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: store } = await supabase
    .from("stores")
    .select("trial_start_date")
    .eq("user_id", userId)
    .single();

  if (store?.trial_start_date) {
    const trialStart = new Date(store.trial_start_date);
    const now = new Date();
    const diffInDays = (now.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24);

    if (diffInDays > 14) {
      return { valid: false, error: "14\uac1c\uc77c \ubb34\ub8cc \uccb4\ud5d8\uc774 \uc885\ub8cc\ub418\uc5c8\uc2b5\ub2c8\ub2e4. \uacc4\uc18d\ud574\uc11c AI \uae30\ub2a5\uc744 \uc774\uc6a9\ud558\uc2dc\ub824\uba74 \ud50c\ub7a8\uc744 \uc5c5\uadf8\ub808\uc774\ub4dc\ud574 \uc8fc\uc138\uc694." };
    }
  }

  return { valid: true };
}

/**
 * [매장명 기반 AI 추론]
 * 네이버 크롤링 대신 매장 상호명을 기반으로 최적의 키워드를 생성합니다.
 */
export async function POST(req: NextRequest) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
  try {
    const { storeName, userId } = await req.json();

    if (!storeName) {
      return NextResponse.json({ error: "Store name is required." }, { status: 400 });
    }

    // [Billing Lock] Check trial period
    const { valid, error } = await checkTrialPeriod(userId);
    if (!valid) {
      return NextResponse.json({ error }, { status: 403 });
    }

    // 1. OpenAI 분석 (매장명 기반 추론)
    const systemPrompt = `너는 네이버 플레이스 검색 알고리즘에 정통한 10년 차 SEO 마케터야.
사용자의 입력값(상호명, 대표 메뉴, 주소/지역)을 바탕으로 아래 3가지 조합 공식을 무조건 사용하여 5개의 핵심 키워드를 추출해.

[키워드 조합 공식]
공식 1: [핵심 지역명] + [대표 메뉴] (예: 강남역 삼겹살)
공식 2: [핵심 지역명] + [방문 목적/상황] (예: 강남역 회식장소, 강남역 데이트)
공식 3: [주변 랜드마크] + [대표 메뉴] (예: 코엑스 근처 맛집)

[절대 규칙]
1. '친절한', '가성비', '신선한', '청결한', '아늑한', '맛있는' 등 형용사나 감성 표현은 절대 금지(Stop words).
2. 다른 군더더기 말 없이 딱 5개의 키워드만 순수 JSON 배열 형태로 반환해.

[출력 예시]
["강남역삼겹살", "강남역회식장소", "강남역데이트", "강남역고기집", "신논현역맛집"]`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `매장명: ${storeName}` }
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    let rawString = completion.choices[0]?.message?.content?.trim() || "";
    let keywords = "";

    try {
      const cleanJsonStr = rawString.replace(/```json/gi, "").replace(/```/gi, "").trim();
      const parsed = JSON.parse(cleanJsonStr);
      if (Array.isArray(parsed)) {
        keywords = parsed.join(", ");
      } else {
        keywords = rawString;
      }
    } catch(e) {
      keywords = rawString;
    }

    if (!keywords) keywords = "강남역맛집, 회식장소추천, 데이트코스";

    return NextResponse.json({ keywords });

  } catch (error) {
    console.error("[Extract Keywords Error]:", error);
    
    // AI 통신 실패 시에만 기존 Fallback 키워드를 반환
    return NextResponse.json({ 
      keywords: "강남역맛집, 회식장소추천, 데이트코스"
    });
  }
}

