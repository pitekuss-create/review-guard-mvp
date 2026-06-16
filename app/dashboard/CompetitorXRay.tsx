"use client";

import { useState } from "react";
import { Store, Zap, Sparkles, MapPin, BarChart2, AlertCircle, Utensils, Map, FileText } from "lucide-react";

interface KeywordWithVolume {
    keyword: string;
    monthlySearchVolume: number;
}

interface AnalysisResult {
    keywords: KeywordWithVolume[];
    rationale: string;
}

function formatSearchVolume(volume: number): string {
    if (volume >= 10000) return `${(volume / 10000).toFixed(1)}만`;
    if (volume >= 1000) return `${(volume / 1000).toFixed(1)}천`;
    return volume.toLocaleString();
}

function getVolumeBadgeStyle(volume: number) {
    if (volume >= 10000) return { bg: "bg-rose-500/15", text: "text-rose-400", ring: "ring-rose-500/30" };
    if (volume >= 3000) return { bg: "bg-amber-500/15", text: "text-amber-400", ring: "ring-amber-500/30" };
    if (volume >= 500) return { bg: "bg-emerald-500/15", text: "text-emerald-400", ring: "ring-emerald-500/30" };
    return { bg: "bg-zinc-500/10", text: "text-zinc-400", ring: "ring-zinc-500/20" };
}

