"use client";
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

const ROI_DATA = [
  { month: "1월", 리뷰누적수: 120, 월매출액: 2450 },
  { month: "2월", 리뷰누적수: 280, 월매출액: 2900 },
  { month: "3월", 리뷰누적수: 510, 월매출액: 3800 },
  { month: "4월", 리뷰누적수: 890, 월매출액: 5100 },
  { month: "5월", 리뷰누적수: 1450, 월매출액: 7200 },
];

export default function RoiBoardWidget() {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1d2b] to-[#161822] p-6 ring-1 ring-white/[0.06] shadow-lg transition-all duration-300">
      <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="relative z-10">
        <h3 className="mb-2 text-sm font-bold text-zinc-200">📈 리뷰 ➔ 매출 상관관계 증명</h3>
        <p className="text-xs text-zinc-500 mb-6">리뷰가 쌓일수록 매출이 폭발적으로 상승하는 ROI 보드입니다.</p>
        
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={ROI_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="month" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis yAxisId="left" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} orientation="left" />
              <YAxis yAxisId="right" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} orientation="right" hide />
              <Tooltip 
                contentStyle={{ backgroundColor: "#1a1d2b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff" }} 
                itemStyle={{ color: "#fff" }}
              />
              <Bar yAxisId="left" dataKey="리뷰누적수" fill="#34d399" radius={[4, 4, 0, 0]} barSize={20} fillOpacity={0.8} />
              <Line yAxisId="right" type="monotone" dataKey="월매출액" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: "#f59e0b", strokeWidth: 2, stroke: "#1a1d2b" }} activeDot={{ r: 6 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 rounded-xl bg-emerald-500/10 p-3 ring-1 ring-emerald-500/20 flex items-center justify-between">
          <span className="text-xs font-semibold text-emerald-300">예상 추가 수익 창출액</span>
          <span className="text-[11px] font-bold text-white bg-emerald-500 rounded-full px-2 py-0.5">월 +475만원</span>
        </div>
      </div>
    </div>
  );
}
