"use client";

import { useEffect, useState, FormEvent } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store/useStore";
import { ChevronDown, Store, Check, X, Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";

export default function StoreSwitcher() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentStoreId, accessibleStores, setCurrentStoreId, setUserInfo } = useStore();
  const supabase = createClient();

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // Portal은 document가 존재하는 클라이언트에서만 렌더링 가능
  const [portalMounted, setPortalMounted] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    business_number: "",
    operation_report_number: "",
    hq_code: ""
  });

  const initStores = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/user/stores");
      const data = await res.json();
      if (data.stores) {
        setUserInfo({
          role: data.role,
          orgId: data.organization_id,
          stores: data.stores
        });
      }
    } catch (err) {
      console.error("Failed to load stores", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initStores();
  }, [searchParams]);

  // document.body가 준비된 시점에 Portal 활성화
  useEffect(() => {
    setPortalMounted(true);
  }, []);

  const currentStore = accessibleStores.find(s => s.id === currentStoreId);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrorMsg("");
  };

  const handleAddStore = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrorMsg("");

    const bizNumClean = formData.business_number.replace(/-/g, "");
    if (!/^\d{10}$/.test(bizNumClean)) {
      setErrorMsg("사업자등록번호는 숫자 10자리여야 합니다.");
      setIsSubmitting(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인 세션이 만료되었습니다.");

      let hqOrgId = null;
      let isHqSponsored = false;
      let usedInviteId = null;

      if (formData.hq_code.trim()) {
        const code = formData.hq_code.trim();
        const { data: invite, error: inviteError } = await supabase
          .from("hq_invites")
          .select("id, hq_org_id, status")
          .eq("token", code)
          .single();

        if (inviteError || !invite) throw new Error("유효하지 않은 프랜차이즈 코드입니다. 코드를 다시 확인해 주세요.");
        if (invite.status !== "PENDING") throw new Error("이미 사용되었거나 만료된 코드입니다.");

        hqOrgId = invite.hq_org_id;
        isHqSponsored = true;
        usedInviteId = invite.id;
      }

      const { data: newStore, error: insertError } = await supabase
        .from("stores")
        .insert({
          user_id: user.id,
          organization_id: hqOrgId,
          name: formData.name.trim(),
          business_number: bizNumClean,
          operation_report_number: formData.operation_report_number.trim(),
          hq_access_consent: isHqSponsored,
          is_hq_sponsored: isHqSponsored,
          concept: ""
        })
        .select("id")
        .single();

      if (insertError) {
        if (insertError.code === "23505") throw new Error("이미 등록된 사업자/매장 정보입니다.");
        throw new Error(`매장 등록 실패: ${insertError.message}`);
      }

      if (usedInviteId) {
        await supabase.from("hq_invites").update({ status: "USED" }).eq("id", usedInviteId);
      }

      await initStores();
      if (newStore?.id) {
        setCurrentStoreId(newStore.id);
      }

      setIsModalOpen(false);
      setFormData({ name: "", business_number: "", operation_report_number: "", hq_code: "" });

    } catch (err: any) {
      setErrorMsg(err.message || "매장 추가 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* 기존 드롭다운 UI — 변경 없음 */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm font-semibold text-zinc-200 ring-1 ring-white/10 transition hover:bg-white/10 active:scale-95"
        >
          <Store size={16} className="text-violet-400" />
          <span className="max-w-[120px] truncate">
            {isLoading ? "로딩 중..." : (currentStore?.name || "매장 선택")}
          </span>
          <ChevronDown size={14} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div className="absolute left-0 mt-2 z-50 w-64 origin-top-left rounded-xl border border-white/10 bg-[#1a1d2b] p-2 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
              <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                내 매장 리스트
              </p>
              <div className="mt-1 space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                {accessibleStores.map((store) => (
                  <button
                    key={store.id}
                    onClick={() => {
                      setCurrentStoreId(store.id);
                      setIsOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${currentStoreId === store.id
                      ? "bg-violet-500/10 text-violet-400"
                      : "text-zinc-400 hover:bg-white/5 hover:text-white"
                      }`}
                  >
                    <span className="truncate">{store.name}</span>
                    {currentStoreId === store.id && <Check size={14} />}
                  </button>
                ))}
              </div>

              <div className="mt-2 pt-2 border-t border-white/5">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setIsModalOpen(true);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold text-violet-400 hover:bg-violet-500/5 transition group"
                >
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-500/10 group-hover:bg-violet-500/20">
                    <span className="text-xs">+</span>
                  </div>
                  새 매장 추가하기
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────
          모달 — createPortal로 document.body에 직접 마운트
          
          [왜 Portal이 필요한가]
          헤더에 backdrop-blur-md(= backdrop-filter: blur)가 적용되어 있으면
          브라우저는 새로운 Stacking Context를 생성합니다.
          이 Context 안에 있는 fixed 자식 요소는 뷰포트가 아닌
          해당 Context를 기준으로 위치가 결정됩니다.
          z-index를 아무리 높여도 이 Context를 탈출할 수 없습니다.
          
          createPortal은 React 트리에서는 StoreSwitcher의 자식이지만
          실제 DOM에서는 document.body의 직접 자식으로 렌더링합니다.
          backdrop-filter Stacking Context를 완전히 탈출하여
          fixed inset-0이 진짜 뷰포트 기준으로 동작합니다.
      ──────────────────────────────────────────────────────────────── */}
      {isModalOpen && portalMounted && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#0f1117]/80 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar bg-gradient-to-b from-[#1a1d2b] to-[#11131a] rounded-[2rem] shadow-2xl p-8 ring-1 ring-white/10 animate-in fade-in zoom-in-95 duration-200">

            {/* 닫기 버튼 */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>

            {/* 헤더 */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <Store className="text-violet-400" size={24} />
                새 매장 추가
              </h2>
              <p className="text-xs text-zinc-400 mt-2">새롭게 관리할 매장 정보를 입력해 주세요.</p>
            </div>

            {/* 폼 — 기존 내용 그대로 */}
            <form onSubmit={handleAddStore} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-400">
                  매장 상호명 <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="예: 리뷰가드 강남점"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-violet-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-400">
                    사업자등록번호 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    name="business_number"
                    value={formData.business_number}
                    onChange={handleChange}
                    placeholder="숫자 10자리"
                    maxLength={12}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-violet-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-400">
                    영업신고번호 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    name="operation_report_number"
                    value={formData.operation_report_number}
                    onChange={handleChange}
                    placeholder="신고증 기재"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-violet-500/50"
                  />
                </div>
              </div>

              {/* 프랜차이즈 코드 */}
              <div className="mt-4 rounded-xl bg-violet-500/5 border border-violet-500/20 p-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-20 pointer-events-none">
                  <Building2 size={64} className="text-violet-500" />
                </div>
                <label className="text-[11px] font-bold text-violet-300 block mb-2 relative z-10">
                  🔗 프랜차이즈 가맹점 연결 코드 (선택)
                </label>
                <input
                  name="hq_code"
                  value={formData.hq_code}
                  onChange={handleChange}
                  placeholder="본사에서 발급받은 코드 입력"
                  className="w-full bg-[#0f1117]/50 border border-white/10 rounded-lg px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-violet-500/50 relative z-10"
                />
                <p className="text-[10px] text-zinc-500 mt-2 relative z-10">
                  코드를 입력하면 자동으로 본사 시스템에 연동되며, 데이터 열람 권한이 위임됩니다. 개인 매장인 경우 비워두세요.
                </p>
              </div>

              {errorMsg && (
                <div className="text-xs font-medium text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                  ⚠️ {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !formData.name || !formData.business_number || !formData.operation_report_number}
                className="w-full mt-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg"
              >
                {isSubmitting ? "매장 추가 중..." : formData.hq_code ? "가맹점 연동 및 추가하기" : "매장 추가하기"}
              </button>
            </form>
          </div>
        </div>,
        document.body  // ← backdrop-filter Stacking Context 완전 탈출
      )}
    </>
  );
}