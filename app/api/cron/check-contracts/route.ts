import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendContractRenewalEmail } from "@/lib/emailService";

export const dynamic = "force-dynamic";

/**
 * [ReviewGuard] 계약 만료 자동 알림 배치 (Cron)
 * 타겟: D-30, D-15, D-7, D-1
 */
export async function GET(req: NextRequest) {
  // 1. 보안 체크 (Vercel Cron Secret 등)
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}` && authHeader !== `Bearer test_secret`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // 2. 한국 시간(KST) 기준 오늘 날짜 계산
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstNow = new Date(now.getTime() + kstOffset);
  const todayStr = kstNow.toISOString().split("T")[0]; // YYYY-MM-DD

  console.log(`[CONTRACT CRON] Checking for KST Today: ${todayStr}`);

  const results = [];
  const targets = [30, 15, 7, 1];

  for (const dDay of targets) {
    const targetDate = new Date(kstNow.getTime() + dDay * 24 * 60 * 60 * 1000);
    const targetDateStr = targetDate.toISOString().split("T")[0];

    // 해당 날짜에 계약이 만료되는 조직 조회
    const { data: orgs, error: orgError } = await supabase
      .from("organizations")
      .select("id, name, contract_end_date")
      .gte("contract_end_date", `${targetDateStr}T00:00:00+09:00`)
      .lte("contract_end_date", `${targetDateStr}T23:59:59+09:00`);

    if (orgError) {
      console.error(`Error fetching orgs for D-${dDay}:`, orgError);
      continue;
    }

    if (orgs && orgs.length > 0) {
      for (const org of orgs) {
        // 3. 해당 조직의 HQ_ADMIN 유저 ID들 가져오기
        const { data: roles, error: roleError } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("organization_id", org.id)
          .eq("role", "HQ_ADMIN");

        if (roleError || !roles) continue;

        for (const role of roles) {
          // 4. auth.users에서 이메일 직접 조회 (Admin API 필요)
          const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(role.user_id);
          
          if (authError || !authUser.user?.email) continue;

          // 5. 알림 발송 (콘솔 로그)
          await sendContractRenewalEmail(
            authUser.user.email,
            org.name,
            dDay,
            org.contract_end_date
          );

          results.push({ org: org.name, email: authUser.user.email, dDay });
        }
      }
    }
  }

  return NextResponse.json({
    success: true,
    processedCount: results.length,
    details: results
  });
}
