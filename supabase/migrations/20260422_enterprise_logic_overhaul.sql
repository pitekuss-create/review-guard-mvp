-- ==========================================
-- 1. HQ 초대 시스템 고도화 (1회용 동적 토큰)
-- ==========================================
CREATE TABLE IF NOT EXISTS hq_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hq_org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'USED')) DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_hq_invites_token ON hq_invites(token);

-- ==========================================
-- 2. 하이브리드 과금 로직을 위한 컬럼 추가
-- ==========================================
ALTER TABLE stores ADD COLUMN IF NOT EXISTS is_hq_sponsored BOOLEAN DEFAULT FALSE;

-- ==========================================
-- 3. 월간 성과 리포트 스냅샷 테이블
-- ==========================================
CREATE TABLE IF NOT EXISTS monthly_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  report_month DATE NOT NULL, -- 매월 1일로 저장 (예: 2024-04-01)
  stats JSONB NOT NULL,       -- 평균 별점, 리뷰수, 위기여부 등 스냅샷
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, report_month)
);

-- RLS 활성화
ALTER TABLE hq_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_reports ENABLE ROW LEVEL SECURITY;

-- hq_invites 정책
-- HQ_ADMIN 또는 SUPER_ADMIN만 초대 가능/조회 가능
CREATE POLICY "HQ admins can manage invites" ON hq_invites
FOR ALL USING (
  get_my_role() = 'SUPER_ADMIN'::user_role_type OR 
  hq_org_id = get_my_organization_id()
);

-- monthly_reports 정책
-- 해당 매장 소유주 또는 소속 본사 관리자만 조회 가능
CREATE POLICY "Access monthly_reports based on store ownership or organization" ON monthly_reports
FOR SELECT USING (
  get_my_role() = 'SUPER_ADMIN'::user_role_type OR
  EXISTS (
    SELECT 1 FROM stores 
    WHERE stores.id = monthly_reports.store_id 
    AND (
      stores.owner_id = auth.uid() OR 
      (stores.organization_id IS NOT NULL AND stores.organization_id = get_my_organization_id())
    )
  )
);
