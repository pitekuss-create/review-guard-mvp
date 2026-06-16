"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation"; // 🚀 추가: 라우터 연결

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  price?: string;
  isHq?: boolean;
}

export default function PaywallModal({
  isOpen,
  onClose,
  title = "베이직 플랜 기능",
  message = "해당 기능은 베이직 플랜 구독 시 이용 가능합니다.",
  price = "월 29,000원",
  isHq = false,
}: PaywallModalProps) {
  const router = useRouter(); // 🚀 추가: 라우터 훅

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-sm rounded-[24px] bg-gradient-to-b from-[#1a1d2d] to-[#12141c] p-6 shadow-2xl ring-1 ring-white/10 animate-[fadeSlideUp_0.3s_ease-out]">

        {/* Lock Icon */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 ring-1 ring-amber-500/30 mb-5 shadow-lg shadow-amber-500/10">
          <svg className="h-6 w-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        {/* Text Content */}
        <div className="text-center">
          <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
            {title}
          </h3>
          <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
            {message}
          </p>

          <div className="mb-6 inline-block rounded-xl bg-amber-500/10 px-4 py-2 ring-1 ring-amber-500/20">
            <span className="text-sm font-semibold tracking-wide text-amber-500">
              {price}
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3 mt-2">
          {!isHq && (
            <button
              type="button"
              onClick={() => {
                // 🚀 수정: 더 이상 alert 팝업 안 띄우고 페이지 이동
                router.push("/pricing");
              }}
              className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-amber-500/20 transition hover:from-amber-400 hover:to-orange-400 active:scale-[0.98]"
            >
              결제하고 잠금 해제하기
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-white/5 py-3.5 text-sm font-semibold text-zinc-300 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white active:scale-[0.98]"
          >
            나중에 하기
          </button>
        </div>

      </div>
    </div>
  );
}