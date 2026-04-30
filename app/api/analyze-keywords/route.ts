import { NextResponse } from 'next/server';
import path from 'path';
import { MeCab } from 'kuromoji-ko';
import { createClient } from '@/lib/supabase/server';

// 불용어 리스트 (의미 없는 고빈도 단어들)
const STOPWORDS = new Set([
  '진짜', '너무', '많이', '추천', '맛집', '최고', '정말', '것', '내', '제',
  '여기', '가게', '사장', '음식', '분위기', '친절', '방문', '다음에', '다시',
  '완전', '매우', '그냥', '좀', '수', '데', '거', '나', '너', '우리', '들',
  '그래도', '역시', '정도', '무조건', '자주', '보고', '보고', '하나', '조금'
]);

// 인위적으로 보정할 키워드 맵 (형태소 분석기 한계 보완)
const KEYWORD_FIX_MAP: Record<string, string> = {
  '성비': '가성비', // '가성비'가 '가(JKS) + 성비(NNG)'로 쪼개지는 경우 보정
  '가성': '가성비'  // '가성(NNG) + 비' 혹은 '가성비' 오동작 대응
};

// 허용할 품사 (NNG: 일반명사, NNP: 고유명사, XR: 어근)
const ALLOWED_POS = new Set(['NNG', 'NNP', 'XR']);

export async function POST(req: Request) {
  try {
    const { storeId, texts } = await req.json();

    if (!storeId || !Array.isArray(texts)) {
      return NextResponse.json({ error: 'storeId와 texts(배열)가 필요합니다.' }, { status: 400 });
    }

    // 1. kuromoji-ko 형태소 분석기 초기화
    // Next.js 환경에서 딕셔너리 경로 설정
    const dictPath = path.join(process.cwd(), 'node_modules', 'kuromoji-ko', 'dict');
    const mecab = await MeCab.create({ engine: 'ko', dictPath });

    const keywordCounts: Record<string, number> = {};

    // 2. 각 텍스트별 형태소 분석
    for (const text of texts) {
      if (!text || typeof text !== 'string') continue;
      
      const tokens = mecab.parse(text);

      for (const token of tokens) {
        // 품사는 ['NNG'] 형태의 배열로 들어오거나 문자열일 수 있음 (napi-mecab 호환 API 기준)
        const posTag = Array.isArray(token.pos) ? token.pos[0] : token.pos;
        let keyword = token.surface;

        // 형태소 분석기 한계 보정 (예: 성비 -> 가성비)
        if (KEYWORD_FIX_MAP[keyword]) {
          keyword = KEYWORD_FIX_MAP[keyword];
        }

        // 필터링: 허용 품사 && 불용어 아님 && 2글자 이상
        if (
          ALLOWED_POS.has(posTag) && 
          !STOPWORDS.has(keyword) && 
          keyword.length >= 2
        ) {
          keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
        }
      }
    }

    // 3. 빈도수 기준 정렬 및 상위 10개 추출
    const sortedKeywords = Object.entries(keywordCounts)
      .map(([keyword, count]) => ({ keyword, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 4. 데이터베이스 저장 (Supabase)
    const supabase = await createClient();
    
    if (sortedKeywords.length > 0) {
      const dbData = sortedKeywords.map(item => ({
        store_id: storeId,
        keyword: item.keyword,
        frequency: item.count
      }));

      const { error: dbError } = await supabase
        .from('review_keywords')
        .insert(dbData);

      if (dbError) {
        console.error('DB Insert Error:', dbError);
        // DB 저장 실패해도 분석 결과는 반환 (캐싱 목적이므로)
      }
    }

    return NextResponse.json({
      success: true,
      storeId,
      keywords: sortedKeywords
    });

  } catch (error: any) {
    console.error('Keyword Analysis Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
