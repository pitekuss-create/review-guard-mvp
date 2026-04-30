"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { X } from "lucide-react"; // 🚀 추가: X 아이콘 가져오기

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);
  const [isSponsored, setIsSponsored] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnterpriseModalOpen, setIsEnterpriseModalOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkSponsorship = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: store } = await supabase
        .from("stores")
        .select("is_hq_sponsored")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (store?.is_hq_sponsored) {
        setIsSponsored(true);
        router.replace("/dashboard");
        return;
      }
      setIsLoading(false);
    };
    checkSponsorship();
  }, [supabase, router]);

  const handleStart = () => {
    router.push("/dashboard");
  };

  const handlePaymentClick = (plan: string) => {
    if (isSponsored) {
      alert("본사 지원 매장은 결제가 필요하지 않습니다.");
      router.push("/dashboard");
      return;
    }
    router.push(`/checkout?plan=${plan}&yearly=${isYearly}`);
  };

  return (
    <div className="min-h-screen bg-[#0f1117] py-20 px-6 font-sans text-zinc-100 selection:bg-fuchsia-500/30 relative">

      {/* 🚀 추가: 대시보드로 돌아가는 X 닫기 버튼 */}
      <button
        onClick={() => router.push("/dashboard")}
        className="absolute top-8 right-8 p-3 bg-white/5 rounded-full hover:bg-white/10 ring-1 ring-white/10 transition-all z-50 group"
      >
        <X size={24} className="text-zinc-400 group-hover:text-white" />
      </button>

      <div className="mx-auto max-w-6xl mt-4"> {/* mt-4 추가하여 닫기 버튼 공간 확보 */}
        <div className="text-center mb-16">
          <div className="mb-4 inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/10 to-fuchsia-500/10 p-4 ring-1 ring-white/5">
            <span className="text-4xl text-gradient bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-fuchsia-400">
              ReviewGuard
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-6">
            매장에 꼭 맞는 플랜을 선택하세요.
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            매장 평점을 깎아먹는 악플은 차단하고, 방문객을 부르는 긍정 리뷰는 극대화합니다.
          </p>

          <div className="mt-12 flex justify-center items-center gap-4">
            <span className={`text-sm font-semibold transition ${!isYearly ? "text-white" : "text-zinc-500"}`}>
              월간 결제
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className="relative inline-flex h-8 w-16 items-center rounded-full bg-zinc-800 ring-1 ring-white/10 transition-colors focus:outline-none"
            >
              <div
                className={`absolute left-1 top-1 h-6 w-6 rounded-full transition-transform duration-300 ${isYearly ? "translate-x-8 bg-fuchsia-500" : "bg-zinc-400"}`}
              />
            </button>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold transition ${isYearly ? "text-white" : "text-zinc-500"}`}>
                연간 결제
              </span>
              <span className="rounded-full bg-fuchsia-500/20 px-2.5 py-0.5 text-xs font-bold text-fuchsia-400 ring-1 ring-fuchsia-500/30">
                2개월 무료!
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-4 lg:gap-6 items-start">
          {/* FREE PLAN */}
          <div className="relative flex flex-col rounded-3xl bg-[#161822] p-8 ring-1 ring-white/10 shadow-xl transition-all hover:-translate-y-1 hover:ring-white/20">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white">무료 체험 (Free)</h3>
              <p className="mt-2 text-sm text-zinc-400 h-10">리뷰가드의 핵심 기능을 14일 동안 마음껏 체험하세요.</p>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-4xl font-black text-white">14일 무료</span>
              </div>
            </div>

            {isSponsored ? (
              <button onClick={handleStart} className="mb-8 flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 py-4 text-sm font-bold text-emerald-400 ring-1 ring-emerald-500/20 hover:bg-emerald-500/20 transition-all">
                <CheckIcon className="h-4 w-4" /> 본사 지원 대상 (대시보드 이동)
              </button>
            ) : (
              <button onClick={handleStart} className="mb-8 w-full rounded-xl bg-white/5 py-4 text-sm font-bold text-white transition-all hover:bg-white/10 ring-1 ring-white/10 active:scale-95">
                무료 체험 시작하고 웰컴 키트 받기
              </button>
            )}

            <ul className="flex flex-col gap-4 text-sm font-medium">
              <li className="flex items-start gap-3 text-zinc-200">
                <CheckIcon className="h-5 w-5 text-emerald-400 shrink-0" />
                <span className="text-emerald-400 font-bold">✨ 매장용 QR 아크릴 스탠드 웰컴 키트 무상 배송</span>
              </li>
              <li className="flex items-start gap-3 text-zinc-300">
                <CheckIcon className="h-5 w-5 text-emerald-400 shrink-0" />
                <span><strong className="text-emerald-300">14일간 무제한 AI 답글 완전 개방!</strong> (이후 일 10건)</span>
              </li>
              <li className="flex items-start gap-3 text-zinc-300">
                <CheckIcon className="h-5 w-5 text-emerald-400 shrink-0" />
                <span>1개 매장 연동 지원</span>
              </li>
              <li className="flex items-start gap-3 text-zinc-300">
                <CheckIcon className="h-5 w-5 text-emerald-400 shrink-0" />
                <span>기본 QR 스캔 통계 제공</span>
              </li>
              <li className="flex items-start gap-3 text-zinc-600 line-through mt-2">
                <XIcon className="h-5 w-5 text-zinc-700 shrink-0" />
                <span>실시간 악플 차단 알림</span>
              </li>
              <li className="flex items-start gap-3 text-zinc-600 line-through">
                <XIcon className="h-5 w-5 text-zinc-700 shrink-0" />
                <span>완벽 상권 분석 (경쟁사 비교)</span>
              </li>
            </ul>
          </div>

          {/* BASIC PLAN */}
          <div className="relative flex flex-col rounded-3xl bg-gradient-to-b from-[#1a1c29] to-[#161822] p-8 ring-2 ring-violet-500 shadow-2xl shadow-violet-500/20 transform md:-translate-y-4">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-1 text-xs font-bold text-white shadow-lg">BEST 플랜</span>
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white">베이직 (Basic)</h3>
              <p className="mt-2 text-sm text-violet-300 font-medium h-10">내 매장 리뷰 완전 방어 및 최적화 케어</p>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-4xl font-black text-white">{isYearly ? "₩25,000" : "₩29,000"}</span>
                <span className="text-zinc-400 text-sm font-medium">/ 월</span>
              </div>
            </div>

            {isSponsored ? (
              <button onClick={handleStart} className="mb-8 flex items-center justify-center gap-2 rounded-xl bg-fuchsia-500/10 py-4 text-sm font-bold text-fuchsia-400 ring-1 ring-fuchsia-500/20 hover:bg-fuchsia-500/20 transition-all">
                <CheckIcon className="h-4 w-4" /> 본사 지원 대상 (대시보드 이동)
              </button>
            ) : (
              <button onClick={() => handlePaymentClick('basic')} className="mb-8 w-full rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 py-4 text-sm font-bold text-white transition-all hover:from-violet-400 hover:to-fuchsia-400 shadow-xl shadow-fuchsia-500/25 active:scale-95">
                베이직 플랜으로 업그레이드
              </button>
            )}

            <ul className="flex flex-col gap-4 text-sm font-medium">
              <li className="flex items-start gap-3 text-zinc-200">
                <CheckIcon className="h-5 w-5 text-violet-400 shrink-0" />
                <span><span className="text-white font-bold">[강조]</span> 매장 전용 '리뷰 부스터' 테이블 텐트 무료 제공</span>
              </li>
              <li className="flex items-start gap-3 text-zinc-200">
                <CheckIcon className="h-5 w-5 text-violet-400 shrink-0" />
                <span>1점 테러 사전 방어 '비밀 소리함' 시스템</span>
              </li>
              <li className="flex items-start gap-3 text-zinc-200">
                <CheckIcon className="h-5 w-5 text-violet-400 shrink-0" />
                <span>맞춤형 리뷰 답글 초안 자동 생성</span>
              </li>
              <li className="flex items-start gap-3 text-zinc-200">
                <CheckIcon className="h-5 w-5 text-violet-400 shrink-0" />
                <span>네이버 플레이스 리뷰 통합 대시보드</span>
              </li>
              <li className="flex items-start gap-3 text-zinc-200">
                <CheckIcon className="h-5 w-5 text-violet-400 shrink-0" />
                <span>주간 리뷰 감성 및 키워드 요약 리포트</span>
              </li>
            </ul>
          </div>

          {/* PRO PLAN */}
          <div className="relative flex flex-col rounded-3xl bg-[#161822] p-8 ring-1 ring-white/10 shadow-xl transition-all hover:-translate-y-1 hover:ring-white/20">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white">프로 (Pro)</h3>
              <p className="mt-2 text-sm text-zinc-400 h-10">동네 상권의 비밀을 해제하고 압도적 1위로</p>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-4xl font-black text-white">{isYearly ? "₩41,600" : "₩79,000"}</span>
                <span className="text-zinc-400 text-sm font-medium">/ 월</span>
              </div>
            </div>

            {isSponsored ? (
              <button onClick={handleStart} className="mb-8 flex items-center justify-center gap-2 rounded-xl bg-blue-500/10 py-4 text-sm font-bold text-blue-400 ring-1 ring-blue-500/20 hover:bg-blue-500/20 transition-all">
                <CheckIcon className="h-4 w-4" /> 본사 지원 대상 (대시보드 이동)
              </button>
            ) : (
              <button onClick={() => handlePaymentClick('pro')} className="mb-8 w-full rounded-xl bg-white/10 py-4 text-sm font-bold text-white transition-all hover:bg-white/20 ring-1 ring-white/20 active:scale-95">
                프로 플랜 시작하기
              </button>
            )}

            <ul className="flex flex-col gap-4 text-sm font-medium">
              <li className="flex items-start gap-3 text-zinc-300">
                <CheckIcon className="h-5 w-5 text-amber-400 shrink-0" />
                <span><span className="text-white font-bold">[Basic 플랜 모든 기능 포함]</span></span>
              </li>
              <li className="flex items-start gap-3 text-zinc-200">
                <CheckIcon className="h-5 w-5 text-blue-400 shrink-0" />
                <span>상권 내 타겟 키워드 자동 분석 및 답글 주입</span>
              </li>
              <li className="flex items-start gap-3 text-zinc-300">
                <CheckIcon className="h-5 w-5 text-blue-400 shrink-0" />
                <span>핵심 경쟁사 플레이스 트래픽 맹추격 레이더</span>
              </li>
              <li className="flex items-start gap-3 text-zinc-300">
                <CheckIcon className="h-5 w-5 text-blue-400 shrink-0" />
                <span>부정 리뷰 발생 시 스마트폰 즉각 알림</span>
              </li>
              <li className="flex items-start gap-3 text-zinc-300">
                <CheckIcon className="h-5 w-5 text-blue-400 shrink-0" />
                <span>경쟁사 대비 매장 성장률 분석 리포트</span>
              </li>
            </ul>
          </div>

          {/* ENTERPRISE PLAN */}
          <div className="relative flex flex-col rounded-3xl bg-[#161822] p-8 ring-1 ring-white/10 shadow-xl transition-all hover:-translate-y-1 hover:ring-white/20">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white">Enterprise</h3>
              <p className="mt-2 text-sm text-zinc-400 h-10">프랜차이즈 전용</p>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-4xl font-black text-white">상담 문의</span>
              </div>
            </div>

            <button
              onClick={() => setIsEnterpriseModalOpen(true)}
              className="mb-8 w-full rounded-xl bg-white/5 py-4 text-sm font-bold text-white transition-all hover:bg-white/10 ring-1 ring-white/10 active:scale-95"
            >
              프랜차이즈 도입 문의
            </button>

            <ul className="flex flex-col gap-4 text-sm font-medium">
              <li className="flex items-start gap-3 text-zinc-300">
                <CheckIcon className="h-5 w-5 text-zinc-400 shrink-0" />
                <span><span className="text-white font-bold">[Pro 플랜 모든 기능 포함]</span></span>
              </li>
              <li className="flex items-start gap-3 text-zinc-200">
                <CheckIcon className="h-5 w-5 text-zinc-400 shrink-0" />
                <span>권한별(본사/슈퍼바이저/가맹점) 통합 관제 대시보드</span>
              </li>
              <li className="flex items-start gap-3 text-zinc-200">
                <CheckIcon className="h-5 w-5 text-zinc-400 shrink-0" />
                <span>전국 가맹점 리뷰 리스크 랭킹 및 신호등 모니터링</span>
              </li>
              <li className="flex items-start gap-3 text-zinc-200">
                <CheckIcon className="h-5 w-5 text-zinc-400 shrink-0" />
                <span>본사 ➔ 가맹점 데이터 실시간 통합 동기화</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Enterprise Modal */}
      {isEnterpriseModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-black/60">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#0f1117] border border-white/10 p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsEnterpriseModalOpen(false)}
              className="absolute top-6 right-6 text-zinc-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
            
            <div className="mb-8">
              <h2 className="text-2xl font-black text-white flex items-center gap-2 mb-6">
                👑 Enterprise 프랜차이즈 도입 문의
              </h2>
              <p className="font-bold text-white text-lg mb-3 leading-relaxed">
                "단순한 관리 툴을 넘어, 프랜차이즈 본사의 압도적인 경쟁력이 되겠습니다."
              </p>
              <p className="text-zinc-400 text-sm leading-relaxed">
                가맹점 폐점 리스크를 실시간으로 방어하고, 신규 가맹점 유치 시 강력한 '본사 지원 혜택'으로 활용할 수 있는 최고의 파트너가 되어 드립니다.
              </p>
            </div>

            <div className="bg-white/5 rounded-2xl p-6 ring-1 ring-white/10 space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <span className="text-xl">📞</span>
                <div>
                  <div className="text-sm font-bold text-white mb-1">담당자 직통 핫라인</div>
                  <div className="text-emerald-400 font-black text-lg">010-0000-0000</div>
                  <div className="text-xs text-zinc-500 mt-1">(부재 시 문자 남겨주시면 즉시 연락드립니다)</div>
                </div>
              </div>
              <div className="h-px bg-white/10 w-full" />
              <div className="flex items-start gap-3">
                <span className="text-xl">✉️</span>
                <div>
                  <div className="text-sm font-bold text-white mb-1">다이렉트 이메일</div>
                  <div className="text-blue-400 font-black text-base">ceo@reviewguard.com</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsEnterpriseModalOpen(false)}
              className="w-full rounded-xl bg-white py-4 text-sm font-bold text-black transition-all hover:bg-zinc-200 active:scale-95"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CheckIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function XIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}