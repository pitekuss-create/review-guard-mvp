"use client";

import { X, Star, MessageSquare, BarChart3, TrendingUp, ShieldCheck, Target } from "lucide-react";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';

interface MonthlyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeName: string;
}

// 📊 Mock Data: 추후 API 데이터로 교체될 영역입니다.
const radarData = [
  { subject: '서비스/응대', A: 95, fullMark: 100 },
  { subject: '맛/품질', A: 90, fullMark: 100 },
  { subject: '매장 분위기', A: 85, fullMark: 100 },
  { subject: '가격 만족도', A: 80, fullMark: 100 },
  { subject: '위생/청결', A: 95, fullMark: 100 },
];

const trendData = [
  { name: '1주차', rating: 4.2, reviews: 24 },
  { name: '2주차', rating: 4.5, reviews: 35 },
  { name: '3주차', rating: 4.6, reviews: 42 },
  { name: '4주차', rating: 4.8, reviews: 27 },
];

export default function MonthlyReportModal({ isOpen, onClose, storeName }: MonthlyReportModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
      {/* 어두운 배경 */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* 🚀 컨설팅 펌 에디션 모달 (공간 확보를 위해 max-w-4xl 적용) */}
      <div className="relative w-full max-w-4xl overflow-hidden rounded-[2rem] bg-[#0f111a] shadow-2xl ring-1 ring-white/10 animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">

        {/* 헤더: 프리미엄 다크 그라데이션 */}
        <div className="relative shrink-0 bg-gradient-to-r from-[#1a1c2e] to-[#2d1b4e] p-6 sm:p-8 border-b border-white/5">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Target size={120} />
          </div>
          <button
            onClick={onClose}
            className="absolute top-6 right-6 h-8 w-8 flex items-center justify-center rounded-full bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition z-10"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-violet-600/20 flex items-center justify-center ring-1 ring-violet-500/30">
              <BarChart3 className="text-violet-400" size={24} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-violet-400">Strategic Executive Report</span>
              <h2 className="text-2xl font-black text-white mt-1">{storeName} 월간 성과 분석 보고서</h2>
              <p className="text-zinc-400 text-xs mt-1.5 font-medium">리뷰가드 데이터 인텔리전스 시스템 기반 심층 지표 분석 (최근 30일)</p>
            </div>
          </div>
        </div>

        {/* 본문 (스크롤 영역) */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto custom-scrollbar">

          {/* 1. 핵심 KPI 요약 */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-2xl bg-white/[0.02] p-5 ring-1 ring-white/5 flex flex-col justify-between">
              <p className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2">
                <Star size={14} className="text-amber-400" /> 월간 평균 평점
              </p>
              <div className="mt-3 flex items-end gap-3">
                <span className="text-3xl font-black text-white">4.8</span>
                <span className="flex items-center text-xs font-bold text-emerald-400 mb-1 bg-emerald-400/10 px-2 py-0.5 rounded">
                  <TrendingUp size={12} className="mr-1" /> 전월대비 +0.3
                </span>
              </div>
            </div>
            <div className="rounded-2xl bg-white/[0.02] p-5 ring-1 ring-white/5 flex flex-col justify-between">
              <p className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2">
                <MessageSquare size={14} className="text-blue-400" /> 신규 리뷰 유입
              </p>
              <div className="mt-3 flex items-end gap-3">
                <span className="text-3xl font-black text-white">128<span className="text-lg text-zinc-500 ml-1">건</span></span>
                <span className="flex items-center text-xs font-bold text-emerald-400 mb-1 bg-emerald-400/10 px-2 py-0.5 rounded">
                  <TrendingUp size={12} className="mr-1" /> 전월대비 +15%
                </span>
              </div>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-violet-600/10 to-transparent p-5 ring-1 ring-violet-500/20 flex flex-col justify-between">
              <p className="text-xs font-bold text-violet-300 uppercase flex items-center gap-2">
                <ShieldCheck size={14} /> 리스크 방어율 (초기 대응)
              </p>
              <div className="mt-3 flex items-end gap-3">
                <span className="text-3xl font-black text-white">100<span className="text-lg text-violet-400 ml-1">%</span></span>
                <p className="text-[10px] text-zinc-400 mb-1.5 font-medium">악성 리뷰 4건 즉각 격리 완료</p>
              </div>
            </div>
          </div>

          {/* 2. 데이터 시각화 (레이더 차트 & 라인 차트) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 레이더 차트: 브랜드 핵심 역량 */}
            <div className="rounded-2xl bg-white/[0.02] p-6 ring-1 ring-white/5">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Target size={16} className="text-violet-400" /> 브랜드 핵심 역량 지수 (다면 평가)
              </h3>
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="#333" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#999', fontSize: 11, fontWeight: 'bold' }} />
                    <Radar name={storeName} dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1c2e', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 라인 차트: 주차별 성장 추이 */}
            <div className="rounded-2xl bg-white/[0.02] p-6 ring-1 ring-white/5">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-400" /> 주차별 평점 성장 추이
              </h3>
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                    <XAxis dataKey="name" stroke="#666" tick={{ fill: '#999', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[3.5, 5.0]} stroke="#666" tick={{ fill: '#999', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1c2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                      itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                    />
                    <Line type="monotone" dataKey="rating" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* 3. 전문가 종합 분석 (컨설팅 펌 스타일) */}
          <div className="rounded-2xl bg-gradient-to-r from-violet-900/20 to-transparent p-1 ring-1 ring-violet-500/30">
            <div className="bg-[#0f111a] rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4 border-b border-white/5 pb-4">
                <div className="h-8 w-8 rounded-full bg-violet-600 flex items-center justify-center text-white text-[10px] font-black tracking-tighter shadow-lg shadow-violet-600/30">RG</div>
                <div>
                  <h3 className="text-sm font-black text-white">전략 기획팀 종합 분석 의견</h3>
                  <p className="text-[10px] text-zinc-500 font-medium mt-0.5">Reported by ReviewGuard Analytics</p>
                </div>
              </div>

              <ul className="space-y-3 text-sm">
                <li className="flex gap-3 text-zinc-300">
                  <span className="text-violet-400 font-black mt-0.5">01.</span>
                  <p className="leading-relaxed">
                    <strong className="text-white">절대적 우위 확보:</strong> 이번 달 '위생/청결' 및 '서비스/응대' 지표가 전국 가맹점 평균 대비 15% 상회하며 <strong>최상위권(Top 5%)</strong>에 진입했습니다. 매장 청결도에 대한 긍정 리뷰가 재방문율 상승을 견인하고 있습니다.
                  </p>
                </li>
                <li className="flex gap-3 text-zinc-300">
                  <span className="text-violet-400 font-black mt-0.5">02.</span>
                  <p className="leading-relaxed">
                    <strong className="text-white">가격 저항선 모니터링:</strong> '가격 만족도' 지수가 80점으로 유일한 하락 추세를 보이고 있습니다. 최근 객단가 상승이 영향을 미친 것으로 파악되며, 영수증 리뷰 이벤트를 통한 체감 가격 인하 전략이 필요합니다.
                  </p>
                </li>
                <li className="flex gap-3 text-zinc-300">
                  <span className="text-violet-400 font-black mt-0.5">03.</span>
                  <p className="leading-relaxed">
                    <strong className="text-white">리스크 완벽 통제:</strong> 초기 평점 2점 이하의 악성 리뷰 4건이 발생했으나, 경고 시스템을 통한 1시간 이내 즉각 대응으로 점수 하락을 완벽하게 방어했습니다. 현재의 대응 매뉴얼 유지를 강력히 권장합니다.
                  </p>
                </li>
              </ul>
            </div>
          </div>

        </div>

        {/* 하단 액션 버튼 */}
        <div className="shrink-0 p-6 border-t border-white/5 flex items-center justify-between bg-[#1a1c2e]/50">
          <p className="text-[10px] text-zinc-500 font-medium">본 리포트는 철저한 보안 규정에 따라 취급되어야 합니다.</p>
          <div className="flex gap-3">
            <button
              onClick={() => window.print()}
              className="px-6 py-2.5 rounded-xl bg-violet-600 text-xs font-bold text-white hover:bg-violet-500 transition active:scale-95 shadow-lg shadow-violet-600/20"
            >
              보고서 PDF 다운로드
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-white/5 text-xs font-bold text-zinc-400 hover:text-white transition active:scale-95"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}