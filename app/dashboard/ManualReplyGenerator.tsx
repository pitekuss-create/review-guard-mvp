"use client";
import { useStore } from "@/lib/store/useStore";
import { useCallback, useState, useEffect } from "react";
import { getTrialStatus } from "@/lib/trialUtils";
import PaywallModal from "./PaywallModal";

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

export default function ManualReplyGenerator({ storeId }: { storeId: string }) {
  const { userRole, accessibleStores, currentStoreId } = useStore();

  const activeRole = (() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("payment_success") === "true" && params.get("plan")) {
        return params.get("plan")!.toUpperCase();
      }
    }
    return (userRole || "FREE").toUpperCase();
  })();

  const currentStoreData = accessibleStores?.find(s => s.id === currentStoreId);
  const isHqStore = !!((currentStoreData as any)?.organization_id || (currentStoreData as any)?.is_hq_sponsored);

  let isExpired = false;
  if (currentStoreData) {
    const now = new Date();
    if ((currentStoreData as any).trial_start_date) {
      const trialEnd = new Date((currentStoreData as any).trial_start_date);
      trialEnd.setDate(trialEnd.getDate() + 14);
      if (trialEnd < now) isExpired = true;
    }
    if ((currentStoreData as any).subscription_expires_at) {
      const expiry = new Date((currentStoreData as any).subscription_expires_at);
      isExpired = expiry < now;
    }
  }

  const isPaidUser = !isExpired && (["BASIC", "PRO", "ENTERPRISE", "HQ_ADMIN", "SUPER_ADMIN"].includes(activeRole) || isHqStore);
  const [reviewText, setReviewText] = useState("");
  const [loading, setLoading] = useState(false);
  const [replies, setReplies] = useState<AiReplies | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [trialExpired, setTrialExpired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPaywallModal, setShowPaywallModal] = useState(false);

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
      }
    };
    checkTrial();
  }, []);

  const handleGenerate = useCallback(async (e?: React.MouseEvent) => {
    if (isExpired) {
      if (e) e.preventDefault();
      setShowPaywallModal(true);
      return;
    }

    if (!reviewText.trim()) return;

    setLoading(true);
    setReplies(null);

    try {
      const res = await fetch("/api/generate-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewText: reviewText.trim(),
        }),
      });
      const json = await res.json();

      setError(null);
      if (json.replies) {
        setReplies(json.replies);
      } else {
        console.error("AI 답글 생성 실패:", json.error);
        setError("답글 생성에 실패했어요. 다시 시도해 주세요.");
      }
    } catch (err) {
      console.error("AI 답글 요청 오류:", err);
      setError("네트워크 오류가 발생했어요.");
    } finally {
      setLoading(false);
    }
  }, [reviewText]);

  const handleCopy = useCallback(async (text: string, uniqueKey: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(uniqueKey);
      setTimeout(() => setCopiedKey(null), 2000);

      const placeUrl = (currentStoreData as any)?.place_url;
      const rawUrl = placeUrl;
      let finalUrl = "https://new.smartplace.naver.com/reviews/"; // 기본값

      if (rawUrl) {
        // 정규식: place/숫자 또는 restaurant/숫자 형태에서 '숫자'만 완벽하게 추출
        const match = rawUrl.match(/(?:place|restaurant)\/(\d+)/);

        if (match && match[1]) {
          const storeIdNum = match[1];
          finalUrl = `https://m.place.naver.com/restaurant/${storeIdNum}/review/visitor`;
        } else {
          // 숫자 추출 실패 시 (단축 URL 등) 원래 주소로 보냄
          finalUrl = rawUrl;
        }
      }

      window.open(finalUrl, "_blank");
    } catch {
      console.error("클립보드 복사 실패");
    }
  }, [currentStoreData]);

  return (
    <section className="relative rounded-2xl bg-gradient-to-br from-[#1a1d2b] to-[#161822cc] p-6 ring-1 ring-white/[0.06] mb-8">
      {/* Decorative glow */}
      <div className="absolute -left-6 -top-6 h-32 w-32 rounded-full bg-violet-500/8 blur-3xl pointer-events-none" />

      <div className="relative">
        <div className="flex items-center gap-2 mb-1">
          <svg className="h-5 w-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <h2 className="text-base font-semibold text-zinc-200">수동 리뷰 답글 생성기</h2>
        </div>
        <p className="text-xs text-zinc-500 mb-5">
          QR을 통하지 않고 네이버 플레이스에 직접 남겨진 '자연 리뷰'를 여기에 복사해서 붙여넣으세요.
        </p>

        <textarea
          value={reviewText}
          onChange={(e) => {
            setReviewText(e.target.value);
            if (error) setError(null);
          }}
          placeholder="네이버 플레이스에서 복사한 고객 리뷰를 여기에 붙여넣으세요."
          style={{ fieldSizing: 'content' } as any}
          className={`w-full min-h-[128px] h-auto resize-none rounded-xl bg-white/5 px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 outline-none ring-1 transition focus:ring-violet-500/50 focus:bg-white/[0.07] mb-2 ${error ? "ring-rose-500/50" : "ring-white/10"
            }`}
        />

        {error && (
          <p className="mb-4 text-xs font-bold text-rose-400 animate-in fade-in slide-in-from-top-1">
            ⚠️ {error}
          </p>
        )}

        <button
          type="button"
          disabled={loading || !reviewText.trim()}
          onClick={(e) => void handleGenerate(e)}
          className="inline-flex h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-500 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              분석 시스템이 답글 초안을 작성 중...
            </>
          ) : (
            <>
              <span>✨</span> 추천 답글 초안 생성하기
            </>
          )}
        </button>

        {replies && (
          <div className="mt-6 border-t border-white/5 pt-6 animate-[fadeSlideDown_0.25s_ease-out]">
            <div className="grid gap-4 lg:grid-cols-3">
              {TONE_LABELS.map(({ key, label, color }) => {
                const text = replies[key];
                const uniqueKey = `manual-${key}`;
                const isCopied = copiedKey === uniqueKey;

                return (
                  <div
                    key={key}
                    className={`rounded-xl bg-white/[0.03] p-4 ring-1 ring-white/[0.06] transition hover:ring-${color}-500/20 flex flex-col h-auto min-h-full`}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-300">
                        {label}
                      </span>
                    </div>
                    <div className="text-sm leading-relaxed text-zinc-300 flex-1 mb-6 whitespace-pre-wrap min-h-[100px]">
                      {text}
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleCopy(text, uniqueKey)}
                      className={`inline-flex w-full justify-center items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-semibold transition active:scale-[0.98] mt-auto ${isCopied
                        ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30"
                        : "bg-white/5 text-zinc-400 ring-1 ring-white/10 hover:text-zinc-200 hover:bg-white/10"
                        }`}
                    >
                      {isCopied ? (
                        <>
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          복사됨 & 네이버로 이동
                        </>
                      ) : (
                        <>
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          복사하기 & 네이버로 이동
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {showPaywallModal && (
        <PaywallModal
          isOpen={showPaywallModal}
          onClose={() => setShowPaywallModal(false)}
          title={isHqStore ? "🔒 통합 결제 만료" : "🔒 결제 필요"}
          message={isHqStore
            ? "프랜차이즈 통합 결제가 만료되었습니다. 본사 담당자에게 문의해 주세요."
            : "베이직 플랜 전용 기능입니다. 업그레이드하고 모든 기능을 사용해보세요."}
          isHq={isHqStore}
        />
      )}
    </section>
  );
}
