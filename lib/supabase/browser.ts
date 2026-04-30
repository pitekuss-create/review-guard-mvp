import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase 환경변수가 누락되었습니다. Vercel 세팅을 확인하세요.");
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}
