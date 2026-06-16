"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { upgradeStoreTier } from "./actions";

type Status = "processing" | "success" | "error";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") ?? "";
  const storeId = searchParams.get("storeId") ?? "";
  const processed = useRef(false);

  const [status, setStatus] = useState<Status>("processing");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (processed.current || !plan) return;
    processed.current = true;

    const finalizePayment = async () => {
      try {
        if (!storeId) {
          setErrorMsg("매장 ID를 찾을 수 없습니다.");
          setStatus("error");
          return;
        }

        const result = await upgradeStoreTier(plan, storeId);

        if (!result.success) {
          console.error("[PaymentSuccess] 권한 업그레이드 실패:", result.error);
          setErrorMsg(result.error ?? "알 수 없는 오류");
          setStatus("error");
          return;
        }

        setStatus("success");

        // 🚀 핵심: DB 복제 지연시간 0.15초 대기 후 이동
        await new Promise((r) => setTimeout(r, 150));

        const cacheBust = Date.now();
        window.location.href = `/dashboard?payment_success=true&plan=${result.role ?? plan.toUpperCase()}&t=${cacheBust}`;

      } catch (err) {
        const msg = err instanceof Error ? err.message : "네트워크 오류";
        setErrorMsg(msg);
        setStatus("error");
      }
    };

    finalizePayment();
  }, [plan]);

  if (status === "processing") {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-[#0f1117] text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-500 mb-6"></div>
        <p className="text-xl font-bold tracking-tight">결제를 확인하는 중입니다...</p>
        <p className="text-zinc-500 text-sm mt-3">잠시만 기다려 주세요.</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-[#0f1117] text-white">
        <div className="text-5xl mb-4">🎉</div>
        <p className="text-xl font-bold tracking-tight">결제 완료! 대시보드로 이동 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-[#0f1117] px-4 text-white">
      <div className="bg-[#1a1c2e] rounded-2xl shadow-xl border border-white/10 p-8 max-w-md w-full text-center space-y-4">
        <div className="text-4xl">⚠️</div>
        <h2 className="text-lg font-bold text-white">권한 업데이트 중 문제 발생</h2>
        <p className="text-sm text-rose-400 bg-rose-500/10 rounded-lg p-3 text-left">
          {errorMsg}
        </p>
        <p className="text-xs text-zinc-400">결제 자체는 완료되었습니다. 문의하시면 즉시 처리해 드립니다.</p>
        <div className="flex gap-3 mt-4">
          <a href="/dashboard" className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-xl text-sm transition text-center">
            대시보드로 이동
          </a>
        </div>
      </div>
    </div>
  );
}