"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import PaywallModal from "./PaywallModal";
import { getTrialStatus } from "@/lib/trialUtils";

function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "https://your-domain.com";
}

export default function QRCodeWidget({ storeId }: { storeId: string }) {
  const [downloaded, setDownloaded] = useState(false);
  const [inlineShowTrial, setInlineShowTrial] = useState(false);
  const [trialExpired, setTrialExpired] = useState(false);
  const [loadingTrial, setLoadingTrial] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);

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
        setTrialExpired(false); // Default to not expired on error
      } finally {
        setLoadingTrial(false);
      }
    };
    checkTrial();
  }, []);

  const qrUrl = `${getBaseUrl()}/review?storeId=${storeId}`;

  const handleDownload = useCallback(() => {
    if (trialExpired) {
      setShowPaywallModal(true);
      return;
    }

    const canvas = canvasWrapperRef.current?.querySelector("canvas");
    if (!canvas) return;

    // Only show trial alert if not expired
    setInlineShowTrial(true);
    setTimeout(() => setInlineShowTrial(false), 3000);

    // 실제 다운로드 로직
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `review-guard-qr-${storeId.slice(0, 8)}.png`;
    link.href = url;
    link.click();

    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  }, [storeId, trialExpired]);

  if (!storeId) {
    return (
      <section className="rounded-2xl bg-gradient-to-br from-[#1a1d2b] to-[#161822cc] p-6 ring-1 ring-white/[0.06] mb-8">
        <p className="text-sm text-zinc-500">STORE_ID가 설정되지 않았습니다.</p>
      </section>
    );
  }

  return (
    <section className="relative rounded-2xl bg-gradient-to-br from-[#1a1d2b] to-[#161822cc] p-6 ring-1 ring-white/[0.06] mb-8">
      {/* 장식 glow */}
      <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-teal-500/8 blur-3xl pointer-events-none" />

      <div className="relative">
        {/* 헤더 */}
        <div className="flex items-center gap-2 mb-1">
          <svg className="h-5 w-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
          <h2 className="text-base font-semibold text-zinc-200">
            매장 QR코드 발급
          </h2>
        </div>
        <p className="text-xs text-zinc-500 mb-5">
          고객이 이 QR코드를 스캔하면 매장 전용 리뷰 페이지로 이동합니다.
        </p>

        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          {/* QR 코드 */}
          <div
            ref={canvasWrapperRef}
            className="rounded-2xl bg-white p-4 shadow-lg shadow-black/20"
          >
            <QRCodeCanvas
              value={qrUrl}
              size={180}
              level="H"
              marginSize={1}
              bgColor="#ffffff"
              fgColor="#0f1117"
            />
          </div>

          {/* 정보 + 다운로드 */}
          <div className="flex flex-1 flex-col gap-4">
            {/* URL 미리보기 */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                고객 접속 URL
              </label>
              <div className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
                <span className="flex-1 truncate text-xs font-mono text-zinc-300">
                  {qrUrl}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard.writeText(qrUrl);
                    setIsCopied(true);
                    setTimeout(() => setIsCopied(false), 2000);
                  }}
                  className={`flex-shrink-0 rounded-md px-2.5 py-1 text-[10px] font-medium transition active:scale-95 ${
                    isCopied
                      ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/50"
                      : "bg-white/5 text-zinc-400 ring-1 ring-white/10 hover:bg-white/10 hover:text-zinc-200"
                  }`}
                >
                  {isCopied ? "복사 완료 ✅" : "복사"}
                </button>
              </div>
            </div>

            {/* 다운로드 버튼 */}
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex h-[46px] items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 text-sm font-semibold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-500 active:scale-[0.98]"
            >
              {downloaded ? (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  다운로드 완료!
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  QR코드 다운로드 (PNG)
                </>
              )}
            </button>
            
            {/* Inline Trial Notification */}
            {inlineShowTrial && (
              <div className="mt-2 animate-[fadeSlideUp_0.2s_ease-out] rounded-lg bg-emerald-500/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-400 ring-1 ring-emerald-500/20">
                🎁 14일 무료 체험 기간입니다.
              </div>
            )}

            <p className="text-[11px] text-zinc-600 leading-relaxed">
              💡 이 QR코드를 매장 테이블이나 계산대에 비치하세요.<br />
              고객이 스캔하면 자동으로 리뷰 작성 화면이 열립니다.
            </p>
          </div>
        </div>
      </div>
      
      {showPaywallModal && (
        <PaywallModal isOpen={showPaywallModal} onClose={() => setShowPaywallModal(false)} />
      )}
    </section>
  );
}
