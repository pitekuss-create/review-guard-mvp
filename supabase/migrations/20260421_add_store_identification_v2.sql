-- stores 테이블에 사업자등록번호, 영업신고번호, 본사 데이터 접근 동의 컬럼 추가
ALTER TABLE stores ADD COLUMN IF NOT EXISTS business_registration_number TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS operating_license_number TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS hq_access_consent BOOLEAN DEFAULT FALSE;

-- 영업신고번호에 UNIQUE 제약조건 추가 (가로채기 방지)
-- 기존에 중복된 데이터가 없을 때만 성공하므로, 중복 데이터가 있다면 정리가 필요할 수 있음.
-- 여기서는 신규 추가 항목이므로 바로 UNIQUE 제약조건 생성을 시도합니다.
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uni_operating_license_number') THEN
        ALTER TABLE stores ADD CONSTRAINT uni_operating_license_number UNIQUE (operating_license_number);
    END IF;
END $$;

-- 빠른 조회를 위한 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_stores_brn ON stores(business_registration_number);
CREATE INDEX IF NOT EXISTS idx_stores_oln ON stores(operating_license_number);

-- (참고) 이전에 테스트로 만든 business_number 컬럼이 있다면 삭제하거나 무시
-- DROP COLUMN IF EXISTS business_number;
