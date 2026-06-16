"use client";

import { useState } from "react";
import { extendSubscriptions } from "./actions";

interface Organization {
  id: string;
  name: string;
}

interface AdminListProps {
  organizations: Organization[];
}

export default function AdminList({ organizations }: AdminListProps) {
  const [selectedMonths, setSelectedMonths] = useState<Record<string, number>>({});
  const [loadingOrgId, setLoadingOrgId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleExtend = async (orgId: string) => {
    const months = selectedMonths[orgId] || 1; // 기본값 1개월
    setLoadingOrgId(orgId);
    setToastMessage(null);

    try {
      const res = await extendSubscriptions(orgId, months);
      if (res.success) {
        setToastMessage({ type: "success", text: "해당 본사의 모든 가맹점이 연장되었습니다." });
        setTimeout(() => setToastMessage(null), 3000);
      } else {
        setToastMessage({ type: "error", text: res.error || "연장 처리에 실패했습니다." });
      }
    } catch (err: any) {
      setToastMessage({ type: "error", text: "네트워크 오류가 발생했습니다." });
    } finally {
      setLoadingOrgId(null);
    }
  };

  const handleSelectChange = (orgId: string, value: number) => {
    setSelectedMonths((prev) => ({ ...prev, [orgId]: value }));
  };

  return (
    <div className="relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[100] animate-[toastSlideUp_0.3s_ease-out]">
          <div
            className={`rounded-full px-6 py-3 text-sm font-black text-white shadow-xl backdrop-blur-md ring-1 ring-white/20 whitespace-nowrap ${
              toastMessage.type === "success" ? "bg-emerald-500/95" : "bg-rose-500/95"
            }`}
          >
            {toastMessage.type === "success" ? "✅" : "⚠️"} {toastMessage.text}
          </div>
        </div>
      )}

      {organizations.length === 0 ? (
        <div className="p-12 text-center text-zinc-500 bg-[#161822] rounded-2xl border border-white/5">
          등록된 프랜차이즈 본사가 없습니다.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-[#161822] ring-1 ring-white/10 shadow-2xl">
          <div className="grid grid-cols-12 bg-white/5 border-b border-white/10 px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-400">
            <div className="col-span-3">본사명</div>
            <div className="col-span-4">본사 고유 ID (UUID)</div>
            <div className="col-span-5 text-right">관리 액션</div>
          </div>
          <div className="divide-y divide-white/5">
            {organizations.map((org) => {
              const isLoading = loadingOrgId === org.id;
              const currentMonths = selectedMonths[org.id] || 1;

              return (
                <div
                  key={org.id}
                  className="grid grid-cols-12 items-center px-6 py-5 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="col-span-3 font-bold text-white truncate pr-4">
                    {org.name}
                  </div>
                  <div className="col-span-4 text-[11px] text-zinc-500 font-mono tracking-tighter truncate pr-4">
                    {org.id}
                  </div>
                  <div className="col-span-5 flex items-center justify-end gap-3">
                    <select
                      value={currentMonths}
                      onChange={(e) => handleSelectChange(org.id, parseInt(e.target.value, 10))}
                      disabled={isLoading}
                      className="bg-[#0f1117] text-sm text-zinc-200 border border-white/10 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-fuchsia-500/50 disabled:opacity-50"
                    >
                      <option value={1}>1개월</option>
                      <option value={6}>6개월</option>
                      <option value={12}>1년</option>
                      <option value={24}>2년</option>
                    </select>
                    <button
                      onClick={() => handleExtend(org.id)}
                      disabled={isLoading}
                      className="relative inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-fuchsia-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-fuchsia-600/20 transition-all hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-50 min-w-[140px]"
                    >
                      {isLoading ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          연장 처리 중...
                        </>
                      ) : (
                        "PRO 일괄 연장 승인"
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
