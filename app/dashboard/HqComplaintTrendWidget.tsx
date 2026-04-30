"use client";
import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { AlertCircle, Clock, AlertTriangle } from "lucide-react";

interface KeywordData {
  word: string;
  count: number;
}

interface RedZoneStore {
  id: string;
  name: string;
  complaintCount: number;
  avgSentiment: number;
  lastComplaintDate: string;
  topKeyword: string;
}

const PIE_COLORS = ["#f43f5e", "#fb923c", "#facc15", "#34d399", "#3b82f6"];

export default function HqComplaintTrendWidget() {
  const [keywords, setKeywords] = useState<KeywordData[]>([]);
  const [redZoneStores, setRedZoneStores] = useState<RedZoneStore[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/hq/complaints");
        if (!res.ok) throw new Error("Failed to fetch HQ complaints");
        const data = await res.json();
        setKeywords(data.topKeywords || []);
        setRedZoneStores(data.redZoneStores || []);
      } catch (err) {
        console.error("HqComplaintTrendWidget fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="rounded-[2rem] bg-white/[0.03] p-8 ring-1 ring-white/10 flex items-center justify-center min-h-[320px] mb-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-800 border-t-white" />
      </div>
    );
  }

  // 시간 경과 포맷팅 함수
  const timeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.round(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}분 전`;
    const diffHours = Math.round(diffMins / 60);
    if (diffHours < 24) return `${diffHours}시간 전`;
    return `${Math.round(diffHours / 24)}일 전`;
  };

  return (
    <div className="rounded-[2rem] bg-[#0f111a] p-8 ring-1 ring-white/10 shadow-2xl relative overflow-hidden border border-white/5 mb-8">
      <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-rose-500/10 blur-[100px] pointer-events-none" />
      <div className="relative z-10 flex flex-col lg:flex-row gap-8">
        
        {/* 뷰 A: 통합 감성 리포트 */}
        <div className="flex-1">
          <div className="mb-6 flex items-center gap-2">
            <span className="text-xl">📊</span>
            <h3 className="text-lg font-black text-white tracking-tight">전사 통합 고객 감성 지수(Sentiment) 리포트</h3>
          </div>
          <p className="text-xs text-zinc-400 mb-6 font-medium">전국 가맹점에서 가장 빈번하게 발생하는 불만 요인을 취합한 통합 지표입니다.</p>
          
          {keywords.length === 0 ? (
            <div className="flex items-center justify-center h-[200px] text-zinc-500 text-sm border border-dashed border-white/10 rounded-xl">
              아직 집계된 데이터가 없습니다.
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="h-[220px] w-full sm:w-[220px] flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={keywords} dataKey="count" nameKey="word" cx="50%" cy="50%" innerRadius={60} outerRadius={80} stroke="none" paddingAngle={4}>
                      {keywords.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#1a1d2b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", fontSize: "12px", fontWeight: "bold" }} itemStyle={{ color: "#fff" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 w-full space-y-3">
                {keywords.map((kw, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <span className="h-3 w-3 rounded-full shadow-lg" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                      <span className="font-bold text-zinc-200">{kw.word}</span>
                    </div>
                    <span className="font-black text-white bg-white/5 px-2 py-0.5 rounded-lg ring-1 ring-white/10">{kw.count}건</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 구분선 */}
        <div className="hidden lg:block w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
        <div className="block lg:hidden h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* 뷰 B: 지점별 리스크 데이터 추적 (레드존) */}
        <div className="flex-1">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="text-rose-500" size={20} />
              <h3 className="text-lg font-black text-white tracking-tight">지점별 리스크 데이터 추적</h3>
            </div>
            <span className="rounded-full bg-rose-500/10 px-2.5 py-1 text-[10px] font-black text-rose-400 ring-1 ring-rose-500/30 animate-pulse tracking-widest">RED ZONE</span>
          </div>
          <p className="text-xs text-zinc-400 mb-6 font-medium">최근 고객 불만 접수량이 급증하여 본사의 즉각적인 개입이 필요한 상위 3개 지점입니다.</p>

          {redZoneStores.length === 0 ? (
            <div className="flex items-center justify-center h-[200px] text-zinc-500 text-sm border border-dashed border-white/10 rounded-xl">
              위험 지점이 없습니다.
            </div>
          ) : (
            <div className="space-y-4">
              {redZoneStores.map((store, i) => (
                <div key={store.id} className="group relative overflow-hidden rounded-xl bg-[#161822] p-4 ring-1 ring-white/5 hover:ring-rose-500/30 hover:bg-rose-500/5 transition-all shadow-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-rose-500/20 text-[10px] font-black text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.3)]">{i + 1}</span>
                      <h4 className="font-bold text-zinc-200 text-sm">{store.name}</h4>
                    </div>
                    <span className="text-[11px] font-black text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md">누적 {store.complaintCount}건</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div className="flex items-center gap-1.5 rounded-lg bg-black/30 px-2.5 py-2 text-[11px] ring-1 ring-white/5">
                      <Clock size={12} className="text-zinc-500" />
                      <span className="text-zinc-400">최근 발생:</span>
                      <span className="font-bold text-rose-300">{timeAgo(store.lastComplaintDate)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-lg bg-black/30 px-2.5 py-2 text-[11px] ring-1 ring-white/5">
                      <AlertTriangle size={12} className="text-zinc-500" />
                      <span className="text-zinc-400">1순위 요인:</span>
                      <span className="font-bold text-rose-300 truncate max-w-[80px]">{store.topKeyword}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
