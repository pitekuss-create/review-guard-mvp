import axios from 'axios';

const NAVER_ALLOWED_HOST_PATTERNS = [
    /(^|\.)naver\.me$/i,
    /(^|\.)map\.naver\.com$/i,
    /(^|\.)place\.naver\.com$/i,
    /(^|\.)m\.place\.naver\.com$/i,
    /(^|\.)pcmap\.place\.naver\.com$/i,
];

const PLACE_ID_PATTERNS: RegExp[] = [
    /\/place\/(\d{5,})/i,
    /[?&]placePath=%2Fplace%2F(\d{5,})/i,
    /[?&]placePath=\/place\/(\d{5,})/i,
    /[?&]id=(\d{5,})/i,
    /[?&]placeId=(\d{5,})/i,
    /[?&]businessNo=(\d{5,})/i,
    /(^|\D)(\d{5,})(\D|$)/,
];

const PLACE_ID_IN_HTML_PATTERNS: RegExp[] = [
    /"placeId"\s*:\s*"?(\d{5,})"?/i,
    /"id"\s*:\s*"?(\d{5,})"?\s*,\s*"type"\s*:\s*"PLACE"/i,
    /\/place\/(\d{5,})/i,
];

function isAllowedNaverHost(hostname: string): boolean {
    return NAVER_ALLOWED_HOST_PATTERNS.some((pattern) => pattern.test(hostname));
}

function pickPlaceId(raw: string): string | null {
    for (const pattern of PLACE_ID_PATTERNS) {
        const match = raw.match(pattern);
        if (!match) continue;

        const candidate = match[1] ?? match[2];
        if (candidate) return candidate;
    }

    return null;
}

function pickPlaceIdFromHtml(rawHtml: string): string | null {
    for (const pattern of PLACE_ID_IN_HTML_PATTERNS) {
        const match = rawHtml.match(pattern);
        if (match?.[1]) return match[1];
    }

    return null;
}

async function followRedirect(url: string): Promise<{ finalUrl: string; html?: string }> {
    const response = await axios.get<string>(url, {
        maxRedirects: 5,
        timeout: 8000,
        headers: {
            'User-Agent':
                'Mozilla/5.0 (iPhone; CPU iPhone OS 18_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Mobile/15E148 Safari/604.1',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        },
        validateStatus: (status) => status >= 200 && status < 400,
    });

    const request = response.request as { res?: { responseUrl?: string } } | undefined;
    const finalUrl = request?.res?.responseUrl ?? url;

    return {
        finalUrl,
        html: typeof response.data === 'string' ? response.data : undefined,
    };
}

/**
 * Frontend/Backend 공용: 어떤 형태의 네이버 URL이 들어와도 placeId를 최대한 추출합니다.
 */
export async function extractNaverPlaceId(rawInput: string): Promise<{ placeId: string; resolvedUrl: string }> {
    const trimmed = rawInput.trim();
    if (!trimmed) throw new Error('URL이 비어 있습니다.');

    const url = new URL(trimmed);
    if (!isAllowedNaverHost(url.hostname)) {
        throw new Error('네이버 계열 URL만 입력할 수 있습니다.');
    }

    const directPlaceId = pickPlaceId(trimmed);
    if (directPlaceId) {
        return { placeId: directPlaceId, resolvedUrl: trimmed };
    }

    const { finalUrl, html } = await followRedirect(trimmed);

    const redirectedPlaceId = pickPlaceId(finalUrl);
    if (redirectedPlaceId) {
        return { placeId: redirectedPlaceId, resolvedUrl: finalUrl };
    }

    if (html) {
        const htmlPlaceId = pickPlaceIdFromHtml(html);
        if (htmlPlaceId) {
            return { placeId: htmlPlaceId, resolvedUrl: finalUrl };
        }
    }

    throw new Error('URL에서 네이버 플레이스 ID를 추출하지 못했습니다.');
}

export function buildNaverMobilePlaceUrl(placeId: string): string {
    return `https://m.place.naver.com/place/${placeId}`;
}
