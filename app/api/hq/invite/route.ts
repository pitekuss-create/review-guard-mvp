import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

/**
 * 본사 초대 코드 생성을 위한 API (HQ_ADMIN 전용)
 * 긴 UUID 대신 짧고 입력하기 쉬운 6자리 영문+숫자 코드를 생성합니다.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. 유저 권한 및 소속 조직 조회
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role, organization_id")
    .eq("user_id", user.id)
    .single();

  if (!roleData || (roleData.role !== 'HQ_ADMIN' && roleData.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: "본사 관리자만 초대 코드를 생성할 수 있습니다." }, { status: 403 });
  }

  const orgId = roleData.organization_id;
  if (!orgId) {
    return NextResponse.json({ error: "소속된 본사(조직) 정보가 없습니다." }, { status: 400 });
  }

  // 🚀 2. 짧고 타이핑하기 쉬운 6자리 초대 코드 생성 (예: HQ-A1B2C3)
  const generateShortCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `HQ-${result}`;
  };

  const shortCode = generateShortCode();

  // 3. DB에 저장 (기존 token 컬럼을 그대로 사용)
  const { error: insertError } = await supabase
    .from("hq_invites")
    .insert({
      hq_org_id: orgId,
      token: shortCode,
      status: 'PENDING'
    });

  if (insertError) {
    console.error("HQ Invite Insert Error:", insertError);
    return NextResponse.json({ error: "초대 코드 생성 중 오류가 발생했습니다." }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    token: shortCode,
    message: "가맹점 연동용 6자리 코드가 생성되었습니다."
  });
}