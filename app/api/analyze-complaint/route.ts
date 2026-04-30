import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { storeId, text } = await req.json();

    if (!storeId || !text) {
      return NextResponse.json({ error: "storeId and text are required" }, { status: 400 });
    }

    const prompt = `You are an expert customer feedback analyzer for a restaurant.
Analyze the following customer complaint.
Extract the core complaint keywords (maximum 3 words).
Also determine the sentiment intensity score from 1 to 10, where 1 is mildly annoyed and 10 is extremely angry/frustrated.

Respond ONLY with a JSON object in the following format, with no extra text or markdown formatting:
{
  "extracted_keywords": ["keyword1", "keyword2"],
  "sentiment_score": 8
}

Complaint: "${text}"`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const resultText = response.choices[0].message.content;
    if (!resultText) throw new Error("No response from OpenAI");

    const parsed = JSON.parse(resultText);

    // Insert to DB using Admin Client to bypass RLS for anonymous customers
    const adminClient = createAdminClient();
    
    const { error: insertError } = await adminClient
      .from("complaint_analysis")
      .insert({
        store_id: storeId,
        original_text: text,
        extracted_keywords: parsed.extracted_keywords,
        sentiment_score: parsed.sentiment_score
      });

    if (insertError) {
      console.error("Failed to insert complaint:", insertError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: parsed });

  } catch (error) {
    console.error("analyze-complaint API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
