import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import HQOverview from "@/app/dashboard/HQOverview";
import LogoutButton from "@/app/dashboard/LogoutButton";
import AccountSettings from "@/app/dashboard/AccountSettings";
import Footer from "@/app/components/Footer";
import ExpirationBanner from "@/app/dashboard/ExpirationBanner";
import CompetitorXRay from "@/app/dashboard/CompetitorXRay";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "본사 통합 관제 대시보드 — ReviewGuard",
  description: "프랜차이즈 전체 매장 현황을 조망합니다.",
};

export default async function HQDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 1. 권한 확인 (HQ 전용 아키텍처)
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role, organization_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const userRole = roleData?.role || 'STORE_OWNER';

  // 본사 권한이 아니면 일반 대시보드로 쫓아냄
  if (userRole !== 'hq' && userRole !== 'HQ_ADMIN' && userRole !== 'SUPER_ADMIN') {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-dvh bg-[#0f1117] text-zinc-100">
      <ExpirationBanner />
      {/* ─── 본사 전용 헤더 (요금제 링크 제외) ─── */}
      <header className="border-b border-white/5 bg-[#0f1117]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 text-sm font-bold shadow-lg shadow-violet-500/20">
              HQ
            </div>
            <span className="text-lg font-bold tracking-tight">
              ReviewGuard <span className="text-violet-400 ml-1">Enterprise</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <AccountSettings email={user.email} />
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-black text-white tracking-tight">본사 통합 요약</h2>
          <p className="text-zinc-500 mt-1">전체 가맹점의 성과와 이슈를 한눈에 모니터링합니다.</p>
        </div>

        {/* 본사 전용 통합 뷰 컴포넌트 */}
        <HQOverview />

        {/* 🚀 바로 이곳입니다! 기존 HQOverview 아래, Footer 위에 추가되었습니다. */}
        <div className="mt-12">
          <CompetitorXRay />
        </div>
      </main>

      <Footer />
    </div>
  );
}