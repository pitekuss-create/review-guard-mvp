-- ==========================================
-- 본사(HQ) 소속 매장들의 구독을 일괄 연장하는 RPC 함수
-- 자바스크립트의 Date 연산 대신 PostgreSQL의 타임스탬프 문법 활용
-- ==========================================

CREATE OR REPLACE FUNCTION public.admin_extend_org_subscriptions(
  p_org_id UUID, 
  p_ext_months INT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 선택된 본사에 속한 모든 가맹점의 요금제를 PRO로, 만료일을 현재 시간 + 전달받은 개월 수로 업데이트
  UPDATE public.stores
  SET 
    subscription_tier = 'PRO',
    -- NOW() + INTERVAL 'N months' 문법을 동적으로 적용
    subscription_expires_at = NOW() + (p_ext_months || ' months')::INTERVAL
  WHERE organization_id = p_org_id;
END;
$$;
