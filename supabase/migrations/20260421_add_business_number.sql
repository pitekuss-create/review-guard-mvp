-- stores 테이블에 사업자등록번호(business_number) 컬럼 추가
ALTER TABLE stores ADD COLUMN IF NOT EXISTS business_number TEXT;

-- 빠른 조회를 위한 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_stores_business_number ON stores(business_number);

-- RLS 정책 확인 (이미 owner_id 기반으로 존재하므로 추가 필요 없음)
-- 단, 신규 생성 시 owner_id가 자동으로 auth.uid()가 되도록 하는 것은 API 단에서 처리.
