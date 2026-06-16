import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin"; // 🚀 추가: 원본 DB 접속용
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import DashboardViewWrapper from "./DashboardViewWrapper";
import StoreSwitcher from "./StoreSwitcher";
import LogoutButton from "./LogoutButton";
import AccountSettings from "./AccountSettings";
import Footer from "@/app/components/Footer";
import PaymentSuccessToast from "./PaymentSuccessToast";
import RoiModal from "./RoiModal";
import ExpirationBanner from "./ExpirationBanner";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "사장님 통합 대시보드 — ReviewGuard",
  description: "매장 리뷰 현황을 한눈에 확인하세요.",
};

const DEMO_EMAILS = ['seoulbowl@naver.com', 'seoulbowl_store@naver.com', 'seoulbowl_solo@naver.com'];

export default async function DashboardPage(props: {
  searchParams: Promise<{ storeId?: string; payment_success?: string; plan?: string }>;
}) {
  const searchParams = await props.searchParams;
  const requestedStoreId = searchParams.storeId;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // ── HQ 권한 확인 ──
  const { data: roleCheckData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle<{ role: string }>();

  const checkRole = roleCheckData?.role ?? "";
  if (checkRole === "HQ_ADMIN" || checkRole === "hq" || checkRole === "SUPER_ADMIN") {
    if (!requestedStoreId) redirect("/hq/dashboard");
  }

  // 🚀 핵심 수술 1: 결제 직후 진입 시 '원본 DB(Admin)'에서 최신 권한 강제 조회
  const isPaymentSuccess = searchParams.payment_success === "true";
  const planFromUrl = (searchParams.plan ?? "").toUpperCase();
  let freshRole: string;

  if (isPaymentSuccess && planFromUrl) {
    const adminClient = createAdminClient();
    const { data: freshRoleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle<{ role: string }>();

    freshRole = freshRoleData?.role ?? planFromUrl;
  } else {
    // 일반 접속 시
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle<{ role: string }>();
    freshRole = roleData?.role ?? "STORE_OWNER";
  }

  // ── 매장 조회 ──
  const { data: storeData, error: storeError } = await supabase
    .from("stores")
    .select("id, name, concept, place_url")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const initialStoreId = requestedStoreId || storeData?.id || null;

  if (!initialStoreId) {
    redirect("/onboarding");
  }

  const isDemoMode = DEMO_EMAILS.includes(user.email || "");

  return (
    <div className="min-h-dvh bg-[#0f1117] text-zinc-100">
      <ExpirationBanner />
      <PaymentSuccessToast />
      <RoiModal />

      <header className="border-b border-white/5 bg-[#0f1117]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-bold shadow-lg shadow-emerald-500/20">
                RG
              </div>
              <span className="text-lg font-semibold tracking-tight hidden sm:block">
                ReviewGuard
              </span>
            </div>
            <StoreSwitcher />
            <a href={initialStoreId ? `/dashboard/pro-analytics?storeId=${initialStoreId}` : "/dashboard/pro-analytics"} className="hidden lg:flex items-center gap-2 rounded-lg bg-gradient-to-r from-fuchsia-600/10 to-indigo-600/10 px-3 py-2 text-sm font-bold text-fuchsia-400 hover:bg-white/10 hover:text-fuchsia-300 ring-1 ring-fuchsia-500/30 transition-all group shadow-sm shadow-fuchsia-500/10">
              <span className="group-hover:scale-110 transition-transform">👑</span>
              성장 데이터 분석 <span className="ml-1 text-[10px] bg-fuchsia-500/20 px-1.5 py-0.5 rounded text-fuchsia-300 border border-fuchsia-500/30">PRO</span>
            </a>
            <a href="/pricing" className="hidden lg:flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-zinc-400 hover:bg-white/5 hover:text-white transition">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              요금제
            </a>
          </div>
          <div className="flex items-center gap-3">
            <AccountSettings email={user.email} />
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* 🚀 방금 원본 DB에서 건져 올린 '진짜 권한'을 프론트엔드로 전달 */}
      <DashboardViewWrapper initialStoreId={initialStoreId} initialRole={freshRole} isFromHqSelection={!!requestedStoreId} isDemoMode={isDemoMode} />

      <Footer />
    </div>
  );
}