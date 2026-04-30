"use client";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store/useStore";
import Link from "next/link";
import VelocityTrackerWidget from "../VelocityTrackerWidget";
import RoiBoardWidget from "../RoiBoardWidget";
import ComplaintTrendWidget from "../ComplaintTrendWidget";
import CompetitorXRay from "../CompetitorXRay";

export default function ProAnalyticsViewWrapper({
  initialStoreId,
  initialRole,
  isFromHqSelection = false
}: {
  initialStoreId: string;
  initialRole: string;
  isFromHqSelection?: boolean;
}) {
  const { currentStoreId, setCurrentStoreId, accessibleStores } = useStore();

  const [activeRole] = useState<string>(() => {
    if (typeof window === "undefined") return initialRole.toUpperCase();
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment_success") === "true" && params.get("plan")) {
      return params.get("plan")!.toUpperCase();
    }
    return initialRole.toUpperCase();
  });

  const currentStoreData = accessibleStores.find(s => s.id === currentStoreId);
  const isHqStore = !!(currentStoreData as any)?.organization_id;
  
  const isProUser = ["PRO", "ENTERPRISE", "HQ_ADMIN", "SUPER_ADMIN"].includes(activeRole) || isHqStore;
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (initialStoreId) setCurrentStoreId(initialStoreId);
    setIsInitialized(true);
  }, [initialStoreId, setCurrentStoreId]);

  if (!isInitialized) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-20 flex flex-col items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-800 border-t-white mb-4" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
          <span className="text-4xl">👑</span> 성장 데이터 분석 <span className="rounded-full bg-fuchsia-500/15 px-3 py-1 text-sm font-bold text-fuchsia-400 ring-1 ring-fuchsia-500/30">PRO</span>
        </h1>
        <p className="text-zinc-400 font-medium ml-1">상위 1% 매장들의 비밀, 압도적인 데이터로 시장을 지배하세요.</p>
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#12141c] to-[#0f1117] ring-1 ring-white/[0.06] shadow-xl p-6 mb-8">
        <div className={`transition-all duration-500 ${!isProUser ? 'filter blur-[12px] opacity-30 select-none pointer-events-none' : ''}`}>
          <div className="grid gap-6 lg:grid-cols-2 mb-6">
            <VelocityTrackerWidget />
            <RoiBoardWidget />
          </div>
          <div className="grid gap-6 grid-cols-1">
            <ComplaintTrendWidget hasData={true} />
          </div>
        </div>

        {!isProUser && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 bg-[#0f1117]/50 backdrop-blur-[2px]">
            <div className="absolute top-1/4 left-1/4 h-40 w-40 rounded-full bg-fuchsia-500/10 blur-3xl animate-pulse" />
            <div className="absolute bottom-1/3 right-1/4 h-32 w-32 rounded-full bg-indigo-500/10 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />

            <div className="mx-auto flex items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-indigo-600 shadow-2xl shadow-fuchsia-500/30 mb-6 ring-1 ring-white/20" style={{ height: "80px", width: "80px" }}>
              <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>

            <h3 className="text-3xl font-black text-white tracking-tight mb-4 text-center drop-shadow-lg">
              매출 성장의 핵심 비밀 해제
            </h3>
            <p className="text-sm font-medium text-zinc-300 mb-8 text-center max-w-lg leading-relaxed drop-shadow">
              경쟁사를 앞지르는 리뷰 획득 속도, 매출 ROI 증명, 정밀 데이터 분석까지.<br />
              오직 PRO 멤버에게만 허락된 구독자 한정 데이터 패널입니다.
            </p>

            <Link href="/pricing" className="group relative inline-flex px-8 py-4 rounded-xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white font-bold text-sm shadow-xl shadow-fuchsia-600/30 ring-1 ring-white/20 transition-all hover:from-fuchsia-500 hover:to-indigo-500 active:scale-95 hover:shadow-2xl hover:shadow-fuchsia-500/40">
              <span className="flex items-center gap-2">
                PRO 요금제로 업그레이드 하기
              </span>
            </Link>
          </div>
        )}
      </div>

      <div className="relative mb-12">
        <div className={!isProUser ? 'pointer-events-none select-none opacity-20 filter blur-[10px] transition-all duration-500' : 'transition-all duration-500'}>
          <CompetitorXRay />
        </div>

        {!isProUser && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 bg-[#0f1117]/40 rounded-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-purple-600 shadow-xl shadow-fuchsia-500/30 mb-4 ring-1 ring-white/20">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="text-xl font-black text-white tracking-tight mb-2 text-center drop-shadow-md">
              경쟁사를 알아야 내 가게가 성장한다
            </h3>
            <p className="text-xs font-medium text-zinc-300 mb-6 text-center max-w-sm leading-relaxed drop-shadow">
              상권 1위 업체의 숨겨진 핵심 타겟 키워드와 누적 리뷰 수를 실시간으로 추출하는 PRO 전용 기능입니다.
            </p>
            <Link href="/pricing" className="group relative inline-flex px-6 py-3 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white font-bold text-sm shadow-lg shadow-fuchsia-600/30 ring-1 ring-white/20 transition-all hover:from-fuchsia-500 hover:to-purple-500">
              PRO 업그레이드 하기
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
