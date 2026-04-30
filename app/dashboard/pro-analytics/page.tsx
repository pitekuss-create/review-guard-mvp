import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import ProAnalyticsViewWrapper from "./ProAnalyticsViewWrapper";
import StoreSwitcher from "../StoreSwitcher";
import LogoutButton from "../LogoutButton";
import AccountSettings from "../AccountSettings";
import Footer from "@/app/components/Footer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "성장 데이터 분석 (PRO) — ReviewGuard",
  description: "경쟁사를 앞지르는 프리미엄 분석 지표를 확인하세요.",
};

export default async function ProAnalyticsPage(props: {
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

  // 결제 직후 진입 시 '원본 DB(Admin)'에서 최신 권한 강제 조회
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
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle<{ role: string }>();
    freshRole = roleData?.role ?? "STORE_OWNER";
  }

  // ── 매장 조회 ──
  const { data: storeData } = await supabase
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

  return (
    <div className="min-h-dvh bg-[#0f1117] text-zinc-100 flex flex-col">
      <header className="border-b border-white/5 bg-[#0f1117]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <a href="/dashboard" className="flex items-center gap-3 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-fuchsia-500 to-indigo-600 text-sm font-bold shadow-lg shadow-fuchsia-500/20 group-hover:scale-105 transition-transform">
                PRO
              </div>
              <span className="text-lg font-bold tracking-tight hidden sm:block text-zinc-200 group-hover:text-white transition-colors">
                성장 데이터 분석
              </span>
            </a>
            <StoreSwitcher />
            <a href="/pricing" className="hidden lg:flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-zinc-400 hover:bg-white/5 hover:text-white transition">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              요금제
            </a>
          </div>
          <div className="flex items-center gap-3">
            <a href="/dashboard" className="hidden md:flex items-center gap-2 mr-4 text-sm font-semibold text-zinc-400 hover:text-white transition-colors">
              ← 대시보드로 돌아가기
            </a>
            <AccountSettings email={user.email} />
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="flex-1">
        <ProAnalyticsViewWrapper initialStoreId={initialStoreId} initialRole={freshRole} isFromHqSelection={!!requestedStoreId} />
      </div>

      <Footer />
    </div>
  );
}
