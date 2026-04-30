"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StoreProfileEditor({ storeId, initialName }: { storeId: string; initialName: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(initialName || "신규 매장");
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  // 매장 스위칭 시 상태 강제 동기화
  useEffect(() => {
    setName(initialName || "신규 매장");
    setIsEditing(false); // 전환 시 편집 모드 초기화
  }, [initialName, storeId]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsSaving(true);

    try {
      const res = await fetch("/api/store-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId,
          name: name.trim()
        }),
      });

      const json = await res.json();
      if (json.success) {
        setIsEditing(false);
        router.refresh();
      } else {
        alert("저장에 실패했습니다: " + json.error);
      }
    } catch {
      alert("네트워크 통신 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mb-8 flex items-center justify-between rounded-2xl bg-white/[0.03] p-4 ring-1 ring-white/[0.06] backdrop-blur-md">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-600/20 ring-1 ring-violet-500/30">
          <span className="text-xl">🏪</span>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-0.5">현재 관리 중인 매장</p>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSaving}
                className="h-8 rounded-md bg-white/10 px-3 text-sm text-white outline-none ring-1 ring-white/20 focus:ring-violet-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                  if (e.key === "Escape") {
                    setName(initialName || "신규 매장");
                    setIsEditing(false);
                  }
                }}
              />
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="rounded-md bg-violet-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-violet-500 disabled:opacity-50"
              >
                {isSaving ? "저장 중..." : "저장"}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group">
              <h2 className="text-lg font-bold text-white tracking-tight">{name}</h2>
              <button
                onClick={() => setIsEditing(true)}
                className="opacity-0 group-hover:opacity-100 transition-opacity rounded-md bg-white/10 px-2 py-1 text-[10px] font-medium text-zinc-400 hover:text-white"
              >
                변경하기
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="hidden sm:block text-right">
        <div className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-1.5 ring-1 ring-emerald-500/20">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-emerald-400">ReviewGuard 보호 가동 중</span>
        </div>
      </div>
    </div>
  );
}
