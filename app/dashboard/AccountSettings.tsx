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

  // 🚀 로컬 폴백 상태 추가
  const [fallbackUserRole, setFallbackUserRole] = useState<string | null>(null);
  const [fallbackContractEndDate, setFallbackContractEndDate] = useState<string | null>(null);
  const [lastFetchedStoreId, setLastFetchedStoreId] = useState<string | null>(null);

  // 🚀 유저 권한 및 현재 매장 정보 가져오기
  const { userRole, currentStoreId, accessibleStores, organizationId, organization } = useStore();
  const activeRole = (userRole || fallbackUserRole || "FREE").toUpperCase();

  // 🚀 프랜차이즈 소속 매장인지 확인하는 로직 추가!
  const currentStoreData = accessibleStores?.find(s => s.id === currentStoreId);
  // 타입 에러 우회를 위해 as any 사용 (빨간줄 해결)
  const [isHqSponsoredFromDb, setIsHqSponsoredFromDb] = useState(false);
  const isHqStore = !!(currentStoreData as any)?.organization_id || isHqSponsoredFromDb;

  const isHqAdmin = activeRole === "HQ_ADMIN" || activeRole === "SUPER_ADMIN";
  // startswith 오타 대문자 W로 수정 완료
  const isHq = pathname?.startsWith('/hq') || false;

  // [DO NOT REMOVE] HQ 강제 렌더링 오버라이드 (삭제 금지)
  const storeTier = (currentStoreData as any)?.subscription_tier;

  const displayRoleName =
    isHq ? "Enterprise (본사 전용 플랜)" :
      isHqAdmin ? "Enterprise (본사 전용 플랜)" :
        isHqStore ? "💎 PRO (프랜차이즈 혜택)" :
          storeTier === "ENTERPRISE" ? "엔터프라이즈 플랜 (ENTERPRISE)" :
            storeTier === "PRO" ? "PRO 플랜 (PRO)" :
              storeTier === "BASIC" ? "베이직 플랜 (BASIC)" :
                "무료 체험 플랜 (FREE)";
  // [DO NOT REMOVE] HQ 강제 렌더링 오버라이드 (삭제 금지)

  // 프랜차이즈 혜택이거나 유료 결제자면 보라색 프리미엄 뱃지 적용
  const isPremiumBadge = isHqStore || (storeTier === "BASIC" || storeTier === "PRO" || storeTier === "ENTERPRISE");

  const [isOpen, setIsOpen] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  
  // 🚀 비밀번호 변경 관련 상태 추가
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    // 만약 이미 해당 매장의 정보를 가져왔다면 중복 호출 방지
    if (currentStoreId && currentStoreId === lastFetchedStoreId) return;

    const fetchContractFallback = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        if (currentStoreId) {
          setLastFetchedStoreId(currentStoreId);
        }

        // 1. 공통: user_roles & organizations 정보 조회 시도
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role, organizations(contract_end_date)')
          .eq('user_id', user.id)
          .single();

        if (!roleError && roleData) {
          if (roleData.role) {
            setFallbackUserRole(roleData.role);
          }
          if (roleData.organizations) {
            const orgData = roleData.organizations as any;
            if (orgData.contract_end_date) {
              setFallbackContractEndDate(orgData.contract_end_date);
              return;
            }
          }
        }

        // 2. 가맹점(Store Owner) & 본사 대납(is_hq_sponsored === true) 상태인 경우 직접 organizations 조회
        const storeOrgId = (currentStoreData as any)?.organization_id;
        const isStoreHqSponsored = !!(currentStoreData as any)?.is_hq_sponsored;

        if (isStoreHqSponsored && storeOrgId) {
          const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .select('contract_end_date')
            .eq('id', storeOrgId)
            .single();

          if (!orgError && orgData?.contract_end_date) {
            setFallbackContractEndDate(orgData.contract_end_date);
          }
        } else {
          // 본사 대납이 아니면 폴백 날짜 초기화
          setFallbackContractEndDate(null);
        }
      } catch (err) {
        console.error("Failed to fetch contract end date fallback:", err);
      }
    };

    const isStoreHqSponsored = !!(currentStoreData as any)?.is_hq_sponsored;
    const hasNoContractDate = !organization?.contract_end_date && !fallbackContractEndDate;

    if (userRole === "HQ_ADMIN" || hasNoContractDate || isStoreHqSponsored) {
      fetchContractFallback();
    }
  }, [userRole, organization?.contract_end_date, currentStoreId, currentStoreData, fallbackContractEndDate, lastFetchedStoreId]);

  const contractEndDate = fallbackContractEndDate || organization?.contract_end_date || null;

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  
  let planDateText = "로딩 중...";
  let endsAt: string | null = null;
  const isPaid = storeTier === "BASIC" || storeTier === "PRO" || storeTier === "ENTERPRISE";
  const isHqSponsored = !!(currentStoreData as any)?.is_hq_sponsored;

  if (isHq || isHqAdmin) {
    endsAt = contractEndDate;
  } else if (isHqSponsored) {
    endsAt = contractEndDate;
  } else if (isHqStore) {
    endsAt = (currentStoreData as any)?.subscription_expires_at || null;
  } else if (isPaid) {
    endsAt = (currentStoreData as any)?.subscription_expires_at;
  } else {
    const trialStart = (currentStoreData as any)?.trial_start_date;
    if (trialStart) {
      const trialEndDate = new Date(trialStart);
      trialEndDate.setDate(trialEndDate.getDate() + 14);
      endsAt = trialEndDate.toISOString();
    }
  }

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "기한 없음";
    // DB의 UTC 시간(+00:00)이 한국 시간으로 변환되면서 하루 밀리는 현상을 방지하기 위해
    // YYYY-MM-DD 형태의 날짜 부분만 잘라서 출력
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return `${match[1]}년 ${match[2]}월 ${match[3]}일`;
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "기한 없음";
    return `${d.getFullYear()}년 ${String(d.getMonth() + 1).padStart(2, '0')}월 ${String(d.getDate()).padStart(2, '0')}일`;
  };

  const parseLocalDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return new Date();
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      // 타임존 오프셋 이슈 차단을 위해 YYYY-MM-DD를 기준으로 해당 일의 23시 59분 59초로 로컬 생성
      return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 23, 59, 59);
    }
    return new Date(dateStr);
  };

  if (endsAt) {
    const ends = parseLocalDate(endsAt);
    const now = new Date();
    const diffDays = Math.ceil((ends.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const formattedDate = formatDate(endsAt);
    const dDayText = diffDays > 0 ? `D-${diffDays}` : diffDays === 0 ? "D-Day" : `만료됨`;

    if (isHq || isHqAdmin || storeTier === "ENTERPRISE") {
      planDateText = `🔄 다음 계약 갱신일: ${formattedDate} (${dDayText})`;
    } else if (isHqStore) {
      planDateText = `🏢 본사 통합 결제 (만료일: ${formattedDate})`;
    } else if (storeTier === "BASIC" || storeTier === "PRO") {
      planDateText = `💳 다음 결제일: ${formattedDate} (${dDayText})`;
    } else {
      planDateText = `⏳ 무료 체험 종료일: ${formattedDate} (${dDayText})`;
    }
  } else {
    // endsAt이 없는 경우
    if (isHq || isHqAdmin || storeTier === "ENTERPRISE") {
      planDateText = "🔄 다음 계약 갱신일: 무제한";
    } else if (isHqStore) {
      planDateText = "🏢 본사 통합 결제 (기한 없음)";
    } else if (isPaid) {
      planDateText = "💳 다음 결제일: 무제한";
    } else {
      planDateText = "⏳ 무료 체험 종료일: 기한 없음";
    }
  }

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      setDeleteMode(false);
      setDeleteConfirmText("");
      setIsPasswordOpen(false);
      setNewPassword("");
      setConfirmPassword("");
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

  const handlePasswordChange = async () => {
    if (newPassword.length < 6) {
      showToast("비밀번호는 최소 6자리 이상이어야 합니다.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("새 비밀번호와 비밀번호 확인이 일치하지 않습니다.", "error");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        showToast(error.message, "error");
      } else {
        showToast("비밀번호가 성공적으로 변경되었습니다.", "success");
        setNewPassword("");
        setConfirmPassword("");
        setIsPasswordOpen(false);
      }
    } catch (err: any) {
      showToast("비밀번호 변경 중 오류가 발생했습니다.", "error");
    } finally {
      setIsUpdatingPassword(false);
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
          <div className="absolute right-0 top-full mt-2 w-[320px] z-50 max-h-[85vh] overflow-y-auto rounded-2xl bg-[#1a1d2d] ring-1 ring-white/10 shadow-2xl animate-[fadeSlideDown_0.2s_ease-out]">
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

                    {/* 🔒 비밀번호 변경 아코디언 */}
                    <div className="border border-white/5 rounded-xl bg-white/5 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setIsPasswordOpen(!isPasswordOpen)}
                        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-zinc-200 transition-colors hover:bg-white/10 active:scale-95"
                      >
                        <span className="flex items-center gap-2">
                          <svg className="h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <span>비밀번호 변경</span>
                        </span>
                        <svg className={`h-3 w-3 text-zinc-500 transition-transform duration-200 ${isPasswordOpen ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>

                      {isPasswordOpen && (
                        <div className="px-4 pb-4 pt-2 border-t border-white/5 flex flex-col gap-3 animate-[fadeSlideDown_0.2s_ease-out]">
                          <div>
                            <label className="block text-[11px] font-semibold text-zinc-400 mb-1">새 비밀번호</label>
                            <input
                              type="password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="새 비밀번호 (6자리 이상)"
                              className="w-full rounded-lg bg-[#141622] border border-white/10 px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none transition focus:ring-2 focus:ring-teal-500/30"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-zinc-400 mb-1">새 비밀번호 확인</label>
                            <input
                              type="password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="새 비밀번호 확인"
                              className="w-full rounded-lg bg-[#141622] border border-white/10 px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none transition focus:ring-2 focus:ring-teal-500/30"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handlePasswordChange}
                            disabled={isUpdatingPassword}
                            className="w-full rounded-lg bg-teal-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-teal-600/20 transition-all hover:bg-teal-500 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {isUpdatingPassword ? "변경 중..." : "변경 완료"}
                          </button>
                        </div>
                      )}
                    </div>
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

      {/* 🚀 토스트 피드백 */}
      {toast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[1000] animate-[toastSlideUp_0.4s_ease-out]">
          <div className={`${toast.type === 'error' ? 'bg-rose-600/95 ring-rose-500/30' : 'bg-emerald-600/95 ring-emerald-500/30'} text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-2 font-bold whitespace-nowrap ring-1`}>
            <span>{toast.type === 'error' ? '❌' : '✅'}</span>
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}