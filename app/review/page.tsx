"use client";

import { Suspense, useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  insertReviewLog,
  markReviewLogCopied,
} from "@/lib/reviewsLog";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { getTrialStatus } from "@/lib/trialUtils";
import Footer from "@/app/components/Footer";

export const dynamic = "force-dynamic";

const TEST_TYPE = 1;
const MAX_TAGS = 3;

const NEGATIVE_TAGS = [
  "대기시간이 길어요",
  "불친절해요",
  "위생이 아쉬워요",
  "맛이 아쉬워요"
];

function isPositiveRating(rating: number): boolean {
  return rating >= 4;
}

function buildSelectedTagsCsv(tags: string[]): string {
  return tags.join(",");
}

/* ── 랜딩 페이지 (storeId 없고 로그인 안 된 경우) ── */
function LandingPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ReviewGuard</h1>
          <p className="text-gray-600 mb-8">스마트한 리뷰 관리 솔루션</p>
          <button
            onClick={() => router.push('/login')}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            사장님 로그인
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
}

/* ── 메인 리뷰 폼 (storeId 있는 경우 - 로그인 여부 무관) ── */
function ReviewForm() {
  const searchParams = useSearchParams();
  const storeId = searchParams.get("storeId");
  const [language, setLanguage] = useState<'ko' | 'en'>('ko');

  const content = {
    ko: {
      header: { guide: "리뷰 가이드", title: "네이버 리뷰 문구 만들기", subtitle: "방문해 주셔서 감사합니다. 별점을 선택하고 키워드를 골라주세요." },
      rating: { title: "1. 별점을 선택해 주세요", desc: "4~5점은 네이버 리뷰 작성으로, 1~3점은 사장님 건의함으로 연결됩니다.", positivePlaceholder: "🥰 좋았던 점을 골라 주세요", negativePlaceholder: "🥹 아쉬웠던 부분을 편하게 알려주세요" },
      keywords: { title: "2. 키워드 터치", desc: "해당되는 항목을 터치해주세요.", maxWarning: "원활한 시스템 처리를 위해 최대 3개까지만 선택해 주세요", empty: "등록된 키워드가 없습니다.", loading: "매장 키워드를 불러오고 있습니다..." },
      negative: { apology: "고객님, 만족스럽게 해드리지 못해 정말 죄송합니다. 소중한 의견을 남겨주시면 사장님께 직접 전달하여 즉각 개선되도록 최선을 다하겠습니다.", detailLabel: "상세 불만사항 (선택)", detailPlaceholder: "여기에 불편하셨던 점을 상세히 적어주시면 매장 개선에 큰 도움이 됩니다.", submit: "사장님께 불만사항 전달하기", submitting: "전달 중..." },
      generate: { button: "리뷰 텍스트 1초만에 생성하기", generating: "AI가 리뷰를 작성 중...", limitReached: "하루 최대 3번까지만 생성할 수 있습니다.", disclaimer: "AI가 작성한 초안은 고객님의 실제 경험에 맞게 언제든 수정 및 편집이 가능합니다." },
      result: { title: "생성된 리뷰 문구", desc: "AI가 작성한 맞춤형 리뷰입니다. 아래 초록색 버튼을 눌러 바로 복사 후 네이버 플레이스에 손쉽게 붙여넣기 하세요!", copyButton: "복사하고 네이버로 바로 이동 🚀", copying: "처리 중…", pasteHint: "네이버 리뷰 페이지가 열리면 입력창을 길게 눌러 붙여넣기 해주세요!" },
      errors: { noNaverUrl: "사장님이 아직 매장 네이버 주소를 등록하지 않았습니다.", copyFail: "클립보드 복사에 실패했습니다. 권한을 확인해주세요.", networkError: "네트워크 오류가 발생했어요.", generateFail: "리뷰 생성에 실패했어요. 다시 시도해 주세요.", submitFail: "처리 중 오류가 발생했습니다.", silentSubmitSuccess: "다시 한번 너무 죄송합니다 고객님. 꼭 개선할 수 있도록 최선을 다하겠습니다." },
      invalidQr: { title: "잘못된 QR코드입니다", message: "유효하지 않은 접속 경로입니다. 매장에 비치된 QR코드를 다시 스캔해 주세요." },
      expired: { title: "서비스 기간 만료", message: "해당 매장의 ReviewGuard 서비스 기간이 만료되었습니다.", subMessage: "사장님께 문의해 주세요." }
    },
    en: {
      header: { guide: "Review Guide", title: "Create Naver Review", subtitle: "Thank you for visiting. Please select a rating and choose keywords." },
      rating: { title: "1. Select Rating", desc: "4-5 stars: Write Naver review, 1-3 stars: Send feedback to owner.", positivePlaceholder: "🥰 What did you like?", negativePlaceholder: "🥹 Please share what was disappointing." },
      keywords: { title: "2. Touch Keywords", desc: "Tap applicable items.", maxWarning: "Please select up to 3 items for smooth processing.", empty: "No keywords registered.", loading: "Loading store keywords..." },
      negative: { apology: "We're truly sorry we couldn't satisfy you. Please leave your feedback and we'll deliver it directly to the owner for immediate improvement.", detailLabel: "Detailed Complaint (Optional)", detailPlaceholder: "Please describe your inconvenience in detail here to help us improve.", submit: "Send feedback to owner", submitting: "Sending..." },
      generate: { button: "Generate review in 1 second", generating: "AI is writing your review...", limitReached: "Maximum 3 generations per day.", disclaimer: "You can modify and edit the AI-generated draft at any time to reflect your actual experience." },
      result: { title: "Generated Review", desc: "AI has created a customized review. Press the green button to copy and easily paste it to Naver Place!", copyButton: "Copy & Go to Naver 🚀", copying: "Processing…", pasteHint: "When Naver review page opens, long-press the input field to paste!" },
      errors: { noNaverUrl: "The owner hasn't registered the store's Naver address yet.", copyFail: "Failed to copy to clipboard. Please check permissions.", networkError: "Network error occurred.", generateFail: "Failed to generate review. Please try again.", submitFail: "An error occurred while processing.", silentSubmitSuccess: "We sincerely apologize. We'll do our best to improve." },
      invalidQr: { title: "Invalid QR Code", message: "Invalid access path. Please rescan the QR code at the store." },
      expired: { title: "Service Expired", message: "This store's ReviewGuard service period has expired.", subMessage: "Please contact the store owner." }
    }
  };

  const [rating, setRating] = useState<number | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [complaintText, setComplaintText] = useState("");
  const [generatedText, setGeneratedText] = useState<string | null>(null);
  const [generatedRowId, setGeneratedRowId] = useState<string | null>(null);
  const [copyBusy, setCopyBusy] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [generateCount, setGenerateCount] = useState<number>(0);
  const [placeUrl, setPlaceUrl] = useState<string | null>(null);
  const [trialExpired, setTrialExpired] = useState(false);
  const [loadingTrial, setLoadingTrial] = useState(true);
  const [dynamicTags, setDynamicTags] = useState<string[]>([]);
  const [tagsLoading, setTagsLoading] = useState(true);

  // 텍스트 에어리어 자동 높이 조절을 위한 Ref
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 생성된 텍스트가 변경될 때마다 높이 자동 조절
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [generatedText]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("review_generation_data");
      if (stored) {
        const parsed = JSON.parse(stored);
        const now = Date.now();
        if (now - parsed.timestamp > 86400000) {
          localStorage.removeItem("review_generation_data");
          setGenerateCount(0);
        } else {
          setGenerateCount(parsed.count || 0);
        }
      }
    } catch (e) {
      console.error("Local storage error:", e);
    }
  }, []);

  useEffect(() => {
    if (!storeId) {
      setTagsLoading(false);
      setLoadingTrial(false);
      return;
    }

    (async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase
          .from("stores")
          .select("concept, place_url, trial_start_date")
          .eq("id", storeId)
          .single();

        if (!error && data) {
          const trialStatus = getTrialStatus(data.trial_start_date);
          setTrialExpired(trialStatus.isExpired);
          setLoadingTrial(false);

          try {
            await fetch("/api/increment-qr-scan", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ storeId }),
            });
          } catch (err) {
            console.error("Failed to increment QR scan count:", err);
          }

          if (data.concept) {
            const tags = (data.concept as string)
              .split(",")
              .map((t: string) => t.trim())
              .filter(Boolean);
            setDynamicTags(tags);
          }

          if (data.place_url) {
            setPlaceUrl(data.place_url);
          }
        }
      } catch (err) {
        console.error("DB data load failed:", err);
      } finally {
        setTagsLoading(false);
      }
    })();
  }, [storeId]);

  const sentimentPositive = rating !== null && isPositiveRating(rating);

  const keywordPool = useMemo(() => {
    if (rating === null) return [];
    if (!sentimentPositive) return NEGATIVE_TAGS;
    return dynamicTags;
  }, [rating, sentimentPositive, dynamicTags]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const toggleTag = useCallback(
    (tag: string) => {
      setSelectedTags((prev) => {
        if (prev.includes(tag)) {
          return prev.filter((t) => t !== tag);
        }
        if (prev.length >= MAX_TAGS) {
          showToast(content[language].keywords.maxWarning);
          return prev;
        }
        return [...prev, tag];
      });
    },
    [showToast, language, content]
  );

  const handleRating = useCallback((value: number) => {
    setRating(value);
    setSelectedTags([]);
    setComplaintText("");
    setGeneratedText(null);
    setGeneratedRowId(null);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!storeId || rating === null || selectedTags.length === 0) return;

    setGenerating(true);
    setGeneratedText(null);

    const tagsCsv = buildSelectedTagsCsv(selectedTags);

    try {
      const res = await fetch("/api/generate-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          tags: tagsCsv,
          storeId,
          language,
        }),
      });
      const json = await res.json();
      const reviewText: string = json.review ?? "";

      if (json.placeUrl) {
        setPlaceUrl(json.placeUrl);
      }

      if (!reviewText) {
        showToast(content[language].errors.generateFail);
        return;
      }

      const row = await insertReviewLog({
        store_id: storeId,
        test_type: TEST_TYPE,
        rating,
        selected_tags: tagsCsv,
        generated_text: reviewText,
      });

      setGeneratedText(reviewText);
      setGeneratedRowId(row?.id ?? null);

      try {
        const stored = localStorage.getItem("review_generation_data");
        const now = Date.now();
        let newCount = 1;
        let timestamp = now;
        if (stored) {
          const parsed = JSON.parse(stored);
          if (now - parsed.timestamp <= 86400000) {
            newCount = (parsed.count || 0) + 1;
            timestamp = parsed.timestamp;
          }
        }
        localStorage.setItem("review_generation_data", JSON.stringify({ count: newCount, timestamp }));
        setGenerateCount(newCount);
      } catch (e) {
        console.error("Local storage error:", e);
      }
    } catch (err) {
      console.error("Review generation error:", err);
      showToast(content[language].errors.networkError);
    } finally {
      setGenerating(false);
    }
  }, [storeId, rating, selectedTags, showToast, language, content]);

  const handleSilentSubmit = useCallback(async () => {
    if (!storeId || rating === null) return;

    setGenerating(true);
    const tagsCsv = buildSelectedTagsCsv(selectedTags);
    const generatedNote = complaintText.trim()
      ? `Silent suggestion to owner (negative review defense)\nDetails: ${complaintText}`
      : "Silent suggestion to owner (negative review defense)";

    try {
      await insertReviewLog({
        store_id: storeId,
        test_type: TEST_TYPE,
        rating,
        selected_tags: tagsCsv,
        generated_text: generatedNote,
        is_copied: false
      });

      showToast(content[language].errors.silentSubmitSuccess);

      setRating(null);
      setHoveredRating(null);
      setSelectedTags([]);
      setComplaintText("");
      setGeneratedText(null);
      setGeneratedRowId(null);

    } catch (err) {
      console.error("Silent submit error:", err);
      showToast(content[language].errors.submitFail);
    } finally {
      setGenerating(false);
    }
  }, [storeId, rating, selectedTags, complaintText, showToast, language, content]);

  const handleCopyAndOpenNaver = useCallback(async () => {
    if (!generatedText) return;

    if (!placeUrl || placeUrl.trim() === "") {
      alert(content[language].errors.noNaverUrl);
      return;
    }

    setCopyBusy(true);
    try {
      await navigator.clipboard.writeText(generatedText);
      if (generatedRowId) {
        await markReviewLogCopied(generatedRowId);
      }

      window.open(placeUrl.trim(), "_blank", "noopener,noreferrer");

    } catch (e) {
      console.error("Copy or open failed:", e);
      alert(content[language].errors.copyFail);
    } finally {
      setCopyBusy(false);
    }
  }, [generatedText, generatedRowId, placeUrl, language, content]);

  if (loadingTrial) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-zinc-100 px-6 text-center">
        <div className="rounded-2xl bg-white p-8 shadow-lg ring-1 ring-zinc-200/80 max-w-sm w-full">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600"></div>
          </div>
          <p className="text-zinc-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (trialExpired) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-zinc-100 px-6 text-center">
        <div className="rounded-2xl bg-white p-8 shadow-lg ring-1 ring-zinc-200/80 max-w-sm w-full">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <span className="text-2xl">⚠️</span>
          </div>
          <h1 className="text-xl font-bold text-zinc-900 mb-2">
            {content[language].expired.title}
          </h1>
          <p className="text-zinc-600 mb-4">
            {content[language].expired.message}
          </p>
          <p className="text-sm text-zinc-500">
            {content[language].expired.subMessage}
          </p>
        </div>
      </div>
    );
  }

  if (!storeId) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-zinc-100 px-6 text-center">
        <div className="rounded-2xl bg-white p-8 shadow-lg ring-1 ring-zinc-200/80 max-w-sm w-full">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50">
            <svg className="h-8 w-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-zinc-900">
            {content[language].invalidQr.title}
          </h1>
          <p className="mt-2 text-sm text-zinc-500 leading-relaxed">
            {content[language].invalidQr.message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-zinc-100 text-zinc-900 pt-8 pb-10">
      <main className="mx-auto max-w-md w-full px-4 flex flex-col min-h-dvh">
        {/* Language Toggle & Header */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setLanguage(language === 'ko' ? 'en' : 'ko')}
            className="bg-white rounded-lg px-4 py-2 shadow-md hover:shadow-lg transition-shadow flex items-center space-x-2"
          >
            <span className="text-sm font-medium text-gray-700">
              {language === 'ko' ? 'EN' : 'KO'}
            </span>
          </button>
        </div>

        <header className="mb-8 text-center pt-4">
          <p className="text-sm font-medium text-emerald-700">{content[language].header.guide}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900">
            {content[language].header.title}
          </h1>
          <p className="mt-2 text-sm text-zinc-600 px-4">
            {content[language].header.subtitle}
          </p>
        </header>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200/80">
          <h2 className="text-lg font-semibold text-zinc-900">{content[language].rating.title}</h2>
          <p className="mt-1 text-sm text-zinc-500">
            {content[language].rating.desc}
          </p>
          <div
            className="mt-5 flex justify-between gap-1 sm:gap-2"
            onMouseLeave={() => setHoveredRating(null)}
          >
            {[1, 2, 3, 4, 5].map((star) => {
              const activeLimit = hoveredRating !== null ? hoveredRating : (rating ?? 0);
              const isActive = star <= activeLimit;
              const isSelected = rating === star;

              return (
                <button
                  key={star}
                  type="button"
                  aria-label={`${star}점`}
                  onClick={() => handleRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  className={`flex h-14 min-w-0 flex-1 items-center justify-center rounded-xl text-3xl transition-all active:scale-95 ${isActive
                    ? isSelected
                      ? "bg-amber-400 text-white shadow-md shadow-amber-400/30 scale-105"
                      : "bg-amber-300 text-amber-50"
                    : "bg-zinc-50 text-zinc-300 ring-1 ring-zinc-200"
                    }`}
                >
                  ★
                </button>
              );
            })}
          </div>
          {rating !== null && (
            <p className="mt-4 text-center text-[13px] font-semibold tracking-wide text-zinc-600 animate-[fadeSlideUp_0.2s_ease-out]">
              {sentimentPositive
                ? content[language].rating.positivePlaceholder
                : content[language].rating.negativePlaceholder}
            </p>
          )}
        </section>

        {rating !== null && (
          <section className="mt-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200/80 animate-[fadeSlideUp_0.25s_ease-out]">
            {!sentimentPositive ? (
              <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-100/50">
                <p className="text-[14px] leading-relaxed text-rose-800 font-medium">
                  {content[language].negative.apology}
                </p>
              </div>
            ) : null}

            <h2 className="text-lg font-semibold text-zinc-900">{content[language].keywords.title}</h2>
            <p className="mt-1 text-sm text-zinc-500">
              {content[language].keywords.desc} ({content[language].keywords.maxWarning})
            </p>

            {sentimentPositive && tagsLoading ? (
              <div className="mt-6 flex flex-col items-center justify-center gap-3 py-4 text-sm text-zinc-400">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-200 border-t-emerald-500" />
                <p>{content[language].keywords.loading}</p>
              </div>
            ) : keywordPool.length === 0 ? (
              <p className="mt-6 text-center text-sm text-zinc-400 bg-zinc-50 py-4 rounded-xl ring-1 ring-zinc-100">
                {content[language].keywords.empty}
              </p>
            ) : (
              <div className="mt-5 flex flex-wrap gap-2">
                {keywordPool.map((tag) => {
                  const on = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`min-h-12 rounded-xl px-5 text-[15px] font-semibold transition-all active:scale-[0.96] shadow-sm ${on
                        ? sentimentPositive
                          ? "bg-emerald-600 text-white ring-2 ring-emerald-600/30 shadow-emerald-600/20"
                          : "bg-rose-600 text-white ring-2 ring-rose-600/30 shadow-rose-600/20"
                        : "bg-white text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-50"
                        }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            )}

            {!sentimentPositive ? (
              <div className="mt-6 animate-[fadeSlideUp_0.2s_ease-out]">
                <label className="block text-sm font-semibold text-zinc-900 mb-2">{content[language].negative.detailLabel}</label>
                <textarea
                  value={complaintText}
                  onChange={(e) => setComplaintText(e.target.value)}
                  placeholder={content[language].negative.detailPlaceholder}
                  className="w-full h-28 resize-none rounded-xl bg-zinc-50 px-4 py-3 text-[14px] text-zinc-800 placeholder-zinc-400 outline-none ring-1 ring-zinc-200 transition focus:ring-rose-500/50 focus:bg-white"
                />
              </div>
            ) : null}

            {sentimentPositive ? (
              <div className="mt-8">
                <button
                  type="button"
                  disabled={selectedTags.length === 0 || generating || generateCount >= 3}
                  onClick={() => void handleGenerate()}
                  className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 text-[15px] font-bold text-white shadow-xl shadow-zinc-900/10 transition enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400 disabled:shadow-none"
                >
                  {generateCount >= 3 ? (
                    content[language].generate.limitReached
                  ) : generating ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-white" />
                      {content[language].generate.generating}
                    </>
                  ) : (
                    content[language].generate.button
                  )}
                </button>
                <p className="text-sm text-gray-400 mt-2 text-center">
                  {content[language].generate.disclaimer}
                </p>
              </div>
            ) : (
              <button
                type="button"
                disabled={generating}
                onClick={() => void handleSilentSubmit()}
                className="mt-6 flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-rose-600 text-[15px] font-bold text-white shadow-xl shadow-rose-600/20 transition hover:bg-rose-500 enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400 disabled:shadow-none"
              >
                {generating ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-rose-300 border-t-white" />
                    {content[language].negative.submitting}
                  </>
                ) : (
                  <>
                    {content[language].negative.submit}
                  </>
                )}
              </button>
            )}
          </section>
        )}

        {sentimentPositive && generatedText !== null && (
          <section className="mt-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200/80 animate-[fadeSlideUp_0.3s_ease-out]">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-700 ring-4 ring-emerald-50">✓</span>
              <h2 className="text-lg font-bold text-zinc-900">{content[language].result.title}</h2>
            </div>

            <p className="mt-3 text-[13.5px] leading-relaxed text-zinc-600">
              {content[language].result.desc}
            </p>

            <div className="mt-4 relative rounded-xl bg-zinc-50 border border-zinc-100 overflow-hidden">
              <svg className="absolute text-zinc-200/60 top-3 left-3 w-8 h-8 pointer-events-none" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>
              <textarea
                ref={textareaRef}
                value={generatedText}
                onChange={(e) => setGeneratedText(e.target.value)}
                className="relative block w-full p-5 pt-8 text-[15px] font-medium leading-loose text-zinc-800 bg-transparent resize-none overflow-hidden min-h-[140px] outline-none transition focus:ring-2 focus:ring-emerald-500/30 rounded-xl"
              />
            </div>

            <button
              type="button"
              disabled={copyBusy}
              onClick={() => void handleCopyAndOpenNaver()}
              className="mt-5 flex h-[56px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-[16px] font-bold text-white shadow-xl shadow-emerald-500/20 transition hover:from-emerald-400 hover:to-teal-500 active:scale-[0.98] disabled:opacity-70 disabled:cursor-wait"
            >
              {copyBusy ? content[language].result.copying : content[language].result.copyButton}
            </button>
            <p className="mt-3 text-center text-[11px] text-zinc-500 tracking-tight">
              {content[language].result.pasteHint}
            </p>
          </section>
        )}
      </main>

      <div className="fixed top-0 left-0 right-0 w-full flex justify-center pointer-events-none z-50">
        <div className={`mt-6 max-w-sm w-full mx-4 transition-all duration-300 ease-out flex ${toast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}`}>
          {toast && (
            <div className="bg-zinc-900/95 backdrop-blur-sm text-white px-5 py-3.5 rounded-2xl shadow-2xl ring-1 ring-white/10 flex items-center justify-center gap-3 w-full animate-[fadeSlideDown_0.3s_ease-out]">
              <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-[13.5px] font-medium leading-snug">{toast}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── 메인 페이지 라우팅 로직 ── */
function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const storeId = searchParams.get("storeId");
  const [authChecked, setAuthChecked] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      setHasSession(!!user);
      setAuthChecked(true);
    };
    checkAuth();
  }, []);

  // 1. storeId가 있으면 무조건 ReviewForm 렌더링 (로그인 여부 무관)
  if (storeId) {
    return <ReviewForm />;
  }

  // 2. storeId 없고 로그인 안 된 상태면 랜딩 페이지
  if (!authChecked) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-zinc-50">
        <span className="h-8 w-8 animate-spin rounded-full border-3 border-zinc-200 border-t-emerald-500" />
      </div>
    );
  }

  // 3. storeId 없고 로그인 된 상태면 대시보드로 리다이렉트
  if (hasSession) {
    router.push('/dashboard');
    return (
      <div className="flex min-h-dvh items-center justify-center bg-zinc-50">
        <span className="h-8 w-8 animate-spin rounded-full border-3 border-zinc-200 border-t-emerald-500" />
      </div>
    );
  }

  // 4. storeId 없고 로그인 안 된 상태면 랜딩 페이지
  return <LandingPage />;
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-zinc-50">
          <span className="h-8 w-8 animate-spin rounded-full border-3 border-zinc-200 border-t-emerald-500" />
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
