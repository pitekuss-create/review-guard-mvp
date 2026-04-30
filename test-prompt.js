require("dotenv").config({ path: ".env.local" });
const OpenAI = require("openai").default;

async function test() {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
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

  const rating = 1;
  const tags = "맛없음, 불친절, 배달지연";
  const reviewText = "음식 다 식고 국물도 샜네요 최악 주문하지마세요 쓰레기입니다 진짜ㅋㅋ";

  const userPrompt = `고객 리뷰 정보:
- 별점: ${rating ?? "없음"}점
- 선택 키워드: ${tags || "없음"}
- 리뷰 본문: ${reviewText || "없음"}

위 정보를 바탕으로 3가지 톤의 사장님 답글을 JSON으로 작성해줘.`;

  try {
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
    console.log(completion.choices[0].message.content);
  } catch(e) {
    console.error(e);
  }
}

test();
