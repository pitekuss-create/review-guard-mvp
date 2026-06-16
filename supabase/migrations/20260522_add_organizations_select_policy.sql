-- ==========================================
-- 가맹점주(STORE_OWNER)가 자신의 매장이 소속된 본사(organizations) 정보를 조회할 수 있도록 RLS 정책 추가
-- ==========================================

DROP POLICY IF EXISTS "Store owners can view their store's organization" ON organizations;

CREATE POLICY "Store owners can view their store's organization"
ON organizations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM stores
    WHERE stores.organization_id = organizations.id
    AND stores.owner_id = auth.uid()
  )
);
