"use client";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store/useStore";
import AnalysisReport from "./AnalysisReport";
import StoreProfileEditor from "./StoreProfileEditor";
import KeywordManager from "./KeywordManager";
import ManualReplyGenerator from "./ManualReplyGenerator";
import QRCodeWidget from "./QRCodeWidget";
import NaverConnectionWidget from "./NaverConnectionWidget";
import ReviewTable, { type ReviewRow } from "./ReviewTable";
import HQOverview from "./HQOverview";
import { ArrowLeft, Zap } from "lucide-react";
import Link from "next/link";

export default function DashboardViewWrapper({
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

  // 🚀 [수술 3]: 현재 매장이 프랜차이즈 소속(orgId 존재)인지 판별하는 무적 패스 로직 추가!
  const currentStoreData = accessibleStores.find(s => s.id === currentStoreId);
  const isHqStore = !!(currentStoreData as any)?.organization_id;// 본사 코드가 있으면 무조건 true

  // 본사 가맹점(isHqStore)이라면 돈을 안 내도 무조건 PRO 유저로 취급해버림!
  const isBasicUser = ["BASIC", "PRO", "ENTERPRISE", "HQ_ADMIN", "SUPER_ADMIN"].includes(activeRole) || isHqStore;
  const isProUser = ["PRO", "ENTERPRISE", "HQ_ADMIN", "SUPER_ADMIN"].includes(activeRole) || isHqStore;

  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const isHQRole = activeRole === 'HQ_ADMIN' || activeRole === 'SUPER_ADMIN';
  const [showHQ, setShowHQ] = useState(isHQRole && !isFromHqSelection);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // @ts-ignore
    useStore.setState({ userRole: activeRole });
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment_success") === "true") {
      window.history.replaceState(null, "", "/dashboard");
    }
  }, [activeRole]);

  useEffect(() => {
    if (initialStoreId) setCurrentStoreId(initialStoreId);
    setIsInitialized(true);
  }, [initialStoreId, setCurrentStoreId]);

  useEffect(() => {
    if (isInitialized && currentStoreId && !showHQ) {
      fetchStoreData(currentStoreId).catch(() => { });
    }
  }, [currentStoreId, showHQ, isInitialized]);

  const fetchStoreData = async (storeId: string) => {
    setIsDataLoading(true);
    try {
      const res = await fetch(`/api/reviews?storeId=${storeId}`);
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      const data = await res.json();
      if (data.reviews) setReviews(data.reviews);
    } catch (err) { } finally {
      setIsDataLoading(false);
    }
  };

  if (!isInitialized || (!showHQ && !currentStoreId)) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-20 flex flex-col items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-800 border-t-white mb-4" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      {showHQ ? (
        <HQOverview />
      ) : (
        <div className={isDataLoading ? "opacity-50 pointer-events-none transition-opacity" : "transition-opacity"}>
          {isHQRole && (
            <div className="mb-6">
              <Link href="/dashboard" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-zinc-400 hover:text-white hover:bg-white/10 transition-all group">
                <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
                본사 대시보드로 돌아가기
              </Link>
            </div>
          )}
          {(() => {
            const currentStoreData = accessibleStores.find(s => s.id === currentStoreId);
            return (
              <>
                {/* 1. 상호명 및 매장 정보 */}
                <StoreProfileEditor storeId={currentStoreId || ""} initialName={currentStoreData?.name || ""} />

                {/* 2. 베이직 리포트 & 프리미엄 상권 분석 */}
                <AnalysisReport reviews={reviews} storeId={currentStoreId || ""} />

                {/* 3. PRO 유도 배너 (이동됨) */}
                <Link href="/dashboard/pro-analytics" className="mb-6 group relative flex items-center justify-between rounded-2xl bg-gradient-to-r from-[#1a1d2b] to-[#161822] p-4 ring-1 ring-fuchsia-500/20 hover:ring-fuchsia-500/40 transition-all overflow-hidden shadow-lg">
                  <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/5 to-indigo-500/5 group-hover:from-fuchsia-500/10 group-hover:to-indigo-500/10 transition-colors" />
                  <div className="absolute -left-10 top-1/2 -translate-y-1/2 w-32 h-32 bg-fuchsia-500/20 blur-[50px] rounded-full" />
                  <div className="relative flex items-center gap-4 z-10">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-indigo-600 shadow-lg shadow-fuchsia-500/20 group-hover:scale-110 transition-transform">
                      <span className="text-xl">📈</span>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                        경쟁사보다 얼마나 빠르게 성장 중일까요? <span className="rounded-full bg-fuchsia-500/20 px-2 py-0.5 text-[10px] font-bold text-fuchsia-400 ring-1 ring-fuchsia-500/30">PRO</span>
                      </h3>
                      <p className="text-xs text-zinc-400 mt-1">상위 1% 매장의 매출 성장 비밀 지표를 확인하세요.</p>
                    </div>
                  </div>
                  <div className="relative z-10 flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2.5 text-sm font-bold text-white ring-1 ring-white/10 group-hover:bg-fuchsia-500 group-hover:ring-fuchsia-500 transition-all shadow-sm">
                    PRO 분석 보러가기 <ArrowLeft className="w-4 h-4 rotate-180" />
                  </div>
                </Link>


                {/* 4. 키워드 매니저 */}
                <KeywordManager />

                {/* 5. 네이버 연결 및 QR */}
                <NaverConnectionWidget storeId={currentStoreId || ""} initialUrl={currentStoreData?.place_url || ""} />
                <QRCodeWidget storeId={currentStoreId || ""} />
              </>
            );
          })()}

          {/* 6. 답글 생성기 & 리뷰 테이블 */}
          <ManualReplyGenerator storeId={currentStoreId || ""} />
          <ReviewTable storeId={currentStoreId || ""} reviews={reviews} onRefresh={async () => { if (currentStoreId) await fetchStoreData(currentStoreId); }} />
        </div>
      )}
    </main>
  );
}