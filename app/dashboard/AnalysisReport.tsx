"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store/useStore"; // 🚀 전역 권한 스토어
import type { ReviewRow } from "./ReviewTable";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { BarChart3 } from "lucide-react";
import MonthlyReportModal from "./MonthlyReportModal";

const PIE_COLORS = ["#34d399", "#fb7185"]; // Emerald(Pos), Rose(Neg)


export default function AnalysisReport({
  reviews,
  storeId
}: {
  reviews: ReviewRow[];
  storeId: string;
}) {
  // 🚀 [수술 1]: AnalysisReport에도 프랜차이즈 무적 방어막 이식 (변수명 수정 완벽판)
  const { userRole, currentStoreId, accessibleStores } = useStore();
  const activeRole = (() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("payment_success") === "true" && params.get("plan")) return params.get("plan")!.toUpperCase();
    }
    return (userRole || "FREE").toUpperCase();
  })();

  const currentStoreData = accessibleStores?.find(s => s.id === currentStoreId);
  const isHqStore = !!(currentStoreData as any)?.organization_id; // 본사 코드가 있으면 true

  // 🚀 [팩트 체크 완료]: 변수명을 isPaidUser가 아니라 기존 파일에 맞게 isProUser로 맞춰야 합니다!
  const isProUser = ["BASIC", "PRO", "ENTERPRISE", "HQ_ADMIN", "SUPER_ADMIN"].includes(activeRole) || isHqStore;
  const [premiumToast, setPremiumToast] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const stats = useMemo(() => {
    let pos = 0;
    let neg = 0;
    const dailyCount: Record<string, number> = {
      "월": 0, "화": 0, "수": 0, "목": 0, "금": 0, "토": 0, "일": 0
    };
    const dailyNegCountMap: Record<string, number> = {
      "월": 0, "화": 0, "수": 0, "목": 0, "금": 0, "토": 0, "일": 0
    };
    const keywordFreq: Record<string, number> = {};

    const dayMap = ["일", "월", "화", "수", "목", "금", "토"];

    for (const r of reviews) {
      if (r.rating >= 4) {
        pos++;
      } else {
        neg++;
      }

      const date = new Date(r.created_at);
      const day = dayMap[date.getDay()];
      dailyCount[day]++;
      if (r.rating < 4) {
        dailyNegCountMap[day]++;
      }

      if (r.selected_tags) {
        const tags = r.selected_tags.split(",").map(t => t.trim());
        tags.forEach(tag => {
          if (tag) keywordFreq[tag] = (keywordFreq[tag] || 0) + 1;
        });
      }
    }

    const pieData = [
      { name: "긍정", value: pos },
      { name: "부정", value: neg },
    ];

    if (pos === 0 && neg === 0) {
      pieData[0].value = 1;
    }

    const barData = dayMap.slice(1).concat(dayMap[0]).map(day => ({
      name: day,
      리뷰: dailyCount[day]
    }));

    const topKeywords = Object.entries(keywordFreq)
      .map(([word, weight]) => ({ word, weight }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 10);

    const total = reviews.length;
    const copied = reviews.filter((r) => r.is_copied).length;
    const convRate = total > 0 ? ((copied / total) * 100).toFixed(1) : "0.0";

    const dailyNegCount = dayMap.slice(1).concat(dayMap[0]).map(day => dailyNegCountMap[day]);

    return { pieData, barData, topKeywords, total, copied, convRate, neg, dailyNegCount };
  }, [reviews]);

  return (
    <div className="mb-8">
      {/* 🚀 리뷰가 0건일 때는 빈 상태 UI만 렌더링하고, 하단 프로 기능은 조건문 밖에서 무조건 렌더링! */}
      {reviews.length === 0 ? (
        <div className="mb-10 flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/5 py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800 text-2xl">
            📊
          </div>
          <h3 className="text-lg font-bold text-white">아직 분석할 데이터가 없습니다</h3>
          <p className="mt-2 text-sm text-zinc-500">
            매장 등록이 완료되었습니다.<br />
            매장에 QR코드를 비치하여 첫 고객 리뷰가 접수되면 시스템 분석이 즉시 시작됩니다.
          </p>
        </div>
      ) : (
        <>
          {/* ═══════════════════════════════════════
              ① 베이직 리포트 — 카드 3개
             ═══════════════════════════════════════ */}
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-violet-400 text-lg">📊</span>
              <h2 className="text-xl font-bold tracking-tight text-white">
                베이직 성과 리포트
              </h2>
              <span className="ml-2 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 ring-1 ring-emerald-500/30">
                FREE
              </span>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-10">
            {/* Card 1: 그림자 방어막 */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1d2b] to-[#161822] p-6 ring-1 ring-white/[0.06] shadow-lg transition-all duration-300 hover:ring-white/[0.12] hover:-translate-y-0.5">
              <div className="absolute -top-12 -right-12 h-28 w-28 rounded-full bg-rose-500/8 blur-2xl transition-all duration-500 group-hover:bg-rose-500/15" />
              <div className="relative z-10">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 shadow-lg shadow-rose-500/20">
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                  </div>
                  <span className="rounded-full bg-rose-500/10 px-2.5 py-1 text-[10px] font-bold text-rose-400 ring-1 ring-rose-500/20">
                    −{stats.neg}건 차단
                  </span>
                </div>
                <h3 className="mb-1 text-sm font-bold text-zinc-200">그림자 방어막</h3>
                <p className="text-xs leading-relaxed text-zinc-500">
                  악성 리뷰 {stats.neg}건을 사전에 감지하고 대응 답글을 자동 생성했습니다.
                </p>
                <div className="mt-4 flex items-end gap-1 h-12">
                  {stats.dailyNegCount.map((v, i) => (
                    <div key={i} className="w-full rounded-sm bg-gradient-to-t from-rose-500/40 to-rose-500/20 transition-all duration-300 group-hover:from-rose-500/60 group-hover:to-rose-500/30" style={{ height: `${Math.min(v * 8 + 4, 48)}px` }} />
                  ))}
                </div>
              </div>
            </div>

            {/* Card 2: 키워드 클라우드 */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1d2b] to-[#161822] p-6 ring-1 ring-white/[0.06] shadow-lg transition-all duration-300 hover:ring-white/[0.12] hover:-translate-y-0.5">
              <div className="absolute -top-12 -right-12 h-28 w-28 rounded-full bg-violet-500/8 blur-2xl transition-all duration-500 group-hover:bg-violet-500/15" />
              <div className="relative z-10">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/20">
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <span className="rounded-full bg-violet-500/10 px-2.5 py-1 text-[10px] font-bold text-violet-400 ring-1 ring-violet-500/20">
                    TOP 5
                  </span>
                </div>
                <h3 className="mb-1 text-sm font-bold text-zinc-200">키워드 클라우드</h3>
                <p className="text-xs leading-relaxed text-zinc-500">고객들이 가장 많이 언급한 핵심 키워드입니다.</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {stats.topKeywords.length > 0 ? (
                    stats.topKeywords.map((kw, i) => {
                      const sizes = ["text-[13px] font-bold", "text-[12px] font-semibold", "text-[11px] font-medium", "text-[10px]"];
                      const colors = ["text-violet-300", "text-purple-300", "text-fuchsia-300/80", "text-zinc-400"];
                      const idx = Math.min(Math.floor(i / 2), 3);
                      return <span key={kw.word} className={`${sizes[idx]} ${colors[idx]} rounded-lg bg-white/[0.04] px-2 py-1 ring-1 ring-white/[0.06] transition-all hover:bg-white/[0.08]`}>{kw.word}</span>;
                    })
                  ) : (
                    <span className="text-[11px] text-zinc-600 italic">아직 수집된 키워드가 없습니다.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Card 3: 리뷰 전환율 */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1d2b] to-[#161822] p-6 ring-1 ring-white/[0.06] shadow-lg transition-all duration-300 hover:ring-white/[0.12] hover:-translate-y-0.5">
              <div className="absolute -top-12 -right-12 h-28 w-28 rounded-full bg-emerald-500/8 blur-2xl transition-all duration-500 group-hover:bg-emerald-500/15" />
              <div className="relative z-10">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                    </svg>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-400 ring-1 ring-emerald-500/20">↑ {stats.convRate}%</span>
                </div>
                <h3 className="mb-1 text-sm font-bold text-zinc-200">리뷰 전환율</h3>
                <p className="text-xs leading-relaxed text-zinc-500">QR 스캔 후 실제 리뷰를 작성한 고객 비율입니다.</p>
                <div className="mt-4 flex items-center gap-4">
                  <div className="relative h-16 w-16 flex-shrink-0">
                    <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
                      <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
                      <circle cx="32" cy="32" r="28" fill="none" stroke="url(#convGrad)" strokeWidth="5" strokeLinecap="round" strokeDasharray={`${parseFloat(stats.convRate) * 1.76} 176`} />
                      <defs>
                        <linearGradient id="convGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#34d399" /><stop offset="100%" stopColor="#14b8a6" /></linearGradient>
                      </defs>
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-extrabold text-emerald-400">{stats.convRate}%</span>
                  </div>
                  <div className="text-xs text-zinc-500 leading-relaxed">
                    <span className="text-zinc-300 font-semibold">{stats.copied}</span>건 완료<br />
                    총 <span className="text-zinc-300 font-semibold">{stats.total}</span>건 스캔 중
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* === 기존 베이직 차트 영역 === */}
          <div className="grid gap-6 lg:grid-cols-2 mb-10">
            {/* Pie Chart: 긍정 vs 부정 비율 */}
            <div className="rounded-2xl bg-gradient-to-br from-[#1a1d2b] to-[#161822cc] p-6 ring-1 ring-white/[0.06] shadow-lg">
              <h3 className="mb-2 text-sm font-semibold text-zinc-300">이번 주 고객 만족 비율</h3>
              <p className="text-xs text-zinc-500 mb-4">수집된 리뷰를 바탕으로 한 긍/부정 분포입니다.</p>
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stats.pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                      {stats.pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#1a1d2b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff" }} itemStyle={{ color: "#fff" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-2">
                <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-emerald-400"></span><span className="text-xs font-medium text-zinc-300">긍정적인 추세</span></div>
                <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-rose-400"></span><span className="text-xs font-medium text-zinc-300">부정 리뷰 방어건</span></div>
              </div>
            </div>

            {/* Bar Chart: 요일별 유입 파이프라인 */}
            <div className="rounded-2xl bg-gradient-to-br from-[#1a1d2b] to-[#161822cc] p-6 ring-1 ring-white/[0.06] shadow-lg">
              <h3 className="mb-2 text-sm font-semibold text-zinc-300">요일별 리뷰 유입량 트렌드 (실시간)</h3>
              <p className="text-xs text-zinc-500 mb-4">요일에 따른 리뷰가드 QR 스캔 및 전환율입니다.</p>
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: "rgba(255,255,255,0.02)" }} contentStyle={{ backgroundColor: "#1a1d2b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff" }} />
                    <Bar dataKey="리뷰" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 🚀 데이터가 0건이어도 무조건 보이도록 블록 밖으로 꺼낸 프로 기능들 */}

      {/* ─── 월간 AI 성과 리포트 배너 ─── */}
      <div className="mb-10 mt-6">
        <button
          onClick={() => setIsReportOpen(true)}
          className="flex w-full items-center justify-between rounded-2xl bg-gradient-to-r from-violet-600/10 to-fuchsia-600/10 p-5 ring-1 ring-violet-500/30 hover:ring-violet-500/50 transition-all group shadow-xl"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600 text-white shadow-2xl shadow-violet-600/30 group-hover:scale-110 transition-transform">
              <BarChart3 size={22} />
            </div>
            <div className="text-left">
              <h3 className="text-base font-black text-white">월간 통합 성과 리포트</h3>
              <p className="text-xs font-medium text-zinc-500 mt-0.5">이번 달 우리 매장의 지표 변화와 분석 시스템의 지표 종합 보고서를 확인하세요.</p>
            </div>
          </div>
          <div className="rounded-lg bg-white/5 px-5 py-2.5 text-xs font-bold text-zinc-400 group-hover:text-white group-hover:bg-violet-600 transition-all">
            리포트 열기 →
          </div>
        </button>
      </div>
      <MonthlyReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        storeName="우리 매장"
      />
    </div>
  );
}