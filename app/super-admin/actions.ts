"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function extendSubscriptions(orgId: string, months: number) {
  try {
    const adminClient = createAdminClient();

    // 1. Supabase RPC 호출로 데이터베이스 단에서 NOW() + INTERVAL 처리
    const { error } = await adminClient.rpc("admin_extend_org_subscriptions", {
      p_org_id: orgId,
      p_ext_months: months,
    });

    if (error) {
      console.error("[Action Error] RPC Call Failed:", error);
      throw new Error(error.message);
    }

    // 2. 캐시 무효화 (데이터 즉시 반영)
    revalidatePath("/super-admin");

    return { success: true };
  } catch (error: any) {
    console.error("extendSubscriptions error:", error);
    return { success: false, error: error.message || "연장 처리에 실패했습니다." };
  }
}
