"use server";

import { createClient as createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const VALID_PLANS = ["FREE", "BASIC", "PRO", "ENTERPRISE"] as const;
type ValidPlan = (typeof VALID_PLANS)[number];

export interface UpgradeResult {
  success: boolean;
  role?: string;
  error?: string;
}

export async function upgradeUserRole(plan: string): Promise<UpgradeResult> {
  const targetRole = plan.toUpperCase() as ValidPlan;
  if (!VALID_PLANS.includes(targetRole)) {
    return { success: false, error: `유효하지 않은 플랜: ${plan}` };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    return { success: false, error: "서버 설정 오류입니다." };
  }

  // 1. 유저 정보 확인 (여기까지는 기존과 동일)
  const supabase = await createServerClient();
  const { data: { user }, error: sessionError } = await supabase.auth.getUser();

  if (sessionError || !user) {
    return { success: false, error: "로그인 세션이 만료되었습니다." };
  }

  // 2. 만료일 계산
  const endsAt = new Date();
  if (targetRole === "FREE") {
    endsAt.setDate(endsAt.getDate() + 14);
  } else {
    endsAt.setDate(endsAt.getDate() + 30);
  }

  // 3. ★ 수파베이스 라이브러리 버리고 Raw Fetch 사용 (오염 원천 차단)
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/user_roles?on_conflict=user_id`, {
      method: 'POST',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`, // 오염된 유저 JWT 대신 완벽한 마스터키 강제 주입
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        user_id: user.id,
        role: targetRole,
        subscription_ends_at: endsAt.toISOString(),

      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[upgradeUserRole] Fetch 실패:", errorText);
      return { success: false, error: `권한 업데이트 실패 (Fetch): ${response.statusText}` };
    }

  } catch (err) {
    console.error("[upgradeUserRole] Fetch 에러:", err);
    return { success: false, error: "서버 통신 중 오류가 발생했습니다." };
  }

  // 4. 라우터 캐시 파괴
  revalidatePath("/dashboard", "layout");
  revalidatePath("/hq/dashboard", "layout");

  return { success: true, role: targetRole };
}