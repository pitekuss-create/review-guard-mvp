-- ==========================================
-- 1. 신규 Enum 및 확장 테이블 생성
-- ==========================================

-- 사용자 권한 타입 정의 (이미 존재할 수 있으므로 체크)
DO $$ BEGIN
    CREATE TYPE user_role_type AS ENUM ('STORE_OWNER', 'HQ_ADMIN', 'SUPER_ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 고객 전환 퍼널 단계 정의
DO $$ BEGIN
    CREATE TYPE conversion_step AS ENUM ('scanned', 'keyword_selected', 'copied', 'redirected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 프랜차이즈 본사(조직) 테이블
CREATE TABLE IF NOT EXISTS organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 사용자 권한 및 조직 매핑 테이블
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  role user_role_type NOT NULL DEFAULT 'STORE_OWNER',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ==========================================
-- 2. 기존 테이블 (stores) 구조 확장 및 데이터 마이그레이션
-- ==========================================

-- 컬럼 추가
ALTER TABLE stores ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);
ALTER TABLE stores ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- [에러 해결] 기존 user_id(text/uuid) 데이터를 owner_id(uuid)로 마이그레이션
-- 명시적 형변환(::uuid)을 추가하여 text=uuid 연산 에러 방지
DO $$ BEGIN
  UPDATE stores 
  SET owner_id = user_id::uuid 
  WHERE owner_id IS NULL AND user_id IS NOT NULL;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'user_id를 uuid로 변환하는 중 오류 발생. 이미 uuid이거나 형식이 맞지 않을 수 있습니다.';
END $$;

-- ==========================================
-- 3. 데이터 자산화(Moat)를 위한 시계열 테이블 생성
-- ==========================================

-- 경쟁사 키워드 스냅샷
-- store_id 타입을 기존 stores(id)의 실제 타입과 유연하게 맞추기 위해 
-- 만약 stores(id)가 text라면 여기도 text로 가야 하나, 
-- 외래키 제약조건을 위해 stores(id)가 uuid라고 가정하고 명시적 캐스팅을 정책에서 처리.
CREATE TABLE IF NOT EXISTS competitor_snapshot (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  competitor_name TEXT NOT NULL,
  keywords JSONB NOT NULL,
  captured_at TIMESTAMPTZ DEFAULT NOW()
);

-- 고객 전환 퍼널 로그
CREATE TABLE IF NOT EXISTS conversion_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  step conversion_step NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 4. 철통 보안 RLS (Row Level Security) 정책 설정
-- ==========================================

-- RLS 활성화
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_snapshot ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversion_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews_log ENABLE ROW LEVEL SECURITY;

-- [Helper Function] 현재 유저의 ROLE을 가져오는 함수
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role_type AS $$
  SELECT role FROM user_roles WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- [Helper Function] 현재 유저의 조직 ID를 가져오는 함수
CREATE OR REPLACE FUNCTION get_my_organization_id()
RETURNS UUID AS $$
  SELECT organization_id FROM user_roles WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- ------------------------------------------
-- A. organizations 정책 (UUID 비교)
-- ------------------------------------------
DROP POLICY IF EXISTS "Super admin can do everything on organizations" ON organizations;
CREATE POLICY "Super admin can do everything on organizations"
ON organizations FOR ALL
USING (get_my_role() = 'SUPER_ADMIN'::user_role_type);

DROP POLICY IF EXISTS "HQ admin can view their own organization" ON organizations;
CREATE POLICY "HQ admin can view their own organization"
ON organizations FOR SELECT
USING (id = get_my_organization_id());

-- ------------------------------------------
-- B. user_roles 정책 (UUID 비교)
-- ------------------------------------------
DROP POLICY IF EXISTS "Super admin can do everything on user_roles" ON user_roles;
CREATE POLICY "Super admin can do everything on user_roles"
ON user_roles FOR ALL
USING (get_my_role() = 'SUPER_ADMIN'::user_role_type);

DROP POLICY IF EXISTS "Users can view their own role" ON user_roles;
CREATE POLICY "Users can view their own role"
ON user_roles FOR SELECT
USING (user_id = auth.uid());

-- ------------------------------------------
-- C. stores 정책 (UUID/TEXT 혼용 대응)
-- ------------------------------------------
DROP POLICY IF EXISTS "Super admin can do everything on stores" ON stores;
CREATE POLICY "Super admin can do everything on stores"
ON stores FOR ALL
USING (get_my_role() = 'SUPER_ADMIN'::user_role_type);

DROP POLICY IF EXISTS "HQ admin can view stores in their organization" ON stores;
CREATE POLICY "HQ admin can view stores in their organization"
ON stores FOR SELECT
USING (organization_id = get_my_organization_id());

DROP POLICY IF EXISTS "Store owners can manage their own stores" ON stores;
CREATE POLICY "Store owners can manage their own stores"
ON stores FOR ALL
USING (owner_id = auth.uid());

-- ------------------------------------------
-- D. 시계열 및 데이터 테이블 (Snapshot, Log, Keywords, Reviews)
-- ------------------------------------------

-- 1) Competitor Snapshot
DROP POLICY IF EXISTS "Access competitor_snapshot based on store ownership or organization" ON competitor_snapshot;
CREATE POLICY "Access competitor_snapshot based on store ownership or organization"
ON competitor_snapshot FOR ALL
USING (
  get_my_role() = 'SUPER_ADMIN'::user_role_type OR
  EXISTS (
    SELECT 1 FROM stores 
    WHERE stores.id = competitor_snapshot.store_id 
    AND (
      stores.owner_id = auth.uid() OR 
      (stores.organization_id IS NOT NULL AND stores.organization_id = get_my_organization_id())
    )
  )
);

