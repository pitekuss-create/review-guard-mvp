"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  TrendingUp, 
  Users, 
  Coins, 
  ArrowRight, 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle2, 
  ShieldAlert,
  ArrowLeft
} from "lucide-react";

export default function CalculatorPage() {
  const router = useRouter();

  // Inputs
  const [trafficGap, setTrafficGap] = useState<number>(8000);
  const [ticketSize, setTicketSize] = useState<number>(50000);

  // Interaction States
  const [phase, setPhase] = useState<"input" | "loading" | "result">("input");
  const [loadingStep, setLoadingStep] = useState<number>(0);

  // Result Calculation
  // Formula: (trafficGap * 0.05) * ticketSize = monthly revenue loss
  const calculatedLoss = Math.round((trafficGap * 0.05) * ticketSize);

  // Format Helper: 20000000 -> 2,000만
  const formatKoreanWonSummary = (value: number): string => {
    if (value >= 100000000) {
      const eok = Math.floor(value / 100000000);
      const man = Math.round((value % 100000000) / 10000);
      return man > 0 ? `${eok}억 ${man.toLocaleString()}만` : `${eok}억`;
    }
    if (value >= 10000) {
      const man = Math.round(value / 10000);
      return `${man.toLocaleString()}만`;
    }
    return value.toLocaleString();
  };

  // Loading Step Simulation
  useEffect(() => {
    if (phase !== "loading") return;

    const timers = [
      setTimeout(() => setLoadingStep(1), 500),
      setTimeout(() => setLoadingStep(2), 1100),
      setTimeout(() => setLoadingStep(3), 1700),
      setTimeout(() => {
        setPhase("result");
        setLoadingStep(0);
      }, 2300)
    ];

    return () => timers.forEach(clearTimeout);
  }, [phase]);

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    if (trafficGap <= 0 || ticketSize <= 0) return;
    setPhase("loading");
  };

  const handleReset = () => {
    setPhase("input");
  };

  const handleCTA = () => {
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[#070913] text-zinc-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans select-none">
      
      {/* Ambient glowing orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-purple-600/10 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-[350px] h-[350px] bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />

      {/* Grid Pattern overlay for tech feel */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f29370a_1px,transparent_1px),linear-gradient(to_bottom,#1f29370a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Main Glassmorphic Card */}
      <div className="w-full max-w-md bg-[#0f1225]/85 border border-white/10 rounded-3xl p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl relative z-10 transition-all duration-300">
        
        {/* TOP BADGE */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-xs font-bold text-red-400 uppercase tracking-wider animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5" />
            매장 긴급 진단 도구
          </div>
        </div>

        {/* Dynamic Screen rendering */}
        {phase === "input" && (
          <div className="space-y-6" style={{ animation: "fadeSlideUp 0.35s ease-out" }}>
            <div className="text-center">
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">
                놓치고 있는 <br />
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-emerald-400 bg-clip-text text-transparent">
                  트래픽 기회비용 계산기
                </span>
              </h1>
              <p className="mt-3 text-sm text-zinc-400 leading-relaxed font-medium">
                주변 잠재 고객들이 우리 가게가 아닌 경쟁 매장으로 유입되며 발생하는 월간 손실액을 확인하세요.
              </p>
            </div>

            <form onSubmit={handleCalculate} className="space-y-5">
              
              {/* STEP 1 INPUT */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  STEP 1. 월간 검색 트래픽 격차
                </label>
                <p className="text-xs text-zinc-500">
                  내 주변 상권 경쟁사 대비 검색 노출 부족으로 유실되고 있는 예상 월 방문자 수 (명)
                </p>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Users className="h-5 w-5 text-zinc-500" />
                  </div>
                  <input
                    type="number"
                    min="1"
                    required
                    value={trafficGap || ""}
                    onChange={(e) => setTrafficGap(Math.max(0, parseInt(e.target.value) || 0))}
                    className="block w-full pl-11 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white text-lg font-bold placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="예: 8,000"
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <span className="text-sm font-bold text-zinc-400">명</span>
                  </div>
                </div>
                {/* PRESETS FOR TRAFFIC */}
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {[3000, 5000, 8000, 15000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setTrafficGap(val)}
                      className={`text-xs py-1.5 px-2 rounded-xl border transition-all font-semibold ${
                        trafficGap === val
                          ? "bg-purple-600/20 border-purple-500 text-purple-300 shadow-md shadow-purple-600/10"
                          : "bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10"
                      }`}
                    >
                      {val.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* STEP 2 INPUT */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  STEP 2. 테이블당 평균 객단가
                </label>
                <p className="text-xs text-zinc-500">
                  우리 매장을 방문하는 한 테이블팀의 평균 매출액 (원)
                </p>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Coins className="h-5 w-5 text-zinc-500" />
                  </div>
                  <input
                    type="number"
                    min="1"
                    required
                    value={ticketSize || ""}
                    onChange={(e) => setTicketSize(Math.max(0, parseInt(e.target.value) || 0))}
                    className="block w-full pl-11 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white text-lg font-bold placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    placeholder="예: 50,000"
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <span className="text-sm font-bold text-zinc-400">원</span>
                  </div>
                </div>
                {/* PRESETS FOR TICKET SIZE */}
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {[25000, 40000, 50000, 80000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setTicketSize(val)}
                      className={`text-xs py-1.5 px-2 rounded-xl border transition-all font-semibold ${
                        ticketSize === val
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/10"
                          : "bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10"
                      }`}
                    >
                      {val.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* CALCULATE BUTTON */}
              <button
                type="submit"
                className="w-full flex justify-center items-center gap-2 h-14 mt-6 rounded-2xl bg-gradient-to-r from-purple-600 to-emerald-600 font-extrabold text-white text-base shadow-lg shadow-purple-900/30 transition hover:brightness-110 active:scale-[0.98]"
              >
                잃어버린 월 매출 계산하기
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          </div>
        )}

        {/* Phase 2: Loading Animation Screen */}
        {phase === "loading" && (
          <div className="py-8 flex flex-col items-center text-center space-y-6" style={{ animation: "fadeSlideUp 0.3s ease-out" }}>
            <div className="relative flex items-center justify-center">
              {/* Spinning outer border */}
              <div className="w-20 h-20 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
              {/* Inner glowing pulse */}
              <div className="absolute w-12 h-12 bg-purple-500/20 rounded-full animate-ping" />
              <TrendingUp className="absolute w-8 h-8 text-purple-400" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">기회비용 진단 중</h2>
              <p className="text-xs text-zinc-500">
                상권 격차 데이터를 기반으로 예상 추가 매출액을 연산 중입니다.
              </p>
            </div>

            {/* Steps indicator */}
            <div className="w-full max-w-xs bg-white/5 rounded-2xl p-4 border border-white/5 space-y-3.5 text-left text-xs font-semibold">
              <div className="flex items-center gap-3">
                {loadingStep >= 1 ? (
                  <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                ) : (
                  <RefreshCw className="w-4 h-4 text-zinc-600 animate-spin flex-shrink-0" />
                )}
                <span className={loadingStep >= 1 ? "text-zinc-200" : "text-zinc-500"}>
                  상권 경쟁사와의 노출 격차 확인 완료
                </span>
              </div>
              <div className="flex items-center gap-3">
                {loadingStep >= 2 ? (
                  <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                ) : (
                  <RefreshCw className={`w-4 h-4 flex-shrink-0 ${loadingStep === 1 ? "text-zinc-500 animate-spin" : "text-zinc-600"}`} />
                )}
                <span className={loadingStep >= 2 ? "text-zinc-200" : "text-zinc-500"}>
                  이탈 트래픽의 5% 회수 가능성 시뮬레이션
                </span>
              </div>
              <div className="flex items-center gap-3">
                {loadingStep >= 3 ? (
                  <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                ) : (
                  <RefreshCw className={`w-4 h-4 flex-shrink-0 ${loadingStep === 2 ? "text-zinc-500 animate-spin" : "text-zinc-600"}`} />
                )}
                <span className={loadingStep >= 3 ? "text-zinc-200" : "text-zinc-500"}>
                  최종 월 예상 손실 가치 정량화 중...
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Phase 3: Results Shock Treatment */}
        {phase === "result" && (
          <div className="space-y-6" style={{ animation: "fadeSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }}>
            <div className="text-center space-y-2">
              <span className="text-sm font-bold text-emerald-400 uppercase tracking-widest">
                시뮬레이션 분석 완료
              </span>
              <h2 className="text-2xl font-extrabold text-white leading-tight">
                경쟁사에 뺏긴 <br />
                내 매장의 진짜 월급
              </h2>
            </div>

            {/* Shocking Value display card */}
            <div className="bg-gradient-to-b from-[#1b1c31] to-[#121324] border border-white/10 rounded-2xl p-6 text-center space-y-2 relative overflow-hidden shadow-inner">
              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
              
              <p className="text-xs font-bold text-zinc-400">
                매월 회수 가능한 추가 매출 기회
              </p>
              
              <div className="py-2">
                <span className="text-4xl md:text-5xl font-black text-[#39FF14] drop-shadow-[0_0_12px_rgba(57,255,20,0.2)] tracking-tight">
                  +{calculatedLoss.toLocaleString()}원
                </span>
                <span className="block text-xs font-bold text-[#39FF14]/80 mt-1">
                  (매월 약 {formatKoreanWonSummary(calculatedLoss)} 원 상당)
                </span>
              </div>

              <div className="text-xs text-zinc-400 pt-2 border-t border-white/5 leading-relaxed font-medium">
                놓치고 있는 <span className="text-white font-bold">{trafficGap.toLocaleString()}명</span> 중 단 <span className="text-purple-400 font-bold">5% ({(trafficGap * 0.05).toLocaleString()}명)</span>만 우리 매장으로 당겨와도 매월 추가 매출이 발생합니다.
              </div>
            </div>

            {/* Aggressive Copy */}
            <div className="flex gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-xs font-semibold text-red-400 leading-relaxed items-start">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-400 mt-0.5" />
              <div>
                <p className="font-bold text-red-300 mb-0.5">경쟁사의 트래픽 독식 경고</p>
                경쟁사는 이미 스마트한 고객 리뷰 가드 솔루션을 통해 해당 검색 키워드 트래픽을 완전히 독점하고 잠재 고객을 쓸어 담고 있습니다.
              </div>
            </div>

            {/* Giant Pulsing CTA Button */}
            <div className="space-y-3 pt-2">
              <Link
                href="/login"
                className="w-full flex flex-col justify-center items-center gap-1.5 h-16 rounded-2xl bg-[#39FF14] text-[#070913] hover:bg-[#32e012] font-black text-sm md:text-base shadow-[0_0_30px_rgba(57,255,20,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98] animate-pulse text-center justify-center cursor-pointer"
              >
                <span>지금 바로 {formatKoreanWonSummary(calculatedLoss)} 되찾기</span>
                <span className="text-[10px] font-bold opacity-75">(무료 테이블 텐트 패키지 신청하기)</span>
              </Link>

              {/* Recalculate Option */}
              <button
                onClick={handleReset}
                className="w-full flex items-center justify-center gap-2 text-xs font-bold text-zinc-400 hover:text-white transition py-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                입력값 수정 및 다시 계산하기
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Tiny Subtext Footer */}
      <div className="mt-8 text-center text-[10px] text-zinc-600 font-semibold tracking-wider relative z-10">
        &copy; {new Date().getFullYear()} ReviewGuard. All Rights Reserved.
      </div>
    </div>
  );
}
