"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // 🚀 추가: 라우터
import { getTrialStatus, shouldShowRoiModalToday, markRoiModalShown } from "@/lib/trialUtils";

export default function RoiModal() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter(); // 🚀 추가: 라우터 훅
  const [stats, setStats] = useState({
    positiveReviews: 0,
    negativeReviews: 0,
    qrScans: 0,
    daysRemaining: 14
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const supabase = (await import("@/lib/supabase/browser")).createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setIsOpen(false);
          setLoading(false);
          return;
        }

        const response = await fetch('/api/store-stats');

        if (response.status === 401) {
          setIsOpen(false);
          setLoading(false);
          return;
        }

        const data = await response.json();

        if (data.error && !data.fallback) {
          setStats({
            positiveReviews: 0,
            negativeReviews: 0,
            qrScans: 0,
            daysRemaining: 14
          });
          setLoading(false);
          return;
        }

        const trialStatus = getTrialStatus(data.trialStartDate);

        if (!shouldShowRoiModalToday(trialStatus.daysRemaining)) {
          setIsOpen(false);
          setLoading(false);
          return;
        }

        setStats({
          positiveReviews: data.positiveReviews || 0,
          negativeReviews: data.negativeReviews || 0,
          qrScans: data.qrScans || 0,
          daysRemaining: trialStatus.daysRemaining
        });

        setIsOpen(true);
      } catch (error) {
        setStats({
          positiveReviews: 0,
          negativeReviews: 0,
          qrScans: 0,
          daysRemaining: 14
        });
        setIsOpen(false);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handlePayClick = () => {
    setIsOpen(false);
    markRoiModalShown();
    // 🚀 수정: 토스트 알림 대신 요금제 페이지로 직행
    router.push("/pricing");
  };

  if (!isOpen || loading) return null;

  const daysUsed = Math.max(0, 14 - stats.daysRemaining);

  const statsData = [
    {
      icon: (
        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21H5a2 2 0 01-2-2v-7a2 2 0 012-2h2.343a1 1 0 00.707-.293l3.243-3.243a1 1 0 011.414 0L14 8" />
        </svg>
      ),
      value: `${stats.positiveReviews}`,
      label: "긍정 리뷰 누적",
      color: "from-emerald-500 to-green-600",
      shadowColor: "shadow-emerald-500/25",
      bgGlow: "bg-emerald-500/10",
    },
    {
      icon: (
        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      ),
      value: `${stats.negativeReviews}`,
      label: "악플 사전 차단",
      color: "from-rose-500 to-pink-600",
      shadowColor: "shadow-rose-500/25",
      bgGlow: "bg-rose-500/10",
    },
    {
      icon: (
        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5z" />
        </svg>
      ),
      value: `${stats.qrScans}`,
      label: "매장 QR 스캔",
      color: "from-violet-500 to-purple-600",
      shadowColor: "shadow-violet-500/25",
      bgGlow: "bg-violet-500/10",
    },
  ];

  return (
    <>
      {/* ── Modal Overlay ── */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

        {/* Modal Dialog */}
        <div
          className="relative w-full max-w-md overflow-hidden rounded-[28px] shadow-2xl"
          style={{ animation: "roiModalIn 0.4s cubic-bezier(0.16,1,0.3,1) forwards" }}
        >
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#1c1f30] via-[#161822] to-[#111318]" />
          <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-emerald-500/8 blur-3xl" />

          <div className="relative z-10 p-7">
            {/* D-Day Badge */}
            <div className="mx-auto mb-5 flex w-fit items-center gap-2 rounded-full bg-amber-500/15 px-4 py-2 ring-1 ring-amber-500/30">
              <span className="text-sm font-bold tracking-tight text-amber-400">
                ⏳ 무료 체험 종료 D-{stats.daysRemaining}
              </span>
            </div>

            {/* Title */}
            <h2 className="mb-2 text-center text-[22px] font-extrabold leading-tight tracking-tight text-white">
              지금까지 쌓은 성과를 <br />
              놓치지 마세요
            </h2>
            <p className="mb-6 text-center text-sm leading-relaxed text-zinc-400">
              ReviewGuard가 지난 {daysUsed}일간 만들어낸 <br />
              <strong className="text-zinc-200">사장님의 실제 성과</strong>입니다.
            </p>

            {/* Stats Grid */}
            <div className="mb-7 grid grid-cols-3 gap-3">
              {statsData.map((s, i) => (
                <div
                  key={i}
                  className="group flex flex-col items-center gap-2.5 rounded-2xl bg-white/[0.03] p-4 ring-1 ring-white/[0.06] transition-all duration-300 hover:bg-white/[0.06] hover:ring-white/[0.12]"
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${s.color} text-white shadow-lg ${s.shadowColor} transition-transform duration-300 group-hover:scale-110`}
                  >
                    {s.icon}
                  </div>
                  <span className="text-xl font-black tracking-tight text-white">{s.value}</span>
                  <span className="text-[11px] font-medium text-zinc-400">{s.label}</span>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div className="mb-6 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  markRoiModalShown();
                }}
                className="flex-1 rounded-xl bg-white/[0.04] py-3.5 text-sm font-semibold text-zinc-400 ring-1 ring-white/[0.08] transition-all hover:bg-white/[0.08] hover:text-zinc-200 active:scale-[0.97]"
              >
                {'\ub098\uc911\uc5d0 \ud558\uae30'}
              </button>
              <button
                type="button"
                onClick={handlePayClick}
                className="flex-[2] rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 ring-1 ring-white/20 transition-all hover:from-emerald-400 hover:to-green-500 active:scale-[0.97]"
              >
                월 29,000원으로 성과 이어가기
              </button>
            </div>

            {/* Secure Note */}
            <p className="mt-4 text-center text-[10px] text-zinc-600">
              🔒 언제든 해지 가능 · 부가세 포함 가격
            </p>
          </div>
        </div>
      </div>
      {/* 🚀 토스트 알림 컴포넌트 전체 삭제 */}
    </>
  );
}