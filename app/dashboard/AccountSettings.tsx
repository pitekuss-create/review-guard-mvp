"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { useStore } from "@/lib/store/useStore";

// 🚀 핵심: 전역 상태 불러오기
interface AccountSettingsProps {
  email: string | undefined;
}

export default function AccountSettings({ email }: AccountSettingsProps) {
  const router = useRouter();
  const pathname = usePathname();

  // 🚀 유저 권한 및 현재 매장 정보 가져오기
  const { userRole, currentStoreId, accessibleStores } = useStore();
  const activeRole = (userRole || "FREE").toUpperCase();

  // 🚀 프랜차이즈 소속 매장인지 확인하는 로직 추가!
  const currentStoreData = accessibleStores?.find(s => s.id === currentStoreId);
  // 타입 에러 우회를 위해 as any 사용 (빨간줄 해결)
  const isHqStore = !!(currentStoreData as any)?.organization_id;

  const isHqAdmin = activeRole === "HQ_ADMIN" || activeRole === "SUPER_ADMIN";
  // startswith 오타 대문자 W로 수정 완료
  const isHq = pathname?.startsWith('/hq') || false;

  // [DO NOT REMOVE] HQ 강제 렌더링 오버라이드 (삭제 금지)
  const displayRoleName =
    isHq ? "Enterprise (본사 전용 플랜)" :
      isHqAdmin ? "Enterprise (본사 전용 플랜)" :
        isHqStore ? "💎 PRO (프랜차이즈 혜택)" :
          activeRole === "ENTERPRISE" ? "엔터프라이즈 플랜" :
            activeRole === "PRO" ? "PRO 플랜" :
              activeRole === "BASIC" ? "베이직 플랜" :
                "무료 체험 플랜 (FREE)";
  // [DO NOT REMOVE] HQ 강제 렌더링 오버라이드 (삭제 금지)

  // 프랜차이즈 혜택이거나 유료 결제자면 보라색 프리미엄 뱃지 적용
  const isPremiumBadge = isHqStore || activeRole !== "FREE";

  const [isOpen, setIsOpen] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  
  // 🚀 실제 DB의 구독 만료일 가져오기
  const [subscriptionEndsAt, setSubscriptionEndsAt] = useState<string | null>(null);
  const [timeMachineDate, setTimeMachineDate] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubscriptionData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // 1. 기본 구독 정보 가져오기
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("subscription_ends_at")
          .eq("user_id", user.id)
          .single();
          
        if (roleData?.subscription_ends_at) {
          setSubscriptionEndsAt(roleData.subscription_ends_at);
        }

        // 2. 타임머신 테스트를 위한 매장별 trial_start_date 가져오기
        if (currentStoreId) {
          const { data: storeData } = await supabase
            .from("stores")
            .select("trial_start_date")
            .eq("id", currentStoreId)
            .single();
          
          if (storeData?.trial_start_date) {
            const trialStart = new Date(storeData.trial_start_date);
            const trialEnd = new Date(trialStart);
            trialEnd.setDate(trialEnd.getDate() + 14); // 14일 무료체험 만료일
            setTimeMachineDate(trialEnd.toISOString());
          }
        }
      }
    };
    
    if (isOpen) {
      fetchSubscriptionData();
    }
  }, [isOpen, currentStoreId]);

  let planDateText = "로딩 중...";
  
  // 🚀 핵심: 타임머신 날짜가 존재하면 DB 값을 무시하고 우선 적용
  const displayEndsAt = timeMachineDate || subscriptionEndsAt;
  
  if (displayEndsAt) {
    const ends = new Date(displayEndsAt);
    const now = new Date();
    const diffDays = Math.ceil((ends.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    const formattedDate = `${ends.getFullYear()}. ${String(ends.getMonth() + 1).padStart(2, '0')}. ${String(ends.getDate()).padStart(2, '0')}`;
    const dDayText = diffDays > 0 ? `D-${diffDays}` : diffDays === 0 ? "D-Day" : `만료됨`;
    
    if (isHq || isHqAdmin || activeRole === "ENTERPRISE") {
      planDateText = `🔄 다음 계약 갱신일: ${formattedDate} (${dDayText})`;
    } else if (isHqStore) {
      planDateText = "🏢 본사 통합 결제 (자동 연장)";
    } else if (activeRole === "BASIC" || activeRole === "PRO") {
      planDateText = `💳 다음 결제일: ${formattedDate} (${dDayText})`;
    } else {
      planDateText = `⏳ 무료 체험 종료일: ${formattedDate} (${dDayText})`;
    }
  } else if (!isOpen) {
    planDateText = "클릭하여 정보 확인";
  } else {
    // DB에 날짜가 없을 때의 fallback
    planDateText = isHqStore ? "🏢 본사 통합 결제 (자동 연장)" : "만료일 정보 없음";
  }

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      setDeleteMode(false);
      setDeleteConfirmText("");
    }, 300);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "삭제에 동의합니다") return;
    setIsDeleting(true);
    try {
      const res = await fetch("/api/delete-account", { method: "POST" });
      const data = await res.json();

      if (data.success) {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
      } else {
        alert("계정 삭제 중 오류가 발생했습니다: " + data.error);
        setIsDeleting(false);
      }
    } catch (err) {
      alert("네트워크 통신 중 오류가 발생했습니다.");
      setIsDeleting(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-zinc-400 ring-1 ring-white/10 transition-all hover:bg-white/10 hover:text-zinc-200 active:scale-95"
        title="설정 및 내 정보"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={handleClose} />
          <div className="absolute right-0 top-full mt-2 w-[320px] z-50 overflow-hidden rounded-2xl bg-[#1a1d2d] ring-1 ring-white/10 shadow-2xl animate-[fadeSlideDown_0.2s_ease-out]">
            <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
              <h3 className="font-bold text-sm text-white">
                {deleteMode ? "계정 탈퇴" : "설정 및 내 정보"}
              </h3>
              <button onClick={handleClose} className="text-zinc-500 hover:text-white transition">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-5">
              {!deleteMode ? (
                <div className="flex flex-col h-full min-h-[200px]">
                  <div className="mb-6">
                    <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">연동된 계정</label>
                    <p className="mt-1 text-sm font-medium text-zinc-200">{email || "이메일 정보 없음"}</p>
                  </div>

                  <div className="mb-6">
                    <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">현재 플랜</label>
                    <div className="mt-2 flex flex-col items-start">
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${isPremiumBadge ? 'bg-violet-500/20 text-violet-300 ring-violet-500/30' : 'bg-zinc-800 text-zinc-300 ring-white/10'}`}>
                          {displayRoleName}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-2.5">{planDateText}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 mb-6">
                    {(isHq || isHqAdmin) ? (
                      <button onClick={() => { alert('엔터프라이즈 전용 메뉴입니다. 담당자에게 문의하세요.'); handleClose(); }} className="w-full flex items-center justify-between rounded-xl bg-white/5 px-4 py-3 text-sm font-semibold text-zinc-200 transition-colors hover:bg-white/10 active:scale-95">
                        <span>💳 엔터프라이즈 계약 관리</span>
                        <svg className="h-3 w-3 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                      </button>
                    ) : (!isHqStore && !isHqAdmin) ? (
                      <button onClick={() => { router.push('/pricing'); handleClose(); }} className="w-full flex items-center justify-between rounded-xl bg-white/5 px-4 py-3 text-sm font-semibold text-zinc-200 transition-colors hover:bg-white/10 active:scale-95">
                        <span>💳 구독 및 결제 관리</span>
                        <svg className="h-3 w-3 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                      </button>
                    ) : null}

                    <button onClick={() => { router.push((isHq || isHqAdmin) ? '/hq/faq' : '/faq'); handleClose(); }} className="w-full flex items-center justify-between rounded-xl bg-white/5 px-4 py-3 text-sm font-semibold text-zinc-200 transition-colors hover:bg-white/10 active:scale-95">
                      <span>📞 고객센터 및 FAQ</span>
                      <svg className="h-3 w-3 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                    </button>

                    {(activeRole === 'HQ_ADMIN' || activeRole === 'ENTERPRISE') && (
                      <button onClick={() => { router.push('/support'); handleClose(); }} className="w-full flex items-center justify-between rounded-xl bg-white/5 px-4 py-3 text-sm font-semibold text-zinc-200 transition-colors hover:bg-white/10 active:scale-95">
                        <span>❓ 엔터프라이즈 기술 지원</span>
                        <svg className="h-3 w-3 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                      </button>
                    )}
                  </div>

                  <div className="mt-auto flex justify-end">
                    <button onClick={() => setDeleteMode(true)} className="text-[11px] font-medium text-zinc-600 hover:text-zinc-400 underline decoration-zinc-700 underline-offset-2 transition-colors">
                      계정을 삭제하시겠습니까?
                    </button>
                  </div>
                </div>
              ) : (
                <div className="animate-[fadeSlideDown_0.2s_ease-out]">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/10 ring-1 ring-rose-500/20">
                    <svg className="h-5 w-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  </div>
                  <h4 className="mb-2 text-center text-sm font-bold text-white">정말 계정을 삭제하시겠습니까?</h4>
                  <div className="mb-4 rounded-lg bg-rose-500/5 p-3 ring-1 ring-rose-500/20">
                    <p className="text-[12px] font-medium text-rose-200 leading-relaxed text-center break-keep">
                      탈퇴 시 즉각 <strong>모든 기능 및 데이터가 소멸</strong>되며 복구 절대 불가합니다.
                    </p>
                  </div>
                  <div className="mb-5">
                    <label className="mb-2 block text-[11px] font-semibold text-zinc-400 text-center">
                      아래 문장을 그대로 입력해 주세요.<br />
                      <span className="text-white font-bold select-none mt-1 inline-block bg-white/5 px-2 py-0.5 rounded">'삭제에 동의합니다'</span>
                    </label>
                    <input type="text" className="w-full rounded-lg bg-white/5 px-3 py-2 text-center text-sm text-white placeholder-zinc-600 outline-none ring-1 ring-white/10 focus:ring-rose-500/50" placeholder="삭제에 동의합니다" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setDeleteMode(false); setDeleteConfirmText(""); }} className="flex-1 rounded-lg bg-white/5 py-2.5 text-xs font-semibold text-zinc-300 transition-colors hover:bg-white/10 active:scale-95">취소</button>
                    <button onClick={handleDeleteAccount} disabled={deleteConfirmText !== "삭제에 동의합니다" || isDeleting} className="flex-1 rounded-lg bg-rose-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-600/20 transition-all hover:bg-rose-500 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none">
                      {isDeleting ? "삭제 중..." : "최종 삭제"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}