-- organizations 테이블에 초대 시스템 컬럼 추가
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS invite_code UUID UNIQUE DEFAULT gen_random_uuid();
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS invite_expiry TIMESTAMPTZ;

-- 인덱스 추가 (초대 코드로 조직 검색 시 성능 최적화)
CREATE INDEX IF NOT EXISTS idx_organizations_invite_code ON organizations(invite_code);

-- 기존 조직들에 대해 만료일 초기화 (선택 사항, 여기선 생략 또는 미래 시점으로 설정)
-- UPDATE organizations SET invite_expiry = NOW() + INTERVAL '7 days' WHERE invite_expiry IS NULL;
