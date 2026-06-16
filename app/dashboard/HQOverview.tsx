"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle, TrendingDown, TrendingUp, Star, ChevronRight,
  CheckCircle2, Link as LinkIcon, BarChart3, Trophy, Skull, Send, Radar, Zap, Download, X, Copy
} from "lucide-react";
import MonthlyReportModal from "./MonthlyReportModal";
import HqComplaintTrendWidget from "./HqComplaintTrendWidget";
import PremiumEmptyState from "./PremiumEmptyState";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine, ZAxis, Cell } from 'recharts';

interface HQStoreStats {
  id: string;
  name: string;
  avgRating: string;
  totalReviews: number;
  ratingDiff: string;
  status: 'CRISIS' | 'WARN' | 'GOOD';
  isCrisis: boolean;
}

const DEMO_EMAILS = ['seoulbowl@naver.com', 'seoulbowl_store@naver.com', 'seoulbowl_solo@naver.com'];

const DEMO_STATS: HQStoreStats[] = [
  { id: "demo-1", name: "콤파스커피 마산점", avgRating: "4.8", totalReviews: 120, ratingDiff: "-0.10", status: 'GOOD', isCrisis: false },
  { id: "demo-2", name: "콤파스커피 창원점", avgRating: "4.2", totalReviews: 280, ratingDiff: "0.45", status: 'CRISIS', isCrisis: true },
  { id: "demo-3", name: "콤파스커피 진해점", avgRating: "4.5", totalReviews: 195, ratingDiff: "0.15", status: 'WARN', isCrisis: false },
  { id: "demo-4", name: "콤파스커피 합성점", avgRating: "4.7", totalReviews: 150, ratingDiff: "-0.05", status: 'GOOD', isCrisis: false },
  { id: "demo-5", name: "콤파스커피 상남점", avgRating: "4.6", totalReviews: 85, ratingDiff: "0.20", status: 'WARN', isCrisis: false },
];

