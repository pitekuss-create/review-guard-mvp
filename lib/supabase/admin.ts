import { createClient } from "@supabase/supabase-js";

/**
 * [ReviewGuard] Server-side Admin Client
 * CRON 작업 등 RLS를 우회하여 auth 스케마나 전체 데이터를 조회해야 할 때 사용합니다.
 * 절대 클라이언트 사이드로 유출되어서는 안 됩니다.
 */
export const createAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    console.error("🔥 [CRITICAL] NEXT_PUBLIC_SUPABASE_URL 환경변수가 누락되었습니다!");
    throw new Error("NEXT_PUBLIC_SUPABASE_URL 환경변수가 설정되지 않았습니다.");
  }
  if (!supabaseServiceKey) {
    console.error("🔥 [CRITICAL] SUPABASE_SERVICE_ROLE_KEY is undefined or missing in environment variables!");
    throw new Error("SUPABASE_SERVICE_ROLE_KEY 환경변수가 설정되지 않았습니다.");
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};
