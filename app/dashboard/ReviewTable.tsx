"use client";

import { useCallback, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import PaywallModal from "./PaywallModal";
import { getTrialStatus } from "@/lib/trialUtils";

/* ── 타입 ── */
export type ReviewRow = {
  id: string;
  created_at: string;
  store_id: string;
  rating: number;
  selected_tags: string;
  generated_text: string;
  is_copied: boolean;
};

type AiReplies = {
  friendly: string;
  witty: string;
  professional: string;
};

const TONE_LABELS: { key: keyof AiReplies; label: string; color: string }[] = [
  { key: "friendly", label: "🤗 친절한 톤", color: "emerald" },
  { key: "witty", label: "😄 위트 있는 톤", color: "amber" },
  { key: "professional", label: "💼 전문적인 톤", color: "blue" },
];

/* ── 헬퍼 ── */
function formatDatetime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function renderStars(rating: number) {
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}

/* ── 컴포넌트 ── */
export default function ReviewTable({ 
  storeId,
  reviews, 
  onRefresh 
}: { 
  storeId: string;
  reviews: ReviewRow[];
  onRefresh?: () => Promise<void>;
}) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [repliesMap, setRepliesMap] = useState<Record<string, AiReplies>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [trialExpired, setTrialExpired] = useState(false);
  const [loadingTrial, setLoadingTrial] = useState(true);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  // Check trial status on mount
  useEffect(() => {
    const checkTrial = async () => {
      try {
        const res = await fetch(`/api/store-concept?storeId=${storeId}`);
        const json = await res.json();
        const trialStatus = getTrialStatus(json.trialStartDate || null);
        setTrialExpired(trialStatus.isExpired);
      } catch (error) {
        console.error("Failed to check trial status:", error);
        setTrialExpired(true); // Default to expired on error
      } finally {
        setLoadingTrial(false);
      }
    };
    checkTrial();
  }, []);
  const totalScans = reviews.length;

  /* ── 데이터 새로고침 ── */
  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return;
    
    setIsRefreshing(true);
    setRefreshError(null);
    
    try {
      await onRefresh();
      
      // Visual feedback for 1 second
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (err) {
      console.error("Refresh failed:", err);
      setRefreshError("새로고침 중 오류가 발생했습니다.");
      
      // Clear error after 3 seconds
      setTimeout(() => setRefreshError(null), 3000);
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh]);

  /* ── 추천 답글 생성 ── */
  const handleGenerate = useCallback(async (row: ReviewRow) => {
    // Don't allow action while trial status is loading
    if (loadingTrial) {
      return;
    }

    // Check trial status - allow if within 14-day trial period
    if (trialExpired) {
      setIsPaywallOpen(true);
      return;
    }

    setLoadingId(row.id);
    setExpandedId(row.id);

    try {
      const res = await fetch("/api/generate-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewText: row.generated_text || "",
          rating: row.rating,
          tags: row.selected_tags || "",
        }),
      });
      const json = await res.json();

      if (json.replies) {
        setRepliesMap((prev) => ({ ...prev, [row.id]: json.replies }));
        
        // Show warning if fallback was used
        if (json.fallback) {
          console.warn("[ReviewTable] Using fallback AI replies:", json.message);
        }
      } else {
        console.error("AI reply generation failed:", json.error);
      }
    } catch (err) {
      console.error("추천 답글 요청 오류:", err);
    } finally {
      setLoadingId(null);
    }
  }, [trialExpired, loadingTrial, repliesMap]);

  /* ── 복사 + 네이버 스마트플레이스 열기 ── */
  const handleCopy = useCallback(async (text: string, uniqueKey: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(uniqueKey);
      setTimeout(() => setCopiedKey(null), 2000);
      window.open("https://new.smartplace.naver.com/reviews/", "_blank");
    } catch {
      console.error("클립보드 복사 실패");
    }
  }, []);

  return (
    <section className="rounded-2xl bg-[#1a1d2b]/60 ring-1 ring-white/[0.06] overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-zinc-200">리뷰 로그</h2>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing || !onRefresh}
            className="text-zinc-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-wait relative group"
            title="새로고침"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            
            {refreshError && (
              <span className="absolute left-full ml-2 whitespace-nowrap rounded bg-rose-500/90 px-2 py-1 text-[10px] font-bold text-white shadow-lg animate-in fade-in slide-in-from-left-1">
                {refreshError}
              </span>
            )}
          </button>
        </div>
        <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-zinc-400 ring-1 ring-white/10">
          최신순 · {totalScans}건
        </span>
      </div>

      {totalScans === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
          <svg className="mb-4 h-12 w-12 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="text-sm font-medium">아직 쌓인 데이터가 없어요</p>
          <p className="mt-1 text-xs text-zinc-600">
            고객이 QR을 스캔하면 여기에 로그가 표시됩니다.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/5 text-xs font-medium uppercase tracking-wider text-zinc-500">
                <th className="whitespace-nowrap px-6 py-3">날짜</th>
                <th className="whitespace-nowrap px-6 py-3">별점</th>
                <th className="whitespace-nowrap px-6 py-3">선택 키워드</th>
                <th className="whitespace-nowrap px-6 py-3 text-center">복사 여부</th>
                <th className="whitespace-nowrap px-6 py-3 text-center">추천 답글</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {reviews.map((row) => {
                const isExpanded = expandedId === row.id;
                const isLoading = loadingId === row.id;
                const replies = repliesMap[row.id];
                const isNegative = row.rating <= 3;

                return (
                  <tr key={row.id} className="group">
                    <td colSpan={5} className="p-0">
                      {/* 메인 행 */}
                      <div className={`flex items-center transition hover:bg-white/[0.02] ${isExpanded ? "bg-white/[0.02]" : ""}`}>
                        {/* 날짜 */}
                        <div className="whitespace-nowrap px-6 py-4 text-zinc-300 font-mono text-xs flex-shrink-0" style={{ width: "180px" }}>
                          {formatDatetime(row.created_at)}
                        </div>

                        {/* 별점 */}
                        <div className="whitespace-nowrap px-6 py-4 flex-shrink-0" style={{ width: "150px" }}>
                          <span
                            className={`text-sm tracking-wide ${
                              row.rating >= 4
                                ? "text-amber-400"
                                : row.rating >= 3
                                  ? "text-amber-500/70"
                                  : "text-rose-400"
                            }`}
                          >
                            {renderStars(row.rating)}
                          </span>
                        </div>

                        {/* 키워드 */}
                        <div className="px-6 py-4 flex-1 min-w-0">
                          {row.selected_tags ? (
                            <div className="flex flex-wrap gap-1.5">
                              {row.selected_tags.split(",").map((tag) => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center rounded-md bg-white/5 px-2 py-0.5 text-xs font-medium text-zinc-300 ring-1 ring-white/10"
                                >
                                  {tag.trim()}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-zinc-600">—</span>
                          )}
                        </div>

                        {/* 복사 여부 */}
                        <div className="whitespace-nowrap px-6 py-4 text-center flex-shrink-0" style={{ width: "100px" }}>
                          {row.is_copied ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/20">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                              O
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-500/10 px-2.5 py-0.5 text-xs font-semibold text-zinc-500 ring-1 ring-zinc-500/20">
                              <span className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
                              X
                            </span>
                          )}
                        </div>

                        {/* AI 답글 / 불만 보기 버튼 */}
                        <div className="whitespace-nowrap px-6 py-4 text-center flex-shrink-0" style={{ width: "140px" }}>
                          {isNegative ? (
                            <button
                              type="button"
                              onClick={() => setExpandedId((prev) => (prev === row.id ? null : row.id))}
                              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition active:scale-[0.97] ${
                                isExpanded
                                  ? "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30"
                                  : "bg-white/5 text-zinc-400 ring-1 ring-white/10 hover:bg-rose-500/10 hover:text-rose-300 hover:ring-rose-500/20"
                              }`}
                            >
                              {isExpanded ? (
                                <><span>▲</span> 닫기</>
                              ) : (
                                <><span>🔒</span> 불만 보기</>
                              )}
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={loadingId === row.id || loadingTrial}
                              onClick={() => void handleGenerate(row)}
                              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition active:scale-[0.97] ${
                                isExpanded && replies
                                  ? "bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/30"
                                  : "bg-white/5 text-zinc-400 ring-1 ring-white/10 hover:bg-violet-500/10 hover:text-violet-300 hover:ring-violet-500/20"
                              } disabled:opacity-40 disabled:cursor-not-allowed`}
                            >
                              {isLoading || loadingTrial ? (
                                <>
                                  <span className="h-3 w-3 animate-spin rounded-full border-[1.5px] border-zinc-500 border-t-violet-400" />
                                  {loadingTrial ? '로딩 중…' : '생성 중…'}
                                </>
                              ) : isExpanded && replies ? (
                                <>
                                  <span>▲</span> 접기
                                </>
                              ) : (
                                <>
                                  <span>✨</span> 추천 답글
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* 아코디언 패널 */}
                      {isExpanded && (
                        <div className="border-t border-white/5 bg-[#12141e] px-6 py-5 animate-[fadeSlideDown_0.25s_ease-out]">
                          {isNegative ? (
                            <div className="rounded-xl bg-gradient-to-r from-rose-500/5 to-transparent p-5 ring-1 ring-rose-500/20">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="inline-flex rounded-md bg-rose-500/20 px-2.5 py-1 text-xs font-bold text-rose-400 ring-1 ring-rose-500/30">
                                  🔒 비공개 피드백
                                </span>
                                <span className="text-sm font-semibold text-zinc-400">네이버로 전송되지 않은 안전한 방어 건입니다.</span>
                              </div>
                              <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed bg-[#1a1d2b] p-4 rounded-lg ring-1 ring-white/5">
                                {row.generated_text?.replace("사장님께 조용히 건의됨 (부정 리뷰 방어건)", "").replace("상세 내용:", "").trim() || "추가 불만사항 텍스트가 없습니다."}
                              </p>
                            </div>
                          ) : (isLoading || loadingTrial) && !replies ? (
                            <div className="flex items-center gap-3 py-6 justify-center">
                              <span className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-violet-400" />
                              <span className="text-sm text-zinc-400">
                                분석 시스템이 답글을 작성하고 있어요...
                              </span>
                            </div>
                          ) : replies ? (
                            <div className="grid gap-4 lg:grid-cols-3">
                              {TONE_LABELS.map(({ key, label, color }) => {
                                const text = replies[key];
                                const uniqueKey = `${row.id}-${key}`;
                                const isCopied = copiedKey === uniqueKey;

                                return (
                                  <div
                                    key={key}
                                    className={`rounded-xl bg-white/[0.03] p-4 ring-1 ring-white/[0.06] transition hover:ring-${color}-500/20`}
                                  >
                                    <div className="mb-2 flex items-center justify-between">
                                      <span className="text-xs font-semibold text-zinc-300">
                                        {label}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => void handleCopy(text, uniqueKey)}
                                        className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition active:scale-95 ${
                                          isCopied
                                            ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30"
                                            : "bg-white/5 text-zinc-500 ring-1 ring-white/10 hover:text-zinc-300 hover:bg-white/10"
                                        }`}
                                      >
                                        {isCopied ? (
                                          <>
                                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                            복사됨
                                          </>
                                        ) : (
                                          <>
                                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                            복사하기
                                          </>
                                        )}
                                      </button>
                                    </div>
                                    <p className="text-sm leading-relaxed text-zinc-300">
                                      {text}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          ) : null}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 페이월 모달 */}
      <PaywallModal isOpen={isPaywallOpen} onClose={() => setIsPaywallOpen(false)} />
    </section>
  );
}
