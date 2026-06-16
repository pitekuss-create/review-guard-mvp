"use client";

import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { getTrialStatus } from "@/lib/trialUtils";
import { useStore } from "@/lib/store/useStore";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";

export default function ExpirationBanner() {
  const { currentStoreId, userRole } = useStore();
  const [bannerInfo, setBannerInfo] = useState<{ message: string; show: boolean; isStoreOwner?: boolean } | null>(null);

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

        let isHqSponsored = false;
        let isExpired = false;

        if (!isHq && currentStoreId) {
          const { data: storeData } = await supabase
            .from("stores")
            .select("trial_start_date, is_hq_sponsored, subscription_expires_at")
            .eq("id", currentStoreId)
            .single();
            
          isHqSponsored = storeData?.is_hq_sponsored || false;
            
          const now = new Date();
          
          if (storeData?.trial_start_date) {
            const trialEnd = new Date(storeData.trial_start_date);
            trialEnd.setDate(trialEnd.getDate() + 14);
            if (trialEnd < now) isExpired = true;
          }

          if (storeData?.subscription_expires_at) {
            const expiry = new Date(storeData.subscription_expires_at);
            isExpired = expiry < now;
          }
        }

        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .single();

        if (isExpired) {
          const currentRole = roleData?.role || userRole;
          if (currentRole === "HQ_ADMIN" || currentRole === "SUPER_ADMIN" || currentRole === "hq") {
            setBannerInfo({
              message: "가맹점 결제가 만료되었습니다.",
              show: true,
              isStoreOwner: false
            });
          } else {
            if (isHqSponsored) {
              setBannerInfo({
                message: "프랜차이즈 본사 통합 결제가 만료되어 QR 및 기능이 제한되었습니다. 본사 담당자에게 문의해 주세요.",
                show: true,
                isStoreOwner: true
              });
            } else {
              setBannerInfo({
                message: "결제가 만료되어 기능이 제한되었습니다.",
                show: true,
                isStoreOwner: false
              });
            }
          }
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
        {!bannerInfo.isStoreOwner && (
          <Link
            href="/pricing"
            className="ml-4 flex-shrink-0 rounded-lg bg-white px-3 py-1 text-[10px] font-black text-rose-600 hover:bg-rose-50 transition active:scale-95 shadow-sm"
          >
            연장 결제하기
          </Link>
        )}
      </div>
    </div>
  );
}