export default function HQOverview({ 
  userEmail, 
  isDemoMode: isDemoModeProp 
}: { 
  userEmail?: string | null; 
  isDemoMode?: boolean; 
}) {
  const isDemoMode = typeof isDemoModeProp === "boolean" ? isDemoModeProp : DEMO_EMAILS.includes(userEmail || "");
  const [stats, setStats] = useState<HQStoreStats[]>([]);
  const [contractEndDate, setContractEndDate] = useState<string | null>(null);

  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);
  // 🚀 NEW: 발급된 6자리 코드를 저장하고 모달을 띄우는 State
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isKakaoModalOpen, setIsKakaoModalOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<HQStoreStats | null>(null);
  const [kakaoMessage, setKakaoMessage] = useState("");
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warn' | 'error' } | null>(null);

  const [isHideToastToday, setIsHideToastToday] = useState(false);
  const [checkboxChecked, setCheckboxChecked] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("crisis"); // 기본값: 위기 우선

  useEffect(() => {
    if (selectedStore) {
      setKakaoMessage(`사장님, 안녕하세요. 본사 전략팀입니다. 

현재 ${selectedStore.name}의 최근 3일 평점 데이터가 하락세로 감지되었습니다. 

본사 차원의 리뷰 대응 지원이 필요하신 경우 말씀해 주십시오. 함께 개선해 나가겠습니다.`);
    }
  }, [selectedStore]);

  useEffect(() => {
    const hideDate = localStorage.getItem('hideCrisisToastDate');
    const today = new Date().toLocaleDateString();
    if (hideDate === today) {
      setIsHideToastToday(true);
    }

    if (isDemoMode) {
      setStats(DEMO_STATS);
      setContractEndDate("2027-12-31T00:00:00.000Z");
      setIsLoading(false);
      return;
    }

    const fetchHQStats = async () => {
      try {
        const res = await fetch("/api/hq/stats");
        const data = await res.json();
        if (data.stores) {
          setStats(data.stores);
          setContractEndDate(data.contractEndDate);

          const crisisStores = data.stores.filter((s: HQStoreStats) => s.isCrisis);
          if (crisisStores.length > 0 && hideDate !== today) {
            setToast({
              message: `🚨 ${crisisStores.length}개의 매장에서 위기가 감지되었습니다. 즉각적인 확인이 필요합니다.`,
              type: 'warn'
            });
            setTimeout(() => setToast(prev => prev?.type === 'warn' ? null : prev), 10000);
          }
        }
      } catch (err) {
        console.error("Failed to load HQ stats", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHQStats();
  }, [isDemoMode]);

  // 🚀 NEW: 클립보드 복사 유틸 함수
  const copyToClipboard = async (text: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setToast({ message: successMessage, type: "success" });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setToast({ message: "복사에 실패했습니다.", type: "error" });
      setTimeout(() => setToast(null), 3000);
    }
  };

  // 🚀 NEW: 초대 코드 생성 로직 (생성 후 모달을 띄움)
  const handleGenerateInvite = async () => {
    setIsGeneratingInvite(true);
    try {
      const res = await fetch("/api/hq/invite", { method: "POST" });
      const data = await res.json();

      if (data.success) {
        setGeneratedToken(data.token); // 발급된 6자리 코드를 State에 넣어서 모달을 염
      } else {
        setToast({ message: data.error || "초대 코드 생성 실패", type: "error" });
        setTimeout(() => setToast(null), 3000);
      }
    } catch (err) {
      setToast({ message: "네트워크 오류가 발생했습니다.", type: "error" });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setIsGeneratingInvite(false);
    }
  };

  const risingStars = [...stats].sort((a, b) => b.totalReviews - a.totalReviews).slice(0, 10);
  const focusRequired = [...stats].filter(s => parseFloat(s.ratingDiff) > 0).sort((a, b) => parseFloat(b.ratingDiff) - parseFloat(a.ratingDiff)).slice(0, 3);

  const matrixData = stats.map(s => ({
    name: s.name,
    x: s.totalReviews,
    y: parseFloat(s.avgRating),
    z: 200,
    isCrisis: s.isCrisis
  }));

  const handleKakaoSend = async () => {
    try {
      await navigator.clipboard.writeText(kakaoMessage);
      setToast({ message: "✅ 메시지가 복사되었습니다. 카카오톡에 붙여넣기 해주세요.", type: 'success' });
      setIsKakaoModalOpen(false);
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setToast({ message: "복사에 실패했습니다.", type: "error" });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleCloseToast = () => {
    if (checkboxChecked) {
      localStorage.setItem('hideCrisisToastDate', new Date().toLocaleDateString());
      setIsHideToastToday(true);
    }
    setToast(null);
  };

  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const handleBulkDownload = () => {
    setIsDownloadingZip(true);
    setToast({ message: "⏳ 전체 가맹점 데이터를 수집하여 ZIP 파일로 압축 중입니다... (약 10초 소요)", type: 'success' });
    setTimeout(() => {
      setIsDownloadingZip(false);
      setToast({ message: "✅ 전체 50개 가맹점 월간 리포트(ZIP) 다운로드가 완료되었습니다.", type: 'success' });
      setTimeout(() => setToast(null), 3000);
    }, 3500);
  };

  if (isLoading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 animate-pulse rounded-2xl bg-white/5 ring-1 ring-white/10" />
        ))}
      </div>
    );
  }

  const processedStats = [...stats]
    .filter(store => store.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortOption === "crisis") return (b.isCrisis === a.isCrisis) ? 0 : b.isCrisis ? 1 : -1;
      if (sortOption === "ratingDesc") return parseFloat(b.avgRating) - parseFloat(a.avgRating);
      if (sortOption === "ratingAsc") return parseFloat(a.avgRating) - parseFloat(b.avgRating);
      if (sortOption === "reviewsDesc") return b.totalReviews - a.totalReviews;
      if (sortOption === "nameAsc") return a.name.localeCompare(b.name);
      return 0;
    });

  return (
    <div className="space-y-8 relative pb-20">

      {/* 위기 경보 Toast */}
      {toast && toast.type === 'warn' && !isHideToastToday && (
        <div className="fixed top-24 right-6 z-[200] animate-in fade-in slide-in-from-right-4">
          <div className="rounded-2xl bg-rose-500 shadow-2xl ring-1 ring-rose-400 overflow-hidden flex flex-col max-w-md">
            <div className="px-6 py-4 flex items-start gap-3">
              <AlertCircle className="text-white shrink-0 mt-0.5" size={20} />
              <div className="text-sm font-black text-white leading-relaxed">{toast.message}</div>
            </div>
            <div className="bg-rose-950/40 px-5 py-3 flex items-center justify-between border-t border-rose-400/30">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" checked={checkboxChecked} onChange={(e) => setCheckboxChecked(e.target.checked)} className="w-4 h-4 rounded border-rose-300 text-rose-600 focus:ring-rose-500 cursor-pointer" />
                <span className="text-xs font-bold text-rose-100 group-hover:text-white transition">오늘 하루 보지 않기</span>
              </label>
              <button onClick={handleCloseToast} className="text-xs font-black text-white bg-rose-600/50 hover:bg-rose-600 px-4 py-1.5 rounded-lg transition">닫기 ✕</button>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 [수술 1]: 일반 알림 Toast - 정중앙 최상단 배치 & z-index 우주돌파 */}
      {toast && toast.type !== 'warn' && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[999999] animate-in fade-in slide-in-from-top-4">
          <div className={`rounded-full px-8 py-3.5 text-sm font-black text-white shadow-[0_15px_50px_rgba(0,0,0,0.6)] backdrop-blur-md ring-1 ring-white/20 whitespace-nowrap ${toast.type === 'error' ? 'bg-rose-500/95' : 'bg-emerald-500/95'}`}>
            {toast.message}
          </div>
        </div>
      )}

      {/* 계약 만료 배너 */}
      {(() => {
        if (!contractEndDate) return null;
        const now = new Date();
        const kstOffset = 9 * 60 * 60 * 1000;
        const kstNow = new Date(now.getTime() + kstOffset);
        kstNow.setHours(0, 0, 0, 0);

        const expiryDate = new Date(contractEndDate);
        const diffTime = expiryDate.getTime() - kstNow.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 0 && diffDays <= 30) {
          return (
            <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-center justify-between gap-4 rounded-2xl bg-rose-500/10 p-5 ring-1 ring-rose-500/30 shadow-lg shadow-rose-500/5">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500 shadow-lg shadow-rose-500/30">
                    <AlertCircle size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-rose-400">🚨 엔터프라이즈 계약 만료 임박</h3>
                    <p className="text-xs font-medium text-zinc-400 mt-0.5">
                      계약 만료까지 <span className="text-rose-500 font-black">{diffDays}일</span> 남았습니다. 연장 결제를 진행하지 않으면 <span className="text-zinc-200 font-bold">{contractEndDate.split('T')[0]}</span>에 서비스 이용이 제한될 수 있습니다.
                    </p>
                  </div>
                </div>
                <Link href="/settings/billing" className="whitespace-nowrap rounded-lg bg-rose-500 px-4 py-2 text-xs font-black text-white hover:bg-rose-600 transition active:scale-95 no-underline">지금 연장하기</Link>
              </div>
            </div>
          );
        }
        return null;
      })()}

      {/* 헤더 및 초대 버튼 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            본사 통합 모니터링 보드
            <span className="text-[10px] bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded-full ring-1 ring-violet-500/30">REAL-TIME</span>
          </h2>
          <div className="flex gap-4 text-xs font-medium text-zinc-500 mt-2">
            <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-500" /> 위기</div>
            <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" /> 주의</div>
            <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> 정상</div>
          </div>
        </div>

        <button
          onClick={handleGenerateInvite}
          disabled={isGeneratingInvite}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-violet-600/30 transition hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          {isGeneratingInvite ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <LinkIcon size={16} />
          )}
          새로운 가맹점 초대 발급
        </button>
      </div>

      {/* 프리미엄 관제 매트릭스 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 rounded-[2rem] bg-[#0f111a] p-6 sm:p-8 ring-1 ring-white/10 shadow-2xl relative overflow-hidden border border-white/5">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none"><Radar size={160} /></div>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2"><BarChart3 className="text-violet-400" size={20} /> 가맹점 포트폴리오 매트릭스</h3>
              <p className="text-xs text-zinc-500 mt-1 font-medium">리뷰 유입량(X축)과 평균 평점(Y축)을 교차 분석하여 브랜드 리스크를 진단합니다.</p>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-bold">
              <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"></span> 우수</div>
              <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]"></span> 주의</div>
            </div>
          </div>

          <div className="h-[280px] w-full bg-white/[0.01] rounded-2xl p-2 relative">
            {stats.length === 0 ? (
              <PremiumEmptyState message="아직 수집된 데이터가 없습니다. 첫 QR 리뷰를 받아보세요!" />
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis type="number" dataKey="x" name="리뷰 수" stroke="#666" tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} domain={['dataMin - 10', 'dataMax + 20']} />
                    <YAxis type="number" dataKey="y" name="평점" stroke="#666" tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} domain={[3.5, 5.0]} />
                    <ZAxis type="number" dataKey="z" range={[100, 300]} />
                    <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#1a1c2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontSize: '12px', fontWeight: 'bold' }} />
                    <ReferenceLine x={50} stroke="rgba(255,255,255,0.2)" strokeDasharray="3 3" />
                    <ReferenceLine y={4.5} stroke="rgba(255,255,255,0.2)" strokeDasharray="3 3" />
                    <Scatter name="가맹점" data={matrixData}>
                      {matrixData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.isCrisis ? "#f43f5e" : "#34d399"} fillOpacity={entry.isCrisis ? 0.8 : 0.4} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
                <span className="absolute top-4 right-4 text-[10px] font-black text-white/20 uppercase tracking-widest">Star (우수)</span>
                <span className="absolute bottom-4 left-6 text-[10px] font-black text-rose-500/30 uppercase tracking-widest">Risk (조치 요망)</span>
              </>
            )}
          </div>
        </div>

        {/* 예측 조기 경보 */}
        <div className="xl:col-span-1 rounded-[2rem] bg-gradient-to-b from-[#1a1124] to-[#120d18] p-6 ring-1 ring-rose-500/20 shadow-2xl relative overflow-hidden flex flex-col">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 via-fuchsia-500 to-violet-500"></div>
          <h3 className="text-base font-black text-white flex items-center gap-2 mb-6">
            <Zap className="text-rose-400 fill-rose-400/20" size={18} /> 리스크 조기 경보
            <span className="text-[9px] bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded border border-rose-500/30 animate-pulse">PREDICTIVE</span>
          </h3>

          <div className="space-y-4 flex-1">
            {isDemoMode ? (
              <>
                <div className="rounded-xl bg-white/[0.03] p-4 ring-1 ring-white/5 border-l-2 border-l-rose-500">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-black text-rose-400 bg-rose-400/10 px-1.5 py-0.5 rounded">확률 82%</span>
                    <span className="text-xs font-bold text-white">콤파스커피 합성점</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">이번 주말 객수 폭증으로 인한 '서비스 지연' 클레임 발생 위험이 매우 높습니다. 선제적 인력 배치 권장.</p>
                </div>
                <div className="rounded-xl bg-white/[0.03] p-4 ring-1 ring-white/5 border-l-2 border-l-amber-500">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-black text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">확률 65%</span>
                    <span className="text-xs font-bold text-white">콤파스커피 상남점</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">최근 3일 '청결' 관련 부정 키워드가 2건 연속 탐지되었습니다. 주방 집중 점검이 필요합니다.</p>
                </div>
              </>
            ) : (
              (() => {
                const crisisStores = stats.filter(s => s.isCrisis);
                const warnStores = stats.filter(s => s.status === 'WARN');

                if (stats.length === 0) {
                  return <PremiumEmptyState message="아직 수집된 데이터가 없습니다. 첫 QR 리뷰를 받아보세요!" />;
                }

                if (crisisStores.length === 0 && warnStores.length === 0) {
                  return (
                    <div className="rounded-xl bg-white/[0.03] p-4 ring-1 ring-white/5 border-l-2 border-l-emerald-500">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">리스크 안정</span>
                        <span className="text-xs font-bold text-white">모든 가맹점</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">현재 리스크가 감지된 가맹점이 없습니다. 우수한 서비스 품질이 유지되고 있습니다.</p>
                    </div>
                  );
                }

                return (
                  <>
                    {crisisStores.slice(0, 2).map((s) => (
                      <div key={s.id} className="rounded-xl bg-white/[0.03] p-4 ring-1 ring-white/5 border-l-2 border-l-rose-500">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[10px] font-black text-rose-400 bg-rose-400/10 px-1.5 py-0.5 rounded">위험 확률 90%</span>
                          <span className="text-xs font-bold text-white">{s.name}</span>
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">최근 평점 하락 또는 부정 리뷰 감지로 인한 리스크가 예상됩니다. 신속한 매장 지원 및 대응을 권장합니다.</p>
                      </div>
                    ))}
                    {warnStores.slice(0, 2).map((s) => (
                      <div key={s.id} className="rounded-xl bg-white/[0.03] p-4 ring-1 ring-white/5 border-l-2 border-l-amber-500">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[10px] font-black text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">주의 확률 60%</span>
                          <span className="text-xs font-bold text-white">{s.name}</span>
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">최근 평점이 하락하는 추세가 탐지되었습니다. 고객 만족도 점검을 권장합니다.</p>
                      </div>
                    ))}
                  </>
                );
              })()
            )}
          </div>
        </div>
      </div>

      {/* 리포트 & 랭킹 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-1 rounded-[2rem] bg-gradient-to-br from-[#1a1c2e] to-[#2d1b4e] p-8 ring-1 ring-white/10 shadow-2xl border border-white/5 flex flex-col justify-between min-h-[320px]">
          <div>
            <div className="h-12 w-12 rounded-2xl bg-violet-600/20 flex items-center justify-center ring-1 ring-violet-500/30 mb-5"><BarChart3 className="text-violet-400" size={24} /></div>
            <h3 className="text-xl font-black text-white leading-tight">월간 성과 리포트 센터</h3>
            <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">본사 통합 데이터 열람 및 가맹점별 개별 성과 보고서를 다운로드할 수 있습니다.</p>
          </div>
          <div className="mt-6 flex flex-col gap-3">
            <button onClick={() => setIsReportOpen(true)} className="w-full text-left p-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] ring-1 ring-white/10 transition group">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-black text-white group-hover:text-violet-300 transition">본사 통합 리포트 (웹 열람)</div>
                  <div className="text-[10px] text-zinc-500 mt-1">전체 가맹점 데이터를 합산한 본사 종합 분석</div>
                </div>
                <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-violet-500 transition"><ChevronRight size={16} className="text-zinc-400 group-hover:text-white" /></div>
              </div>
            </button>
            <button onClick={handleBulkDownload} disabled={isDownloadingZip} className="w-full text-left p-4 rounded-xl bg-violet-600/20 hover:bg-violet-600/40 ring-1 ring-violet-500/30 transition group disabled:opacity-50">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-black text-white group-hover:text-violet-300 transition flex items-center gap-2">
                    {isDownloadingZip && <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
                    가맹점별 개별 리포트 저장
                  </div>
                  <div className="text-[10px] text-violet-300/70 mt-1">전체 가맹점의 보고서를 ZIP 압축</div>
                </div>
                <div className="h-8 w-8 rounded-full bg-violet-500/20 flex items-center justify-center group-hover:bg-violet-500 transition"><Download size={16} className="text-violet-400 group-hover:text-white" /></div>
              </div>
            </button>
          </div>
        </div>

        <div className="rounded-[2rem] bg-white/[0.03] p-8 ring-1 ring-white/10 flex flex-col min-h-[320px]">
          <h3 className="text-sm font-black text-emerald-400 flex items-center gap-2 mb-6 uppercase tracking-wider"><Trophy size={16} /> Rising Stars (리뷰 유입 TOP 10)</h3>
          <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
            {stats.length === 0 ? (
              <PremiumEmptyState message="아직 수집된 데이터가 없습니다. 첫 QR 리뷰를 받아보세요!" />
            ) : risingStars.length > 0 ? (
              risingStars.map((s, i) => (
                <div key={s.id} className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0 last:pb-0">
                  <span className="text-sm font-bold text-zinc-300">{i + 1}. {s.name}</span>
                  <span className="text-sm font-black text-white bg-emerald-500/10 px-2.5 py-1 rounded-md text-emerald-400">{s.totalReviews}건</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-600 mt-4">데이터가 없습니다.</p>
            )}
          </div>
        </div>

        <div className="rounded-[2rem] bg-white/[0.03] p-8 ring-1 ring-white/10 flex flex-col min-h-[320px]">
          <h3 className="text-sm font-black text-rose-400 flex items-center gap-2 mb-6 uppercase tracking-wider"><Skull size={16} /> Focus Required (평점 하락 TOP 10)</h3>
          <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
            {stats.length === 0 ? (
              <PremiumEmptyState message="아직 수집된 데이터가 없습니다. 첫 QR 리뷰를 받아보세요!" />
            ) : focusRequired.length > 0 ? (
              focusRequired.map((s, i) => (
                <div key={s.id} className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0 last:pb-0">
                  <span className="text-sm font-bold text-zinc-300">{i + 1}. {s.name}</span>
                  <span className="text-sm font-black text-rose-500 bg-rose-500/10 px-2.5 py-1 rounded-md">-{s.ratingDiff}점</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-600 mt-4">데이터가 없습니다.</p>
            )}
          </div>
        </div>
      </div>

      <HqComplaintTrendWidget isDemoMode={isDemoMode} hasReviews={stats.reduce((sum, s) => sum + s.totalReviews, 0) > 0} />

      {/* 가맹점별 상세 관리 현황 */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4 mt-8">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          가맹점 실시간 관제
          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">ACTIVE</span>
        </h2>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stats.length === 0 ? (
          <div className="col-span-full">
            <PremiumEmptyState message="아직 수집된 데이터가 없습니다. 첫 QR 리뷰를 받아보세요!" />
          </div>
        ) : processedStats.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center rounded-[2.5rem] bg-white/[0.03] border-2 border-dashed border-white/10 p-16 text-center animate-in fade-in zoom-in duration-500">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-violet-500/10 text-4xl shadow-2xl shadow-violet-500/20">🏪</div>
            <h3 className="text-xl font-black text-white mb-2">검색 결과가 없습니다</h3>
            <p className="text-sm text-zinc-500 max-w-[320px] leading-relaxed mb-8">검색어나 필터를 변경해 보세요.</p>
          </div>
        ) : (
          processedStats.map((store) => (
            <div key={store.id} className="relative group">
              <Link href={`/dashboard?storeId=${store.id}`} className={`block overflow-hidden rounded-2xl p-6 transition-all hover:-translate-y-1 no-underline ${store.isCrisis ? "bg-rose-500/5 ring-2 ring-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.1)]" : "bg-white/[0.03] ring-1 ring-white/10 hover:bg-white/10"}`}>
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-white group-hover:text-violet-400 transition-colors">{store.name}</h3>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Real-time Status</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase mb-1">평균 별점</p>
                    <span className="text-2xl font-black text-white">{store.avgRating}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase mb-1">리뷰 유입</p>
                    <span className="text-2xl font-black text-white">{store.totalReviews}건</span>
                  </div>
                </div>
                {store.isCrisis && (
                  <div className="mt-4 rounded-lg bg-rose-500/10 p-2 text-[10px] font-black text-rose-400 ring-1 ring-rose-500/20 animate-pulse">⚠️ 급격한 별점 하락 감지</div>
                )}
              </Link>
              {store.isCrisis && (
                <button onClick={(e) => { e.preventDefault(); setSelectedStore(store); setIsKakaoModalOpen(true); }} className="absolute -bottom-3 -right-2 flex items-center gap-2 rounded-xl bg-[#FEE500] px-4 py-2.5 text-[11px] font-black text-zinc-900 shadow-xl hover:scale-105 active:scale-95 transition z-10 ring-2 ring-[#12141c]">
                  <div className="h-4 w-4 rounded-full bg-zinc-900 flex items-center justify-center"><Send size={10} className="text-[#FEE500] ml-0.5" /></div>
                  카톡 독려하기
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* 테이블 영역 */}
      {stats.length > 0 && (
        <div className="mt-12 overflow-hidden rounded-2xl bg-white/[0.02] ring-1 ring-white/10 shadow-2xl">
          <div className="border-b border-white/5 px-6 py-5 bg-white/[0.02]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">가맹점별 상세 관리 현황 <span className="text-[10px] bg-white/5 text-zinc-500 font-bold px-2 py-0.5 rounded-md border border-white/10 tracking-widest uppercase">DETAIL LOG</span></h2>
                <p className="text-[11px] text-zinc-500 mt-1">본사 시스템이 탐지한 전체 가맹점의 리스크 레포트입니다.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="매장명 검색..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="bg-white/5 border border-white/10 text-white text-xs px-4 py-2 rounded-lg outline-none focus:ring-1 focus:ring-violet-500 w-48"
                  />
                </div>
                <select 
                  value={sortOption} 
                  onChange={(e) => setSortOption(e.target.value)} 
                  className="bg-white/5 border border-white/10 text-white text-xs px-3 py-2 rounded-lg outline-none focus:ring-1 focus:ring-violet-500 cursor-pointer appearance-none"
                >
                  <option value="crisis" className="bg-[#1a1c2e]">🚨 위기 매장 우선</option>
                  <option value="ratingDesc" className="bg-[#1a1c2e]">⭐ 평점 높은 순</option>
                  <option value="ratingAsc" className="bg-[#1a1c2e]">⚠️ 평점 낮은 순</option>
                  <option value="reviewsDesc" className="bg-[#1a1c2e]">📈 리뷰 많은 순</option>
                  <option value="nameAsc" className="bg-[#1a1c2e]">가나다순</option>
                </select>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-6 bg-white/[0.03] text-[11px] font-black uppercase tracking-wider text-zinc-500 border-b border-white/5">
            <div className="px-6 py-4">가맹점명</div><div className="px-6 py-4">평균 별점</div><div className="px-6 py-4">리뷰 유입</div><div className="px-6 py-4">전주 대비</div><div className="px-6 py-4">상태 지표</div><div className="px-6 py-4 text-right">상세 정보</div>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {processedStats.map((store) => (
              <Link key={store.id} href={`/dashboard?storeId=${store.id}`} className="grid grid-cols-6 group hover:bg-white/[0.02] transition cursor-pointer items-center no-underline">
                <div className="px-6 py-5"><div className="flex items-center gap-3"><div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs ring-1 ${store.isCrisis ? "bg-rose-500/20 text-rose-400 ring-rose-500/30" : "bg-white/5 text-zinc-400 ring-white/10"}`}>{store.name.charAt(0)}</div><span className="font-bold text-zinc-200">{store.name}</span></div></div>
                <div className="px-6 py-5"><div className="flex items-center gap-1.5"><Star size={14} className="text-amber-400 fill-amber-400" /><span className="text-white font-black text-lg">{store.avgRating}</span></div></div>
                <div className="px-6 py-5 text-zinc-400 font-bold">{store.totalReviews}건</div>
                <div className="px-6 py-5"><div className={`flex items-center gap-1 text-xs font-bold ${parseFloat(store.ratingDiff) > 0 ? "text-rose-400" : "text-emerald-400"}`}>{parseFloat(store.ratingDiff) > 0 ? <><TrendingDown size={14} /> -{store.ratingDiff}</> : <><TrendingUp size={14} /> +{Math.abs(parseFloat(store.ratingDiff))}</>}</div></div>
                <div className="px-6 py-5">{store.isCrisis ? (<div className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/20 px-3 py-1.5 text-[10px] font-black text-rose-400 ring-1 ring-rose-500/30 animate-pulse"><AlertCircle size={10} /> CRISIS</div>) : store.status === 'WARN' ? (<div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1.5 text-[10px] font-black text-amber-400 ring-1 ring-amber-500/30"><AlertCircle size={10} /> WARN</div>) : (<div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1.5 text-[10px] font-black text-emerald-400 ring-1 ring-emerald-500/30"><CheckCircle2 size={10} /> GOOD</div>)}</div>
                <div className="px-6 py-5 text-right"><div className="inline-block rounded-lg bg-white/5 p-2 text-zinc-500 group-hover:bg-violet-500 group-hover:text-white transition active:scale-90"><ChevronRight size={16} /></div></div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 카톡 모달 */}
      {isKakaoModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={() => setIsKakaoModalOpen(false)} />
          <div className="relative w-full max-w-sm rounded-[2rem] bg-[#FEE500] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-3 mb-6"><div className="h-10 w-10 rounded-full bg-zinc-900 flex items-center justify-center shadow-lg"><Send size={20} className="text-[#FEE500] ml-1" /></div><div><h3 className="text-lg font-black text-zinc-900">카카오톡 독려 메시지</h3><p className="text-[10px] text-zinc-700 font-bold">ReviewGuard HQ 정식 지원 기능</p></div></div>
            <textarea
              value={kakaoMessage}
              onChange={(e) => setKakaoMessage(e.target.value)}
              className="w-full h-48 rounded-2xl bg-white/70 p-5 mb-6 text-sm font-bold text-zinc-800 leading-relaxed ring-1 ring-black/5 shadow-inner focus:outline-none focus:ring-2 focus:ring-zinc-900/20 resize-none"
            />
            <div className="flex flex-col gap-2">
              <button onClick={handleKakaoSend} className="w-full py-4 rounded-2xl bg-zinc-900 text-white font-black text-sm hover:bg-zinc-800 transition active:scale-95 shadow-lg">메시지 복사 후 카카오톡 열기</button>
              <button onClick={() => setIsKakaoModalOpen(false)} className="w-full py-4 rounded-2xl bg-black/5 text-zinc-800 font-bold text-sm hover:bg-black/10 transition">취소</button>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 NEW: 하이브리드 초대 발급 모달 (코드 & 링크 듀얼 제공) */}
      {generatedToken && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={() => setGeneratedToken(null)} />
          <div className="relative w-full max-w-xl rounded-[2rem] bg-[#1a1d2b] p-8 shadow-2xl ring-1 ring-white/10 animate-in zoom-in-95 duration-300">
            <button onClick={() => setGeneratedToken(null)} className="absolute top-6 right-6 text-zinc-500 hover:text-white transition"><X size={24} /></button>

            <div className="flex flex-col items-center mb-8 mt-2">
              <div className="h-16 w-16 bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white flex items-center justify-center rounded-2xl mb-4 shadow-lg shadow-violet-500/20 ring-1 ring-white/20">
                <LinkIcon size={32} />
              </div>
              <h3 className="text-2xl font-black text-white tracking-tight">가맹점 연동 코드 발급 완료</h3>
              <p className="text-zinc-400 text-sm mt-2 text-center font-medium">
                점주님의 상황에 맞춰 아래 두 가지 방법 중 하나를 전달해 주세요.
              </p>
            </div>

            <div className="space-y-4">
              {/* 옵션 1: 신규 가입자용 긴 링크 */}
              <div className="bg-white/[0.03] rounded-2xl p-5 ring-1 ring-white/10 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                <p className="text-sm font-bold text-emerald-400 mb-1 flex items-center gap-1.5">상황 1. 아직 리뷰가드 계정이 없는 점주님</p>
                <p className="text-[11px] text-zinc-500 mb-3">링크 클릭 시, 회원가입과 동시에 자동으로 본사 가맹점으로 연동됩니다.</p>
                <div className="flex gap-2">
                  <input readOnly value={`${typeof window !== 'undefined' ? window.location.origin : ''}/onboarding?token=${generatedToken}`} className="flex-1 bg-[#0f1117] text-zinc-400 text-[11px] px-4 py-2.5 rounded-xl outline-none ring-1 ring-white/5 truncate" />
                  <button onClick={() => copyToClipboard(`${typeof window !== 'undefined' ? window.location.origin : ''}/onboarding?token=${generatedToken}`, '✅ 가입용 초대 링크가 복사되었습니다.')} className="bg-emerald-500/20 text-emerald-400 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-emerald-500/30 transition flex items-center gap-1.5 whitespace-nowrap">
                    <Copy size={14} /> 링크 복사
                  </button>
                </div>
              </div>

              {/* 옵션 2: 기존 가입자용 6자리 코드 */}
              <div className="bg-violet-500/5 rounded-2xl p-5 ring-1 ring-violet-500/20 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-violet-500"></div>
                <p className="text-sm font-bold text-violet-400 mb-1 flex items-center gap-1.5">상황 2. 이미 다점포를 운영 중인 점주님</p>
                <p className="text-[11px] text-violet-300/70 mb-3">대시보드 좌측 상단 [새 매장 추가] 팝업에서 아래 6자리 코드를 입력하게 하세요.</p>
                <div className="flex gap-2 items-center">
                  <input readOnly value={generatedToken} className="flex-1 bg-[#0f1117] text-white font-black tracking-[0.2em] text-center text-lg px-4 py-2.5 rounded-xl outline-none ring-1 ring-violet-500/30" />
                  <button onClick={() => copyToClipboard(generatedToken, '✅ 6자리 연동 코드가 복사되었습니다.')} className="bg-violet-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-violet-500 transition flex items-center gap-1.5 whitespace-nowrap shadow-lg shadow-violet-600/20">
                    <Copy size={14} /> 코드 복사
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <MonthlyReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} storeName="전체 가맹점" />
    </div>
  );
}