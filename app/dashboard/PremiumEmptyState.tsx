"use client";
import React from "react";
import { BarChart3 } from "lucide-react";

interface PremiumEmptyStateProps {
  message?: string;
  icon?: React.ReactNode;
}

export default function PremiumEmptyState({
  message = "아직 수집된 데이터가 없습니다. 첫 QR 리뷰를 받아보세요!",
  icon
}: PremiumEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-zinc-800 bg-[#0f111a]/40 p-12 text-center my-4 min-h-[220px] w-full">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-zinc-500 border border-white/5 shadow-inner">
        {icon || <BarChart3 size={20} />}
      </div>
      <p className="text-sm font-semibold text-zinc-400 max-w-[280px] leading-relaxed">
        {message}
      </p>
    </div>
  );
}
