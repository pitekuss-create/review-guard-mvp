import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. 유저 권한 조회 (장부에 없더라도 에러로 튕기지 않고 '일반 사장님'으로 취급)
  const { data: roleData, error: roleError } = await supabase
    .from("user_roles")
    .select("role, organization_id, organizations(id, name, contract_end_date)")
    .eq("user_id", user.id)
    .single();

  const role = (!roleError && roleData) ? roleData.role : 'STORE_OWNER';
  const orgId = (!roleError && roleData) ? roleData.organization_id : null;
  const organization = (!roleError && roleData) ? roleData.organizations : null;

  let storesQuery = supabase.from("stores").select("id, name, place_url, organization_id, trial_start_date, subscription_expires_at, is_hq_sponsored, subscription_tier");

  // 2. 권한별 매장 필터링 (이제 무조건 stores 테이블을 뒤집니다)
  if (role === 'SUPER_ADMIN') {
    // 모든 매장 접근 가능
  } else if (role === 'HQ_ADMIN' && orgId) {
    // 본사 소속 매장 + 본인이 직접 등록한 개인 매장
    storesQuery = storesQuery.or(`organization_id.eq.${orgId},user_id.eq.${user.id}`);
  } else {
    // 일반 개인 매장주: 본인 소유 매장만 모두 긁어옴
    storesQuery = storesQuery.eq("user_id", user.id);
  }

  const { data: stores, error: storesError } = await storesQuery;

  if (storesError) {
    return NextResponse.json({ error: storesError.message }, { status: 500 });
  }

  return NextResponse.json({
    role: role,
    organization_id: orgId,
    organization: organization,
    stores: stores || [],
    email: user.email
  });
}