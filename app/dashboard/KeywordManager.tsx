"use client";

import { useCallback, useEffect, useState } from "react";
import { getTrialStatus } from "@/lib/trialUtils";
import { useStore } from "@/lib/store/useStore";
import PaywallOverlay from "./PaywallOverlay";

export default function KeywordManager() {
  const { currentStoreId, userRole } = useStore();

  // 🚀 [핀셋 수술 1]: 주소창을 먼저 읽어서 결제 즉시 잠금을 푸는 무적 방어막!
  const activeRole = (() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("payment_success") === "true" && params.get("plan")) {
        return params.get("plan")!.toUpperCase();
      }
    }
    return (userRole || "FREE").toUpperCase();
  })();

  // 돈 낸 유저인지 판별
  const isPaidUser = ["BASIC", "PRO", "ENTERPRISE", "HQ_ADMIN", "SUPER_ADMIN"].includes(activeRole);

  const [concept, setConcept] = useState("");
  const [saved, setSaved] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  /* 데이터 추출을 위한 State */
  const [storeName, setStoreName] = useState("");
  const [savedStoreName, setSavedStoreName] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [trialExpired, setTrialExpired] = useState(false);

  /* ── 초기 로드 ── */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const url = currentStoreId
          ? `/api/keywords?storeId=${currentStoreId}`
          : "/api/keywords";

        const res = await fetch(url);

        if (!res.ok) {
          console.error(`API Error: ${res.status} ${res.statusText}`);
          return;
        }

        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          console.error("Invalid Content-Type received");
          return;
        }

        const json = await res.json();
        setConcept(json.concept ?? "");
        setSaved(json.concept ?? "");

        // 트라이얼 상태 체크
        const trialStatus = getTrialStatus(json.trialStartDate || null);
        setTrialExpired(json.trialStartDate ? trialStatus.isExpired : false);

        if (json.storeName) {
          setStoreName(json.storeName);
          setSavedStoreName(json.storeName);
        }
      } catch (err) {
        console.error("concept load error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [currentStoreId]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  /* ── 통합 저장 (키워드 + 매장 컨텍스트) ── */
  const handleSave = useCallback(async (keywordsToSave: string = concept, currentName: string = storeName) => {
    setSaving(true);
    try {
      const res = await fetch("/api/keywords", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: currentStoreId,
          concept: keywordsToSave,
          name: currentName
        }),
      });

      if (!res.ok) throw new Error("서버 응답 오류");

      const json = await res.json();
      if (json.success) {
        setSaved(keywordsToSave);
        setConcept(keywordsToSave);
        setSavedStoreName(currentName);
        setStoreName(currentName);
        showToast("데이터가 성공적으로 저장되었습니다 ✓");
      } else {
        showToast("저장 실패: " + (json.error ?? "알 수 없는 오류"));
      }
    } catch (err) {
      console.error("[Save Error]:", err);
      showToast("저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }, [currentStoreId, concept, storeName, showToast]);

  /* ── 데이터 기반 타겟 키워드 추출 ── */
  const handleExtract = useCallback(async () => {
    const trimmedName = storeName.trim();
    if (!trimmedName) {
      alert("매장 상호명을 입력해 주세요.");
      return;
    }

    if (trimmedName.length <= 2) {
      showToast("상호명과 지역/지점명을 구체적으로 입력해 주세요.");
      return;
    }

    setExtracting(true);
    try {
      const res = await fetch("/api/extract-keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeName: trimmedName }),
      });

      if (!res.ok) throw new Error("추출 서버 응답 오류");

      const json = await res.json();
      if (json.keywords) {
        // 추출 성공 시 우선 UI 업데이트
        setConcept(json.keywords);

        // 추출된 결과를 DB에도 즉시 반영 (매장명 컨텍스트 포함)
        await handleSave(json.keywords, trimmedName);

        showToast("✨ 분석 시스템이 매장명을 바탕으로 키워드를 추출하고 저장했습니다!");
      } else {
        alert("키워드 추출 실패: " + (json.error ?? "알 수 없는 오류"));
      }
    } catch (err: any) {
      console.error("[Extract Error]:", err);
      alert(err.message || "키워드 추출 중 오류가 발생했습니다.");
    } finally {
      setExtracting(false);
    }
  }, [storeName, handleSave, showToast]);

  const isDirty = (concept !== saved) || (storeName !== savedStoreName);

  return (
    <section className="relative rounded-2xl bg-gradient-to-br from-[#1a1d2b] to-[#161822cc] p-6 ring-1 ring-white/[0.06] mb-8">
      {/* 장식 glow */}
      <div className="absolute -left-6 -top-6 h-32 w-32 rounded-full bg-violet-500/8 blur-3xl pointer-events-none" />

      <div className="relative">
        {/* 헤더 */}
        <div className="flex items-center gap-2 mb-1">
          <svg className="h-5 w-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <h2 className="text-base font-semibold text-zinc-200">
            매장 타겟 키워드 설정
          </h2>
        </div>
        <p className="text-xs text-zinc-500 mb-6">
          이 키워드는 고객의 QR 리뷰 화면에 노출되어 리뷰 생성에 활용됩니다.
        </p>

        {loading ? (
          <div className="flex items-center gap-2 py-8 text-sm text-zinc-500">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-600 border-t-violet-400" />
            데이터 로드 중...
          </div>
        ) : (
          <>
            {/* ---- [Group A] Keyword Settings ---- */}
            <div className="mb-8 rounded-xl bg-violet-500/5 p-5 ring-1 ring-violet-500/20 space-y-5 relative">
              {/* 🚀 [핀셋 수술 3]: 14일이 지났더라도, 결제를 한 유저(!isPaidUser)라면 절대 자물쇠를 채우지 마라! */}
              {(trialExpired && !isPaidUser) && (
                <PaywallOverlay
                  title="🔒 베이직 플랜 전용 기능"
                  description="14일 무료 체험이 종료되었습니다. 계속해서 고도화 분석 기능을 이용하시려면 베이직 플랜을 구독해 주세요."
                />
              )}
              <label className="flex items-center gap-1.5 text-xs font-semibold text-violet-300">
                <span>✨</span> 데이터 기반 타겟 키워드 추출 및 설정
              </label>

              {/* Row 1: 상호명 입력 + 추출 버튼 */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  id="store-name-input"
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="매장명과 핵심 업종 (예: 다운타우너 안국점 / 수제버거)"
                  className="flex-1 rounded-lg bg-white/5 px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 outline-none ring-1 ring-white/10 transition focus:ring-violet-500/50 focus:bg-white/[0.07]"
                />
                <button
                  type="button"
                  disabled={extracting || !storeName.trim()}
                  onClick={() => void handleExtract()}
                  className="inline-flex h-[42px] items-center justify-center gap-2 rounded-lg bg-violet-600 px-5 text-sm font-semibold text-white shadow-md shadow-violet-600/20 transition hover:bg-violet-500 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none whitespace-nowrap"
                >
                  {extracting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      분석 중...
                    </>
                  ) : (
                    "키워드 자동 생성"
                  )}
                </button>
              </div>

              {/* Row 2: 안내 문구 */}
              <div className="space-y-1.5 rounded-lg bg-violet-500/10 p-3 ring-1 ring-violet-500/20">
                <p className="text-[12px] font-medium text-violet-200 leading-relaxed">
                  💡 <strong className="font-bold text-white">정확한 분석을 위해</strong> '매장명'과 '핵심 업종(또는 대표메뉴)'을 함께 적어주세요.
                </p>
                <p className="text-[12px] font-medium text-violet-200 leading-relaxed">
                  💡 <strong className="font-bold text-white">분석 시스템이 제안한 핵심 키워드는 매장 상황에 맞게 언제든 클릭하여 수정하고 다시 저장할 수 있습니다.</strong>
                </p>
              </div>

              {/* Row 3: 직접 수정 + 저장 버튼 */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center pt-2">
                <input
                  id="concept-input"
                  type="text"
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                  placeholder="예: 가성비 맛집, 분위기 좋은 카페, 수제버거"
                  className="flex-1 rounded-lg bg-white/5 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none ring-1 ring-white/10 transition focus:ring-violet-500/50 focus:bg-white/[0.07]"
                />
                <button
                  type="button"
                  disabled={saving || !isDirty}
                  onClick={() => void handleSave()}
                  className="inline-flex h-[42px] items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-500 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {saving && isDirty ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      저장 중...
                    </>
                  ) : (
                    "저장하기"
                  )}
                </button>
              </div>

              {/* 현재 저장 미리보기 뱃지 */}
              {saved && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {saved.split(",").map((kw) => {
                    const trimmed = kw.trim();
                    if (!trimmed) return null;
                    return (
                      <span
                        key={trimmed}
                        className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-300 ring-1 ring-violet-500/30"
                      >
                        <span className="text-violet-400">✨</span>
                        {trimmed}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

          </>
        )}
      </div>

      {/* 토스트 (글로벌 우측 상단 픽스 확인) */}
      {toast && (
        <div
          className="fixed left-1/2 -translate-x-1/2 top-4 sm:left-auto sm:translate-x-0 sm:top-6 sm:right-6 z-[9999] animate-[fadeSlideDown_0.3s_ease-out] rounded-xl bg-emerald-500/95 px-6 py-4 text-sm font-bold text-white shadow-[0_10px_40px_rgba(16,185,129,0.3)] backdrop-blur-md ring-1 ring-white/20 flex flex-col items-center sm:items-end w-max"
        >
          <div className="flex items-center gap-2">
            <span>✅</span>
            {toast}
          </div>
        </div>
      )}
    </section>
  );
}