-- 2) Conversion Log
DROP POLICY IF EXISTS "Access conversion_log based on store ownership or organization" ON conversion_log;
CREATE POLICY "Access conversion_log based on store ownership or organization"
ON conversion_log FOR ALL
USING (
  get_my_role() = 'SUPER_ADMIN'::user_role_type OR
  EXISTS (
    SELECT 1 FROM stores 
    WHERE stores.id = conversion_log.store_id 
    AND (
      stores.owner_id = auth.uid() OR 
      (stores.organization_id IS NOT NULL AND stores.organization_id = get_my_organization_id())
    )
  )
);

-- 3) Review Keywords (TEXT store_id 대응을 위해 명시적 형변환 추가)
DROP POLICY IF EXISTS "Access review_keywords based on store ownership or organization" ON review_keywords;
CREATE POLICY "Access review_keywords based on store ownership or organization"
ON review_keywords FOR ALL
USING (
  get_my_role() = 'SUPER_ADMIN'::user_role_type OR
  EXISTS (
    SELECT 1 FROM stores 
    WHERE stores.id::text = review_keywords.store_id::text
    AND (
      stores.owner_id = auth.uid() OR 
      (stores.organization_id IS NOT NULL AND stores.organization_id = get_my_organization_id())
    )
  )
);

-- 4) Reviews Log (TEXT store_id 대응을 위해 명시적 형변환 추가)
DROP POLICY IF EXISTS "Access reviews_log based on store ownership or organization" ON reviews_log;
CREATE POLICY "Access reviews_log based on store ownership or organization"
ON reviews_log FOR ALL
USING (
  get_my_role() = 'SUPER_ADMIN'::user_role_type OR
  EXISTS (
    SELECT 1 FROM stores 
    WHERE stores.id::text = reviews_log.store_id::text
    AND (
      stores.owner_id = auth.uid() OR 
      (stores.organization_id IS NOT NULL AND stores.organization_id = get_my_organization_id())
    )
  )
);

-- ==========================================
-- 5. SUPER_ADMIN 계정 지정
-- ==========================================
-- TODO: '대표님@이메일.com' 유저가 auth.users에 먼저 존재해야 합니다.
/*
INSERT INTO user_roles (user_id, role)
SELECT id, 'SUPER_ADMIN'::user_role_type
FROM auth.users
WHERE email = '대표님@이메일.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'SUPER_ADMIN';
*/
