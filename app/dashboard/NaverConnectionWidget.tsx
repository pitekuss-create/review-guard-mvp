"use client";

import { useCallback, useEffect, useState } from "react";
import { Globe, Save } from "lucide-react";

export default function NaverConnectionWidget({ 
  storeId,
  initialUrl 
}: { 
  storeId: string;
  initialUrl: string;
}) {
  const [naverUrl, setNaverUrl] = useState(initialUrl || "");
  const [savedUrl, setSavedUrl] = useState(initialUrl || "");
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setNaverUrl(initialUrl || "");
    setSavedUrl(initialUrl || "");
  }, [initialUrl]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleSave = async () => {
    const trimmedUrl = naverUrl.trim();
    if (!trimmedUrl) {
      alert("네이버 플레이스 URL을 입력해 주세요.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/store-concept", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          storeId,
          placeUrl: trimmedUrl 
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSavedUrl(trimmedUrl);
        showToast("네이버 플레이스 연결이 완료되었습니다! ✓");
      } else {
        showToast("저장 실패: " + (json.error ?? "알 수 없는 오류"));
      }
    } catch (err) {
      console.error("[Save Error]:", err);
      showToast("네트워크 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const isDirty = naverUrl.trim() !== savedUrl;

  return (
    <section className="relative rounded-2xl bg-gradient-to-br from-[#1a1d2b] to-[#161822cc] p-6 ring-1 ring-white/[0.06] mb-8">
      <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-teal-500/5 blur-3xl pointer-events-none" />

      <div className="relative">
        <div className="flex items-center gap-2 mb-1">
          <Globe size={18} className="text-teal-400" />
          <h2 className="text-base font-semibold text-zinc-200">
            네이버 플레이스 연결 (QR코드용)
          </h2>
        </div>
        <p className="text-xs text-zinc-500 mb-6">
          입력하신 주소는 QR코드를 스캔한 고객이 매장 리뷰 페이지로 바로 이동할 때 사용됩니다.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <input
              type="text"
              value={naverUrl}
              onChange={(e) => setNaverUrl(e.target.value)}
              placeholder="https://m.place.naver.com/restaurant/..."
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition focus:ring-2 focus:ring-teal-500/30 focus:bg-white/[0.08]"
            />
          </div>
          <button
            type="button"
            disabled={isSaving || !isDirty}
            onClick={handleSave}
            className="inline-flex h-[48px] items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 text-sm font-bold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-500 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isSaving ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <Save size={16} />
            )}
            {isSaving ? "저장 중..." : "연결하기"}
          </button>
        </div>

        {savedUrl && (
          <div className="mt-4 flex items-center gap-2 text-[11px] text-emerald-400 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            현재 연결됨: {savedUrl.length > 50 ? savedUrl.slice(0, 50) + "..." : savedUrl}
          </div>
        )}
      </div>

      {/* 토스트 */}
      {toast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-2 font-bold whitespace-nowrap">
            <span>✅</span>
            {toast}
          </div>
        </div>
      )}
    </section>
  );
}
