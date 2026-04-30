-- organizations 테이블에 계약 만료일 컬럼 추가
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS contract_end_date TIMESTAMPTZ;

-- 테스트용 데이터 업데이트 (D-30, D-15, D-7, D-1 테스트를 위해 현재 날짜 기준으로 설정)
-- 현재 날짜가 2026-04-22라고 가정하면:
-- D-30: 2026-05-22
-- D-15: 2026-05-07
-- D-7:  2026-04-29
-- D-1:  2026-04-23

-- 예시 조직들에 데이터 삽입 (테스트용)
UPDATE organizations SET contract_end_date = '2026-05-22T00:00:00+09:00' WHERE name LIKE '%본사%' LIMIT 1;
