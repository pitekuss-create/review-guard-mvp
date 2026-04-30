import { NextRequest, NextResponse } from "next/server";
import { verifyBusinessNumber, verifyOperatingLicense } from "@/lib/verificationService";
import { createClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { businessNumber, operatingLicenseNumber } = await req.json();

    if (businessNumber) {
      const result = await verifyBusinessNumber(businessNumber);
      if (!result.isValid) {
        return NextResponse.json({ error: result.message }, { status: 400 });
      }
    }

    if (operatingLicenseNumber) {
      const result = await verifyOperatingLicense(operatingLicenseNumber);
      if (!result.isValid) {
        return NextResponse.json({ error: result.message }, { status: 400 });
      }
    }

    return NextResponse.json({ success: true, message: "검증 완료" });

  } catch (err: any) {
    console.error("[Verify API Error]:", err);
    return NextResponse.json({ 
      error: "내부 서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
      details: err.message 
    }, { status: 500 });
  }
}
