"use client";
import React from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import PremiumEmptyState from "./PremiumEmptyState";

const VELOCITY_DATA = [
  { date: "1주차", 우리매장: 12, 경쟁사1위: 45 },
  { date: "2주차", 우리매장: 25, 경쟁사1위: 48 },
  { date: "3주차", 우리매장: 42, 경쟁사1위: 51 },
  { date: "4주차", 우리매장: 68, 경쟁사1위: 53 },
  { date: "이번주", 우리매장: 95, 경쟁사1위: 55 },
];

interface VelocityTrackerWidgetProps {
  reviews?: any[];
  isDemoMode?: boolean;
}

export default function VelocityTrackerWidget({
  reviews = [],
  isDemoMode = true
}: VelocityTrackerWidgetProps) {
  
  if (!isDemoMode && reviews.length === 0) {
    return (
      <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1d2b] to-[#161822] p-6 ring-1 ring-white/[0.06] shadow-lg transition-all duration-300">
        <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="relative z-10">
          <h3 className="mb-2 text-sm font-bold text-zinc-200">🚀 상권 TOP 경쟁사 리뷰 성장 속도</h3>
          <p className="text-xs text-zinc-500 mb-6">최근 4주간 일간 리뷰 획득 속도(기울기)를 비교하는 맹추격 레이더입니다.</p>
          <PremiumEmptyState message="아직 수집된 데이터가 없습니다. 첫 QR 리뷰를 받아보세요!" />
        </div>
      </div>
    );
  }

  let chartData = VELOCITY_DATA;
  let growthText = "성장률 +691%";

  if (!isDemoMode) {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    
    const w1_end = now - 28 * oneDayMs;
    const w2_end = now - 21 * oneDayMs;
    const w3_end = now - 14 * oneDayMs;
    const w4_end = now - 7 * oneDayMs;
    const w5_end = now;
    
    const c1 = reviews.filter(r => new Date(r.created_at).getTime() <= w1_end).length;
    const c2 = reviews.filter(r => new Date(r.created_at).getTime() <= w2_end).length;
    const c3 = reviews.filter(r => new Date(r.created_at).getTime() <= w3_end).length;
    const c4 = reviews.filter(r => new Date(r.created_at).getTime() <= w4_end).length;
    const c5 = reviews.filter(r => new Date(r.created_at).getTime() <= w5_end).length;
    
    chartData = [
      { date: "4주 전", 우리매장: c1, 경쟁사1위: 0 },
      { date: "3주 전", 우리매장: c2, 경쟁사1위: 0 },
      { date: "2주 전", 우리매장: c3, 경쟁사1위: 0 },
      { date: "1주 전", 우리매장: c4, 경쟁사1위: 0 },
      { date: "이번주", 우리매장: c5, 경쟁사1위: 0 },
    ];

    const growthRate = c1 > 0 ? Math.round(((c5 - c1) / c1) * 100) : c5 * 100;
    growthText = c1 > 0 ? `성장률 +${growthRate}%` : `신규 유입 +${c5}건`;
  }

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1d2b] to-[#161822] p-6 ring-1 ring-white/[0.06] shadow-lg transition-all duration-300">
      <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-violet-500/10 blur-3xl" />
      <div className="relative z-10">
        <h3 className="mb-2 text-sm font-bold text-zinc-200">🚀 상권 TOP 경쟁사 리뷰 성장 속도</h3>
        <p className="text-xs text-zinc-500 mb-6">
          {isDemoMode 
            ? "최근 4주간 일간 리뷰 획득 속도(기울기)를 비교하는 맹추격 레이더입니다." 
            : "최근 4주간 일간 리뷰 누적 증가 속도를 추적하는 차트입니다."}
        </p>
        
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorOurs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
                {isDemoMode && (
                  <linearGradient id="colorComp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#71717a" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#71717a" stopOpacity={0}/>
                  </linearGradient>
                )}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="date" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: "#1a1d2b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff" }} 
                itemStyle={{ color: "#fff" }}
              />
              {isDemoMode && (
                <Area type="monotone" dataKey="경쟁사1위" stroke="#71717a" strokeWidth={2} fillOpacity={1} fill="url(#colorComp)" />
              )}
              <Area type="monotone" dataKey="우리매장" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorOurs)" activeDot={{ r: 6 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 rounded-xl bg-violet-500/10 p-3 ring-1 ring-violet-500/20 flex items-center justify-between">
          <span className="text-xs font-semibold text-violet-300">맹추격 레이더 분석 결과</span>
          <span className="text-[11px] font-bold text-white bg-violet-500 rounded-full px-2 py-0.5">{growthText}</span>
        </div>
      </div>
    </div>
  );
}
