-- stores 테이블에 본사 데이터 접근 동의 시각 기록 컬럼 추가
ALTER TABLE stores ADD COLUMN IF NOT EXISTS hq_access_consent_at TIMESTAMPTZ;

-- 본사 동의 여부에 따른 인덱스 (통계용)
CREATE INDEX IF NOT EXISTS idx_stores_hq_consent ON stores(hq_access_consent) WHERE hq_access_consent = TRUE;
