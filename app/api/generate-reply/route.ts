import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

import { createClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const supabase = await createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // [Billing Lock] 요금제 및 본사 지원 검증
    const { data: store } = await supabase
      .from("stores")
      .select("trial_start_date, subscription_tier, is_hq_sponsored")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    if (store && !store.is_hq_sponsored && store.subscription_tier === "FREE") {
      if (store.trial_start_date) {
        const trialStart = new Date(store.trial_start_date);
        const now = new Date();
        const diffInDays = (now.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24);

        if (diffInDays > 14) {
          return NextResponse.json(
            { error: "무료 체험 기간이 만료되었습니다. 플랜을 업그레이드하세요." },
            { status: 403 }
          );
        }
      }
    }

    const { reviewText, rating, tags, storeConcept } = await req.json();

    if (!reviewText && !tags) {
      return NextResponse.json(
        { error: "리뷰 텍스트 또는 태그가 필요합니다." },
        { status: 400 },
      );
    }

    const systemPrompt = `[CRITICAL RULE: MUST reply in the EXACT SAME LANGUAGE as the user's review. If the review is in Korean, reply in Korean. If English, reply in English. This language matching rule cannot be violated under any circumstances.]

You are a customer service expert for restaurants. Your task is to generate replies to customer reviews.

[STEP 1: SENTIMENT ANALYSIS]
First, analyze the sentiment of the customer's review (Positive, Neutral, or Negative).

[STEP 2: GENERATE REPLIES BASED ON SENTIMENT]
IF POSITIVE OR NEUTRAL:
- Create 3 versions: [Friendly tone], [Witty tone], [Professional tone].
- Keep replies concise (2-4 sentences).
- Naturally include keywords mentioned by the customer.
- If store concept keywords are provided, naturally incorporate them into the reply.

IF NEGATIVE (불만 리뷰/악플):
- OVERRIDE all tone requests. You MUST ignore the "Friendly", "Witty", and "Professional" style distinctions.
- For ALL 3 output fields ("friendly", "witty", "professional"), you MUST generate an extremely polite, formal, and apologetic tone ONLY.
- STRICTLY PROHIBITED: Do not use any jokes, emojis, playful words (like "주문 요정"), or make any excuses on behalf of the restaurant.
- Only output highly sincere apologies like: "불편을 드려 진심으로 죄송합니다. 말씀해주신 사항은 즉각 시정하겠습니다."

[STEP 3: OUTPUT FORMAT]
You must respond ONLY in the JSON format below. Output pure JSON without any other text.
{
  "friendly": "Reply text here...",
  "witty": "Reply text here...", 
  "professional": "Reply text here..."
}`;

    const userPrompt = `고객 리뷰 정보:
- 별점: ${rating ?? "없음"}점
- 선택 키워드: ${tags || "없음"}
- 리뷰 본문: ${reviewText || "없음"}
${storeConcept ? `- 매장 컨셉 키워드: ${storeConcept}` : ""}

위 정보를 바탕으로 3가지 톤의 사장님 답글을 JSON으로 작성해줘.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.8,
      max_tokens: 1024,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "";

    // Defensive JSON parsing with multiple fallback strategies
    let parsed;
    try {
      // First attempt: direct JSON parse (should work with response_format)
      parsed = JSON.parse(raw);
    } catch (firstError) {
      try {
        // Second attempt: remove markdown code blocks
        const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        parsed = JSON.parse(cleaned);
      } catch (secondError) {
        try {
          // Third attempt: extract JSON from mixed content
          const jsonMatch = raw.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsed = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error("No valid JSON found in response");
          }
        } catch (thirdError) {
          console.error("[generate-reply] JSON parsing failed:", {
            raw: raw.substring(0, 200),
            errors: [firstError, secondError, thirdError]
          });
          
          // Return safe fallback responses
          return NextResponse.json({
            replies: {
              friendly: "Thank you for your review. We appreciate your feedback.",
              witty: "Thanks for the review! Your feedback helps us improve.",
              professional: "Thank you for your valuable feedback. We will consider your comments carefully."
            },
            fallback: true,
            message: "AI response parsing failed, using fallback replies"
          });
        }
      }
    }

    return NextResponse.json({ replies: parsed });
  } catch (err: unknown) {
    console.error("[generate-reply]", err);
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
