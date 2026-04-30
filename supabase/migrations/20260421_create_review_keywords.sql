-- 경쟁사 키워드 분석 결과 저장용 테이블
-- 시계열 트렌드 분석을 위해 UPSERT가 아닌 INSERT 누적 방식을 사용합니다.

CREATE TABLE IF NOT EXISTS review_keywords (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  store_id TEXT NOT NULL,       -- 관리용 매장 ID (또는 Naver Place ID)
  keyword TEXT NOT NULL,        -- 추출된 핵심 키워드
  frequency INTEGER NOT NULL,   -- 해당 분석 시점의 출현 빈도수
  created_at TIMESTAMPTZ DEFAULT NOW() -- 분석 일시
);

-- 인덱스 추가 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_review_keywords_store_id ON review_keywords(store_id);
CREATE INDEX IF NOT EXISTS idx_review_keywords_created_at ON review_keywords(created_at);
