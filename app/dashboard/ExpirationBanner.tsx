"use client";

import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { getTrialStatus } from "@/lib/trialUtils";
import { useStore } from "@/lib/store/useStore";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";

export default function ExpirationBanner() {
  const { currentStoreId } = useStore();
  const [bannerInfo, setBannerInfo] = useState<{ message: string; show: boolean } | null>(null);

  // 🚀 결제 직후 배너 삭제 로직 추가
  const [isJustPaid, setIsJustPaid] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment_success") === "true") {
      setIsJustPaid(true);
    }
  }, []);

  useEffect(() => {
    // 결제 성공 시 API 호출할 필요 없이 즉시 배너 숨김
    if (isJustPaid) return;

    const fetchStatus = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const isHq = window.location.pathname.startsWith('/hq');

        // 1. 타임머신 테스트를 위한 매장별 trial_start_date (오버라이드용) - 본사(HQ)에서는 무시
        let timeMachineExpired = false;
        if (!isHq && currentStoreId) {
          const { data: storeData } = await supabase
            .from("stores")
            .select("trial_start_date")
            .eq("id", currentStoreId)
            .single();
            
          if (storeData?.trial_start_date) {
            const trialStart = new Date(storeData.trial_start_date);
            const trialEnd = new Date(trialStart);
            trialEnd.setDate(trialEnd.getDate() + 14); // 14일 만료일
            
            if (trialEnd < new Date()) {
              timeMachineExpired = true;
            }
          }
        }

        // 2. 기본 구독 정보 가져오기
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("subscription_ends_at")
          .eq("user_id", user.id)
          .single();

        let dbExpired = false;
        if (roleData?.subscription_ends_at) {
          const now = new Date();
          const expiry = new Date(roleData.subscription_ends_at);
          if (expiry < now) dbExpired = true;
        }

        // 🚀 OR 조건: 타임머신에서 강제로 만료시켰거나 OR 실제 DB 구독이 만료되었을 때
        if (timeMachineExpired || dbExpired) {
          setBannerInfo({
            message: "이용 기간이 만료되었습니다. 서비스 이용을 위해 결제가 필요합니다.",
            show: true
          });
        } else {
          setBannerInfo({ message: "", show: false });
        }
      } catch (err) {
        console.error("Failed to check expiry status", err);
      }
    };

    fetchStatus();
  }, [currentStoreId, isJustPaid]);

  // 🚀 방금 결제했으면 배너 절대 안 보여줌
  if (isJustPaid || !bannerInfo?.show) return null;

  return (
    <div className="sticky top-0 z-[100] bg-rose-600 px-6 py-2.5 text-white shadow-2xl shadow-rose-900/20 ring-1 ring-white/10">
      <div className="mx-auto max-w-7xl flex items-center justify-center gap-3">
        <AlertCircle size={16} className="animate-pulse shrink-0" />
        <span className="text-xs font-black tracking-tight sm:text-sm">
          {bannerInfo.message}
        </span>
        <Link
          href="/pricing"
          className="ml-4 flex-shrink-0 rounded-lg bg-white px-3 py-1 text-[10px] font-black text-rose-600 hover:bg-rose-50 transition active:scale-95 shadow-sm"
        >
          결제하러 가기
        </Link>
      </div>
    </div>
  );
}