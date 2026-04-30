const path = require('path');
const { MeCab } = require('kuromoji-ko');

const DUMMY_REVIEWS = [
  "여기 진짜 가성비 최고 맛집입니다. 고기 질이 너무 좋고 사장님이 친절해요.",
  "웨이팅은 좀 길지만 분위기가 정말 좋아서 데이트 코스로 추천합니다.",
  "소스 맛이 독특하고 다른데서 못 먹어본 맛이에요. 삼겹살 강추!",
  "평일 저녁에도 사람이 많네요. 역시 상권 1위 매장다워요. 재방문의사 100%!",
  "가성비는 나쁘지 않은데 주차가 좀 불편해요. 그래도 고기는 정말 맛있습니다."
];

const STOPWORDS = new Set([
  '진짜', '너무', '많이', '추천', '맛집', '최고', '정말', '것', '내', '제',
  '여기', '가게', '사장', '음식', '분위기', '친절', '방문', '다음에', '다시',
  '완전', '매우', '그냥', '좀', '수', '데', '거', '나', '너', '우리', '들',
  '그래도', '역시', '정도', '무조건', '자주', '보고', '하나', '조금'
]);

const KEYWORD_FIX_MAP = {
  '성비': '가성비',
  '가성': '가성비'
};

const ALLOWED_POS = new Set(['NNG', 'NNP', 'XR']);

async function runTest() {
  console.log("--- 형태소 분석기 초기화 중... ---");
  const dictPath = path.join(__dirname, '..', 'node_modules', 'kuromoji-ko', 'dict');
  
  try {
    const mecab = await MeCab.create({ engine: 'ko', dictPath });
    console.log("--- 초기화 완료. 더미 데이터 분석 시작 ---");

    const keywordCounts = {};

    DUMMY_REVIEWS.forEach(text => {
      const tokens = mecab.parse(text);
      
      // 가성비가 포함된 경우 토큰 세부 출력 시도 (디버깅)
      if (text.includes("가성비")) {
        console.log(`\n[디버깅: "${text}"]`);
        tokens.filter(t => t.surface.includes("가") || t.surface.includes("성비")).forEach(t => {
          console.log(`Token: ${t.surface}, POS: ${JSON.stringify(t.pos)}`);
        });
      }

      tokens.forEach(token => {
        const posTag = Array.isArray(token.pos) ? token.pos[0] : token.pos;
        let keyword = token.surface;

        if (KEYWORD_FIX_MAP[keyword]) {
          keyword = KEYWORD_FIX_MAP[keyword];
        }

        if (ALLOWED_POS.has(posTag) && !STOPWORDS.has(keyword) && keyword.length >= 2) {
          keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
        }
      });
    });

    const sortedKeywords = Object.entries(keywordCounts)
      .map(([keyword, count]) => ({ keyword, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    console.log("\n[분석 결과 - 상위 10개 키워드]");
    console.table(sortedKeywords);

  } catch (err) {
    console.error("테스트 중 에러 발생:", err);
  }
}

runTest();
