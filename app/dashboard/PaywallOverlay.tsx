"use client";

import { Lock } from "lucide-react";

interface PaywallOverlayProps {
  title: string;
  description: string;
}

export default function PaywallOverlay({ title, description }: PaywallOverlayProps) {
  const defaultTitle = "🔒 베이직 플랜 전용 기능";
  const defaultDescription = "14일 무료 체험이 종료되었습니다. 계속해서 AI 기능을 이용하시려면 베이직 플랜을 구독해 주세요.";
  const buttonText = "플랜 업그레이드";

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-2xl">
      <div className="text-center p-6">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-700/50">
          <Lock className="h-6 w-6 text-zinc-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">{title || defaultTitle}</h3>
        <p className="text-sm text-zinc-400 mb-4">{description || defaultDescription}</p>
        <button
          className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors"
          onClick={() => window.location.href = '/pricing'}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}