export default function CompetitorXRay({ isDemoMode }: { isDemoMode?: boolean }) {
    const [region, setRegion] = useState("");
    const [storeName, setStoreName] = useState("");
    const [menu, setMenu] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [result, setResult] = useState<AnalysisResult | null>(null);

    const isFormValid = region.trim().length > 0 && storeName.trim().length > 0 && menu.trim().length > 0;

    const handleAnalyze = async () => {
        if (!isFormValid || isAnalyzing) return;
        setIsAnalyzing(true);
        setErrorMsg("");
        setResult(null);

        try {
            const res = await fetch("/api/competitor/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    region: region.trim(),
                    storeName: storeName.trim(), 
                    menu: menu.trim() 
                }),
            });

            const data = await res.json();

            if (data.success) {
                setResult({ keywords: data.targetKeywords ?? [], rationale: data.rationale ?? "" });
            } else {
                setErrorMsg(data.message || "분석에 실패했습니다. 잠시 후 다시 시도해 주세요.");
            }
        } catch {
            setErrorMsg("서버 통신 중 오류가 발생했습니다.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && isFormValid && !isAnalyzing) handleAnalyze();
    };

    return (
        <div className="mt-8 rounded-[2rem] bg-gradient-to-br from-[#12141c] to-[#1a1124] p-8 ring-1 ring-violet-500/30 shadow-2xl relative overflow-hidden border border-white/5">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none"><Zap size={200} /></div>

            <div className="relative z-10 mb-8">
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <Zap className="text-violet-400" size={24} />
                    경쟁사 타겟 키워드 분석기
                    <span className="ml-2 text-[10px] bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-2 py-0.5 rounded border border-white/20 shadow-lg">PRO 전용</span>
                </h2>
                <p className="text-sm text-zinc-400 mt-2">
                    상권, 매장명, <span className="text-violet-300 font-semibold">핵심 메뉴</span>를 입력하면,
                    AI가 최적의 키워드를 생성하고 <strong>네이버 공식 실검색량 데이터</strong>로 검증합니다.
                </p>
            </div>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Form & Keyword Results */}
                <div className={`flex flex-col gap-6 ${result ? 'lg:col-span-7' : 'lg:col-span-12'} transition-all duration-500`}>
                    {/* Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest pl-1">상권/지역명</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Map size={15} className="text-zinc-500" /></div>
                                <input
                                    type="text" value={region}
                                    onChange={(e) => setRegion(e.target.value)} onKeyDown={handleKeyDown}
                                    placeholder="예: 안국역, 제주도"
                                    className="w-full bg-[#0f111a] border border-white/10 rounded-xl py-3.5 pl-10 pr-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest pl-1">경쟁사 매장명</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Store size={15} className="text-zinc-500" /></div>
                                <input
                                    type="text" value={storeName}
                                    onChange={(e) => setStoreName(e.target.value)} onKeyDown={handleKeyDown}
                                    placeholder="예: 도토리가든"
                                    className="w-full bg-[#0f111a] border border-white/10 rounded-xl py-3.5 pl-10 pr-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-violet-400 uppercase tracking-widest pl-1 flex items-center gap-1">
                                <AlertCircle size={10} /> 핵심 판매 메뉴
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Utensils size={15} className="text-violet-400/70" /></div>
                                <input
                                    type="text" value={menu}
                                    onChange={(e) => setMenu(e.target.value)} onKeyDown={handleKeyDown}
                                    placeholder="예: 마들렌, 소금빵"
                                    className="w-full bg-[#0f111a] border border-violet-500/30 rounded-xl py-3.5 pl-10 pr-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleAnalyze} disabled={!isFormValid || isAnalyzing}
                            className="px-8 py-3.5 bg-violet-600 text-white text-sm font-black rounded-xl hover:bg-violet-500 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[200px] justify-center"
                        >
                            {isAnalyzing ? (
                                <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />분석 중...</>
                            ) : (
                                <><Sparkles size={15} />키워드 + 검색량 분석</>
                            )}
                        </button>
                        {isAnalyzing && (
                            <p className="text-xs text-zinc-500 animate-pulse">
                                AI 리포트 생성 → 네이버 실검색량 검증 중 (약 5~10초)
                            </p>
                        )}
                    </div>

                    {errorMsg && (
                        <p className="text-xs font-bold text-rose-400 pl-1 flex items-center gap-1.5">
                            <AlertCircle size={12} />{errorMsg}
                        </p>
                    )}

                    {/* Keywords Result */}
                    {result && (
                        <div className="mt-4 pt-6 border-t border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-sm font-black text-white flex items-center gap-2">
                                    <BarChart2 size={16} className="text-emerald-400" />
                                    네이버 실검색량 데이터 검증
                                    <span className="text-[11px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded ring-1 ring-emerald-500/30">
                                        Top {result.keywords.length}
                                    </span>
                                </h3>
                                <span className="text-[10px] text-zinc-600">출처: 네이버 API · 월간</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                                {result.keywords.length > 0 ? result.keywords.map((item, idx) => {
                                    const style = getVolumeBadgeStyle(item.monthlySearchVolume);
                                    return (
                                        <div key={idx} className="flex items-center justify-between bg-white/[0.03] rounded-xl px-4 py-3.5 ring-1 ring-white/8 hover:ring-violet-500/30 transition group">
                                            <div className="flex items-center gap-2.5">
                                                <span className="text-[10px] font-black text-zinc-600 w-4">{idx + 1}</span>
                                                <span className="text-sm font-bold text-white group-hover:text-violet-300 transition break-all">#{item.keyword}</span>
                                            </div>
                                            <span className={`text-[11px] font-black px-2.5 py-1 rounded-lg ring-1 ${style.bg} ${style.text} ${style.ring} shrink-0 ml-2`}>
                                                월 {formatSearchVolume(item.monthlySearchVolume)}건
                                            </span>
                                        </div>
                                    );
                                }) : (
                                    <div className="col-span-full text-sm text-zinc-500 text-center py-4">검색량이 확인된 키워드가 없습니다.</div>
                                )}
                            </div>
                            
                            <div className="flex flex-wrap gap-2.5">
                                {[
                                    { label: "1만+ · 고경쟁", cls: "text-rose-400 bg-rose-500/10 ring-rose-500/20" },
                                    { label: "3천~1만 · 중경쟁", cls: "text-amber-400 bg-amber-500/10 ring-amber-500/20" },
                                    { label: "500~3천 · 공략 적합 ★", cls: "text-emerald-400 bg-emerald-500/10 ring-emerald-500/20" },
                                    { label: "500 미만 · 틈새", cls: "text-zinc-400 bg-zinc-500/10 ring-zinc-500/20" },
                                ].map((b) => (
                                    <span key={b.label} className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ring-1 ${b.cls}`}>{b.label}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: AI Report */}
                {result && result.rationale && (
                    <div className="lg:col-span-5 h-full animate-in fade-in slide-in-from-right-8 duration-700">
                        <div className="h-full rounded-2xl bg-gradient-to-b from-[#181a25] to-[#12141c] p-6 ring-1 ring-violet-500/20 shadow-2xl relative overflow-hidden flex flex-col min-h-[300px]">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 blur-3xl rounded-full" />
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-fuchsia-500/10 blur-2xl rounded-full" />
                            
                            <div className="relative z-10 flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                                <div className="p-2 bg-violet-500/20 rounded-lg ring-1 ring-violet-500/30 shadow-inner">
                                    <FileText size={20} className="text-violet-400" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-white">상권 & 경쟁 분석 리포트</h3>
                                    <p className="text-[10px] text-zinc-400 mt-0.5">AI 컨설팅 결과</p>
                                </div>
                            </div>

                            <div className="relative z-10 flex-1 overflow-y-auto pr-2 space-y-1">
                                {result.rationale.split('\n').map((line, i) => {
                                    if (line.trim().startsWith('[') && line.trim().endsWith(']')) {
                                        return (
                                            <h4 key={i} className="mt-5 first:mt-0 mb-3 font-bold text-violet-300 text-[13px] flex items-center gap-2 bg-violet-500/10 w-fit px-3 py-1.5 rounded-md ring-1 ring-violet-500/20">
                                                {line.trim().slice(1, -1)}
                                            </h4>
                                        );
                                    }
                                    return line.trim() ? (
                                        <p key={i} className="text-[13px] text-zinc-300 leading-relaxed mb-2 pl-1">
                                            {line}
                                        </p>
                                    ) : null;
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}