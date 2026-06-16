"use client";
import { AlertCircle, ArrowDown, ArrowUp, Sparkles } from "lucide-react";
import PremiumEmptyState from "./PremiumEmptyState";

interface KeywordTrend {
  word: string;
  count: number;
  trend: "up" | "down" | "same";
}

interface ComplaintTrendWidgetProps {
  hasData?: boolean;
  complaints?: KeywordTrend[];
}

export default function ComplaintTrendWidget({ hasData = true, complaints = [] }: ComplaintTrendWidgetProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1d2b] to-[#161822] p-6 ring-1 ring-white/[0.06] shadow-lg transition-all duration-300">
      <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-rose-500/10 blur-3xl" />
      <div className="relative z-10">
        <h3 className="mb-2 text-sm font-bold text-zinc-200">🚨 이번 달 고객 감성 지수(Sentiment) 리포트</h3>
        <p className="text-xs text-zinc-500 mb-6">비밀 소리함 데이터 기반 핵심 불만 키워드 추적 및 증감 트렌드입니다.</p>

        {!hasData ? (
          <PremiumEmptyState message="아직 수집된 데이터가 없습니다. 첫 QR 리뷰를 받아보세요!" />
        ) : complaints.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center bg-white/[0.02] rounded-xl border border-dashed border-white/10">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 mb-3">
              <Sparkles size={24} />
            </div>
            <p className="text-sm font-bold text-emerald-400">이번 달 고객 불만이 0건입니다.</p>
            <p className="text-xs text-zinc-400 mt-1">완벽합니다! 현재 서비스 품질을 유지해주세요.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500 px-2">
              <span>핵심 불만 키워드 Top 5</span>
              <span>전월 대비</span>
            </div>
            {complaints.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between bg-white/[0.03] rounded-lg px-4 py-3 hover:bg-white/[0.06] transition-colors">
                <div className="flex items-center gap-3">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${idx < 2 ? 'bg-rose-500/20 text-rose-400' : 'bg-white/10 text-zinc-400'}`}>
                    {idx + 1}
                  </span>
                  <span className="text-sm font-semibold text-zinc-300">{item.word}</span>
                  <span className="text-xs text-zinc-500">({item.count}건)</span>
                </div>
                <div className="flex items-center gap-1">
                  {item.trend === "down" ? (
                    <span className="flex items-center text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md">
                      <ArrowDown size={12} className="mr-0.5" /> 감소
                    </span>
                  ) : item.trend === "up" ? (
                    <span className="flex items-center text-xs font-bold text-rose-400 bg-rose-400/10 px-2 py-1 rounded-md">
                      <ArrowUp size={12} className="mr-0.5" /> 증가
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-zinc-400 px-2 py-1">
                      동일
                    </span>
                  )}
                </div>
              </div>
            ))}
            
            <div className="mt-4 rounded-xl bg-rose-500/10 p-3 ring-1 ring-rose-500/20 flex items-start gap-3">
              <AlertCircle size={16} className="text-rose-400 mt-0.5 shrink-0" />
              <p className="text-xs font-medium text-rose-200/80 leading-relaxed">
                현재 <strong className="text-rose-300">'{complaints[0]?.word}'</strong> 관련 리뷰에 대한 즉각적인 개선이 필요합니다.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
