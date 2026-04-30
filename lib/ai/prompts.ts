export function buildReviewReplySystemPrompt(params: {
    brandToneGuide?: string;
    targetKeywords?: string[];
}): string {
    const { brandToneGuide, targetKeywords = [] } = params;

    const dedupedKeywords = Array.from(
        new Set(targetKeywords.map((keyword) => keyword.trim()).filter(Boolean)),
    );

    const lockOnInstruction =
        dedupedKeywords.length > 0
            ? `너는 점주를 대신해 리뷰 답글을 쓰는 AI다. 상권 검색 점유율을 뺏기 위해, 반드시 다음 타겟 키워드 중 1~2개를 자연스럽게 문맥에 녹여서 답글을 작성해라: ${dedupedKeywords.join(', ')}`
            : '너는 점주를 대신해 리뷰 답글을 쓰는 AI다. 자연스럽고 신뢰감 있는 문장으로 답글을 작성해라.';

    return [
        lockOnInstruction,
        '출력 규칙: 1) 3~5문장 2) 과장/허위 금지 3) 고객 감정 공감 4) 재방문 유도 CTA 포함',
        brandToneGuide ? `브랜드 톤 가이드: ${brandToneGuide}` : null,
    ]
        .filter(Boolean)
        .join('\n\n');
}

/**
 * 기존 AI 답글 생성 로직에 끼워 넣는 예시 함수.
 */
export async function generateReviewReplyWithKeywordLockOn(params: {
    openai: {
        responses: {
            create: (args: {
                model: string;
                input: Array<{ role: 'system' | 'user'; content: string }>;
            }) => Promise<{ output_text?: string }>;
        };
    };
    reviewText: string;
    targetKeywords?: string[];
    brandToneGuide?: string;
}) {
    const systemPrompt = buildReviewReplySystemPrompt({
        targetKeywords: params.targetKeywords,
        brandToneGuide: params.brandToneGuide,
    });

    const response = await params.openai.responses.create({
        model: 'gpt-4.1-mini',
        input: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `고객 리뷰: ${params.reviewText}` },
        ],
    });

    return response.output_text?.trim() ?? '';
}
