"use client";
import { useEffect, useState } from "react";

export default function PaymentSuccessToast() {
  const [planName, setPlanName] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment_success") === "true" && params.get("plan")) {
      setPlanName(params.get("plan")!.toUpperCase());
      setTimeout(() => setPlanName(null), 5000);
    }
  }, []);

  if (!planName) return null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] animate-[fadeSlideDown_0.4s_ease-out] bg-emerald-500/95 px-6 py-3 text-sm font-bold text-white shadow-xl shadow-emerald-500/20 backdrop-blur-md ring-1 ring-white/20 rounded-xl flex items-center gap-2">
      <span>🎉</span> {planName} 요금제 결제가 성공적으로 완료되었습니다!
    </div>
  );
}