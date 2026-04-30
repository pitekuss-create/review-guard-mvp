import { NextRequest, NextResponse } from "next/server";
import * as crypto from "crypto";

interface AnalyzeRequestBody {
    region: string;
    storeName: string;
    menu: string;
}

interface KeywordWithVolume {
    keyword: string;
    monthlySearchVolume: number;
}

interface AnalyzeResponse {
    success: true;
    targetKeywords: KeywordWithVolume[];
    rationale: string;
    strategy: "openai_naver_verified" | "openai_only";
}

interface AnalyzeErrorResponse {
    success: false;
    message: string;
}

interface NaverKeywordStat {
    relKeyword: string;
    monthlyPcQcCnt: number | "<10";
    monthlyMobileQcCnt: number | "<10";
}

function buildNaverAdSignature(timestamp: number, method: string, path: string): string {
    const secretKey = process.env.NAVER_AD_CLIENT_SECRET ?? "";
    const message = `${timestamp}.${method}.${path}`;
    return crypto.createHmac("sha256", secretKey).update(message).digest("base64");
}

async function generateKeywordCandidates(region: string, storeName: string, menu: string) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY 환경변수가 설정되지 않았습니다.");

    const systemPrompt = `너는 강남, 홍대 등 A급 상권에서 수많은 매장을 매출 1위로 만든 실전 외식업 상권 분석 및 SEO 컨설턴트다.
사용자가 입력한 '상권/지역명', '경쟁사 매장명', '핵심 판매 메뉴'를 기반으로 네이버에서 실제로 검색량이 폭발할 타겟 키워드 후보 20개를 생성하고, 극도로 전문적인 분석 리포트를 작성해라.

[키워드 생성 핵심 전략 - 실제 검색량 극대화]
1. 단순 조합을 넘어 '확장'해라: 사용자가 '수제버거'를 입력해도 '햄버거', '점심', '데이트', '핫플' 등 실제 소비자가 네이버에서 검색할 법한 유의어 및 방문 목적을 결합해라. (예: 안국역수제버거, 안국역점심, 안국역데이트, 안국역햄버거)
2. 억지 조합 금지: '\${region}\${menu}추천' 같이 검색량이 아예 없는 인위적인 롱테일 조합이나, 해당 상권과 안 맞을 수 있는 '야식' 같은 억지 키워드는 철저히 배제해라.
3. 메인 키워드 필수 포함: "\${region}맛집", "\${region}가볼만한곳", "\${region}핫플" 같은 초대형 검색량 키워드를 반드시 2~3개 이상 전진 배치해라.
4. 절대 "지역명", "매장명", "메뉴명"이라는 단어 자체를 키워드에 출력하지 마라.
5. "가성비", "존맛" 같은 주관적 형용사는 절대 포함하지 마라.

[분석 근거(rationale) 작성 절대 원칙 - ★가장 중요★]
"젊은 층에게 인기가 많습니다", "수요가 높습니다" 같은 대학생 리포트 수준의 뻔하고 유치한 문장은 절대 금지한다.
반드시 실전 외식업 컨설턴트의 차갑고 날카로운 톤앤매너를 유지하며, 아래 제시된 [외식업 전문 용어] 중 최소 3개 이상을 문맥에 자연스럽게 섞어서 작성해라.
* 외식업 전문 용어: TPO(시간/장소/상황), 객단가, 미끼 상품(Hooking), 트래픽 선점, 체류시간, 전환율(CVR), 고객 여정(Customer Journey)

마크다운 줄바꿈(\\n)을 활용하여 아래 포맷으로 작성해라.

[상권 타겟팅 전략]
(해당 지역의 TPO와 유동인구 특성을 분석하고, 타겟 키워드가 매장 유입 및 트래픽 선점에 어떻게 작용하는지 냉정하게 분석)

[메뉴 경쟁력 분석]
(입력된 메뉴가 검색 방문자의 후킹 포인트나 객단가 상승, 매출 전환율(CVR)에 어떻게 기여하는지 실전 관점에서 분석)

[응답 형식] 순수 JSON만 반환:
{
  "candidates": ["안국역맛집", "안국역점심", "안국역가볼만한곳", "안국역수제버거", "안국햄버거", "...", "키워드20"],
  "rationale": "[상권 타겟팅 전략]\\n...내용...\\n\\n[메뉴 경쟁력 분석]\\n...내용..."
}`;

    const userMessage = `상권/지역명: ${region}\n경쟁사 매장명: ${storeName}\n핵심 판매 메뉴: ${menu}\n\n위 정보 기반으로 네이버 검색 키워드 후보 20개와 전문적인 분석 리포트를 생성해 줘.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            max_tokens: 1200,
            temperature: 0.3,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userMessage },
            ],
        }),
    });

    if (!response.ok) throw new Error(`OpenAI API 오류 (${response.status})`);

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content?.trim() ?? "";

    // JSON 파싱 복구
    const firstBrace = raw.indexOf('{');
    const lastBrace = raw.lastIndexOf('}');
    const cleanedJson = (firstBrace >= 0 && lastBrace > firstBrace) ? raw.slice(firstBrace, lastBrace + 1) : raw.trim();

    let parsed: { candidates?: string[]; rationale?: string };
    try {
        parsed = JSON.parse(cleanedJson);
    } catch {
        return { candidates: [`${region.split(',')[0].trim()}${menu.split(',')[0].trim()}`, storeName.replace(/\s/g, '')], rationale: "[상권 타겟팅 전략]\n기본 분석입니다.\n\n[메뉴 경쟁력 분석]\n기본 분석입니다." };
    }

    const candidates = Array.isArray(parsed.candidates)
        ? parsed.candidates.filter(k => typeof k === "string").map(k => k.trim().replace(/\s/g, '')).slice(0, 20)
        : [];

    return { candidates, rationale: parsed.rationale ?? "" };
}

async function fetchNaverSearchVolumes(keywords: string[]): Promise<Map<string, number>> {
    const clientId = process.env.NAVER_AD_CLIENT_ID ?? "";
    const accessLicense = process.env.NAVER_AD_ACCESS_LICENSE ?? "";
    const baseUrl = process.env.NAVER_AD_BASE_URL ?? "https://api.naver.com";

    if (!clientId || !accessLicense) {
        return new Map(); // 환경변수 없으면 조용히 빈 맵 반환 (에러 안냄)
    }

    const path = "/keywordstool";
    const timestamp = Date.now();
    const signature = buildNaverAdSignature(timestamp, "GET", path);
    const volumeMap = new Map<string, number>();

    const chunks = Array.from({ length: Math.ceil(keywords.length / 5) }, (_, i) => keywords.slice(i * 5, i * 5 + 5));

    for (const chunk of chunks) {
        const params = new URLSearchParams({ hintKeywords: chunk.join(","), showDetail: "1" });
        try {
            const res = await fetch(`${baseUrl}${path}?${params.toString()}`, {
                method: "GET",
                headers: {
                    "X-Timestamp": String(timestamp),
                    "X-API-KEY": clientId,
                    "X-Customer": clientId,
                    "X-Signature": signature,
                    "Access-License": accessLicense,
                    "Content-Type": "application/json; charset=UTF-8",
                },
            });

            if (!res.ok) continue;

            const payload = await res.json() as { keywordList?: NaverKeywordStat[] };
            (payload.keywordList ?? []).forEach((item) => {
                const pc = typeof item.monthlyPcQcCnt === "number" ? item.monthlyPcQcCnt : 5;
                const mobile = typeof item.monthlyMobileQcCnt === "number" ? item.monthlyMobileQcCnt : 5;
                const key = item.relKeyword.trim();
                volumeMap.set(key, Math.max(volumeMap.get(key) ?? 0, pc + mobile));
            });
        } catch { continue; }
    }
    return volumeMap;
}

function filterTopKeywords(candidates: string[], volumeMap: Map<string, number>, topN = 7): KeywordWithVolume[] {
    if (volumeMap.size === 0) {
        return candidates.slice(0, topN).map(keyword => ({ keyword, monthlySearchVolume: 0 }));
    }

    const scored: KeywordWithVolume[] = candidates.map(keyword => {
        const volume = volumeMap.get(keyword) ?? volumeMap.get(keyword.replace(/\s+/g, "")) ?? 0;
        return { keyword, monthlySearchVolume: volume };
    });

    const sorted = scored.sort((a, b) => b.monthlySearchVolume - a.monthlySearchVolume);
    const withVolume = sorted.filter((k) => k.monthlySearchVolume > 0);
    const withoutVolume = sorted.filter((k) => k.monthlySearchVolume === 0);

    const merged = [...withVolume, ...withoutVolume].slice(0, topN);
    return merged.length >= 5 ? merged : [...merged, ...withoutVolume].slice(0, Math.max(5, merged.length));
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as AnalyzeRequestBody;
        const region = body.region?.trim() ?? "";
        const storeName = body.storeName?.trim() ?? "";
        const menu = body.menu?.trim() ?? "";

        if (!region || !storeName || !menu) {
            return NextResponse.json<AnalyzeErrorResponse>({ success: false, message: "상권/지역명, 매장명, 메뉴를 모두 입력해 주세요." }, { status: 400 });
        }

        const { candidates, rationale } = await generateKeywordCandidates(region, storeName, menu);

        if (candidates.length === 0) {
            return NextResponse.json<AnalyzeErrorResponse>({ success: false, message: "키워드를 생성하지 못했습니다." }, { status: 422 });
        }

        const volumeMap = await fetchNaverSearchVolumes(candidates);
        const topKeywords = filterTopKeywords(candidates, volumeMap, 7);
        const strategy = volumeMap.size > 0 ? "openai_naver_verified" : "openai_only";

        return NextResponse.json<AnalyzeResponse>({
            success: true,
            targetKeywords: topKeywords,
            rationale: strategy === "openai_only" ? `${rationale}\n\n※ 네이버 광고 API 키가 아직 없어 임의의 키워드를 반환했습니다.` : rationale,
            strategy,
        });

    } catch (err: unknown) {
        console.error(err);
        return NextResponse.json<AnalyzeErrorResponse>({ success: false, message: "오류가 발생했습니다." }, { status: 500 });
    }
}