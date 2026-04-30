import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

// Next.js의 악랄한 API 캐싱을 원천 차단하는 무적 방어막
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/* 매장 컨셉 및 주소 조회 */
async function getStoreConcept(storeId: string): Promise<{ concept: string; placeUrl: string; trialStartDate: string | null }> {
  // 하드코딩된 Supabase 정보 (MVP 테스트용 유지)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase
    .from("stores")
    .select("concept, place_url, trial_start_date")
    .eq("id", storeId)
    .single();

  if (error) {
    console.error("[getStoreConcept Error]:", error);
  }

  // DB에서 가져온 place_url을 프론트엔드가 알아먹을 수 있게 placeUrl로 변환
  const fetchedUrl = data?.place_url ?? "";
  console.log(`[getStoreConcept] storeId: ${storeId}, place_url: ${fetchedUrl}`);

  return {
    concept: data?.concept ?? "",
    placeUrl: fetchedUrl,
    trialStartDate: data?.trial_start_date ?? null
  };
}

export async function POST(req: NextRequest) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const { rating, tags, storeId, language } = await req.json();

    if (!tags) {
      return NextResponse.json(
        { error: "키워드가 필요합니다." },
        { status: 400 },
      );
    }

    const storeData = storeId ? await getStoreConcept(storeId) : { concept: "", placeUrl: "", trialStartDate: null };

    // [Billing Lock] 트라이얼 기간(14일) 체크
    if (storeData.trialStartDate) {
      const trialStart = new Date(storeData.trialStartDate);
      const now = new Date();
      const diffInDays = (now.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24);

      if (diffInDays > 14) {
        return NextResponse.json(
          { error: "무료 체험 기간이 만료되었습니다. 플랜을 업그레이드하세요." },
          { status: 403 }
        );
      }
    }

    const concept = storeData.concept;
    const placeUrl = storeData.placeUrl;

    const systemPrompt = `너는 방금 맛집을 방문하고 엄청나게 만족해서 네이버 플레이스 영수증 리뷰를 남기는 20~30대 손님이야.
사용자가 선택한 [키워드]들을 바탕으로, 절대 AI가 쓴 티가 나지 않는 100% 리얼한 구어체 리뷰를 작성해 줘.

[절대 지켜야 할 작성 규칙]

무조건적인 극찬 강제: 너는 이 식당에서 단 하나의 단점도 느끼지 못한 상태야. 사용자가 4점을 주든 5점을 주든, 절대 아쉬운 점, 개선점, 단점("~했으면 좋겠다", "~만 빼면")을 스스로 지어내서 쓰지 마. 100% 긍정적이고 만족스러운 경험만으로 텍스트를 채워.

형식: 번호나 글머리 기호(✔️, 1. 2.)를 절대 사용하지 마. 인스타그램 피드 글이나 카톡 메시지처럼 자연스럽게 문장으로 쓰고, 문장과 문장 사이에는 줄바꿈(Enter)을 자주 해서 스크롤을 길게 만들어.

도입부: 무조건 '방문 동기'나 '상황'을 상상해서 지어내며 시작해. (예: "친구 추천으로 왔는데", "퇴근하고 너무 배고파서 혼밥하러 들렀어요", "요즘 여기 핫하다고 해서 와봄ㅋㅋ")

표현력: '미쳤다', '도랏', '찢었다', '대존맛', 'ㅋㅋㅋㅋ', 'ㅎㅎㅎ' 같은 요즘 유행어나 의성어/의태어를 적극적으로 섞어 써.

디테일: 단순히 "맛있어요"라고 하지 말고, 혀로 맛을 느끼는 것처럼 묘사해. (예: "육즙이 팡팡 터짐", "소스가 단짠단짠 미쳤음")

길이 강제: 글자 수 150~200자 내외로, 모바일 화면에서 봤을 때 5~7줄 정도 길어 보이게 써 줘.

시각적 여백 강제: 절대 글을 하나의 거대한 문단으로 뭉쳐서 쓰지 마. 반드시 1~2문장이 끝날 때마다 **무조건 줄바꿈(Enter)을 두 번씩 적용(\\n\\n)**하여, 문단과 문단 사이에 뻥 뚫린 빈 줄을 만들어. 모바일 화면에서 스크롤을 내리며 읽기 편하도록 시각적인 세로 길이를 길게 빼는 것이 최우선 목표야.

[출력 예시]
동네에 새로 생겼길래 퇴근하고 호다닥 와봤어요!🏃‍♀️

일단 고기 퀄리티가 진짜 미쳤음... 입에 넣자마자 살살 녹아요 ㅠㅠㅠ
양도 엄청 많아서 배터지는 줄ㅋㅋㅋㅋ

사장님도 계속 필요한 거 없냐고 물어봐주시고 넘 친절하심!🥰
매장 분위기도 힙해서 담엔 남친 데리고 올게용 대박나세요!!👍`;

    const userPrompt = `매장 컨셉: ${concept || "없음"}
별점: ${rating ?? "없음"}점
고객이 선택한 키워드: ${tags}

위 정보를 바탕으로 자연스러운 고객 리뷰를 작성해줘.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.9,
      max_tokens: 512,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const review = completion.choices[0]?.message?.content?.trim() ?? "";

    // 리뷰 생성 성공 시 DB 로그 적재
    if (review && storeId) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // 오타가 수정된 테이블명: reviews_log
      await supabase.from("reviews_log").insert({
        store_id: storeId,
        rating: rating,
        selected_tags: Array.isArray(tags) ? tags.join(", ") : tags,
        generated_text: review,
        is_copied: false
      });
    }

    // 프론트엔드로 리뷰 텍스트와 네이버 주소(placeUrl)를 함께 전달
    return NextResponse.json({ review, placeUrl });

  } catch (err: unknown) {
    console.error("[generate-review]", err);
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}