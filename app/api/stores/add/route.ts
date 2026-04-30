import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { verifyBusinessNumber, verifyOperatingLicense } from "@/lib/verificationService";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, businessNumber, placeUrl, operatingLicenseNumber, hqAccessConsent } = body;

    // 1. 필수값 검증
    if (!name || !businessNumber || !operatingLicenseNumber) {
      return NextResponse.json({ error: "매장명, 사업자번호, 영업신고번호는 필수입니다." }, { status: 400 });
    }

    // 2. [강화] 공공 데이터 기반 진위 검증 (Service 레이어 호출)
    const brnResult = await verifyBusinessNumber(businessNumber);
    if (!brnResult.isValid) {
      return NextResponse.json({ error: brnResult.message }, { status: 400 });
    }

    const olnResult = await verifyOperatingLicense(operatingLicenseNumber);
    if (!olnResult.isValid) {
      return NextResponse.json({ error: olnResult.message }, { status: 400 });
    }

    // 3. 매장 등록 (owner_id를 현재 로그인 유저로 강제 매핑)
    const { data: newStore, error: insertError } = await supabase
      .from("stores")
      .insert({
        name,
        business_number: businessNumber,
        operation_report_number: operatingLicenseNumber,
        hq_access_consent: !!hqAccessConsent,
        hq_access_consent_at: hqAccessConsent ? new Date().toISOString() : null,
        place_url: placeUrl || null,
        user_id: user.id
      })
      .select()
      .single();

    if (insertError) {
      // 23505: Unique violation (영업신고번호 중복)
      if (insertError.code === '23505') {
        return NextResponse.json({ error: "이미 등록된 영업신고번호(매장)입니다. 고객센터에 문의해주세요." }, { status: 409 });
      }
      console.error("Store Insert Error:", insertError);
      return NextResponse.json({ error: "매장 등록 중 오류가 발생했습니다." }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      store: {
        id: newStore.id,
        name: newStore.name
      } 
    });

  } catch (err) {
    console.error("Add Store API Error:", err);
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
}
