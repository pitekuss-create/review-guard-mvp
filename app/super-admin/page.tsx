import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import AdminList from "./AdminList";
import LogoutButton from "@/app/dashboard/LogoutButton";

export const dynamic = "force-dynamic";

export default async function SuperAdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 본사(Organizations) 리스트 Fetching
  const adminClient = createAdminClient();
  const { data: organizations, error } = await adminClient
    .from("organizations")
    .select("id, name")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-[#0f1117] text-zinc-100 p-8">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8 border-b border-white/10 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-600 font-black shadow-lg shadow-rose-600/20">
              👑
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white">
                총괄 관리자 - B2B 본사 구독 관리
              </h1>
              <p className="text-sm text-zinc-400 mt-1">
                프랜차이즈 본사 단위의 가맹점 구독 일괄 연장 제어 패널
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white/5 px-4 py-2.5 rounded-xl border border-white/10 shadow-sm self-end md:self-auto">
            <div className="flex flex-col text-right">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">접속 중인 관리자</span>
              <span className="text-sm font-medium text-zinc-300">{user?.email || "이메일 없음"}</span>
            </div>
            <div className="h-6 w-[1px] bg-white/10" />
            <LogoutButton />
          </div>
        </header>

        <main>
          {error ? (
            <div className="rounded-xl bg-rose-500/10 p-6 text-rose-400 border border-rose-500/20">
              데이터를 불러오는 중 오류가 발생했습니다: {error.message}
            </div>
          ) : (
            <AdminList organizations={organizations || []} />
          )}
        </main>
      </div>
    </div>
  );
}
