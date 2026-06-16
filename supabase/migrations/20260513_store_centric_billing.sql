-- ==========================================
-- 1. stores 테이블에 요금제(subscription_tier) 컬럼 추가
-- ==========================================
ALTER TABLE stores ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'FREE';

-- ==========================================
-- 2. 기존 user_roles 데이터를 기반으로 안전한 마이그레이션 (데이터 복사)
-- ==========================================
UPDATE stores
SET subscription_tier = CASE
    WHEN user_roles.role IN ('FREE', 'BASIC', 'PRO', 'ENTERPRISE') THEN user_roles.role::TEXT
    ELSE 'FREE'
END
FROM user_roles
WHERE stores.owner_id = user_roles.user_id;
