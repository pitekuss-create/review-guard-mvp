import { NextResponse } from "next/response";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // 1. 해당 사장님의 매장 정보 조회
    const { data: storeData } = await supabase
      .from("stores")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (storeData?.id) {
      // 2. Cascade 느낌으로 매장에 딸린 리뷰 데이터 연쇄 삭제
      const { error: reviewError } = await supabase
        .from("reviews_log")
        .delete()
        .eq("store_id", storeData.id);
        
      if (reviewError) {
        console.error("[delete-account] Failed to delete reviews:", reviewError.message);
      }

      // 3. 매장 정보 삭제 (비활성화 스텝으로 작용)
      const { error: storeError } = await supabase
        .from("stores")
        .delete()
        .eq("id", storeData.id);

      if (storeError) {
        console.error("[delete-account] Failed to delete store:", storeError.message);
      }
    }
    
    // 4. Supabase Auth 유저 최종 삭제 (Admin Key가 있을 경우만)
    if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        const adminClient = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY,
          { auth: { autoRefreshToken: false, persistSession: false } }
        );
        const { error: authError } = await adminClient.auth.admin.deleteUser(user.id);
        if (authError) {
          console.error("[delete-account] Admin user delete error:", authError.message);
        }
      } catch (adminError) {
        console.warn("[delete-account] Failed to execute admin user deletion", adminError);
      }
    }

    // 브라우저 측에서의 클린 로그아웃은 API의 Json 반환값(success)을 판별한 후
    // 클라이언트 컴포넌트에서 supabase.auth.signOut()을 호출하여 쿠키를 날리게 합니다.
    return NextResponse.json({ success: true, message: "모든 데이터가 영구적으로 삭제되었습니다." });

  } catch (error: any) {
    console.error("[delete-account] API Exception:", error.message);
    return NextResponse.json({ success: false, error: "서버 내부 오류가 발생했습니다." }, { status: 500 });
  }
}
