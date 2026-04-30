"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

interface FormData {
  name: string;
  business_number: string;
  operation_report_number: string;
  hq_access_consent: boolean;
}

interface HqInviteRow {
  id: string;
  hq_org_id: string;
  status: string;
}

type Step = "form" | "loading" | "error" | "done";

function isValidBusinessNumber(value: string): boolean {
  return /^\d{10}$/.test(value.replace(/-/g, ""));
}

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const isSubmitting = useRef(false);

  const [step, setStep] = useState<Step>("form");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [formData, setFormData] = useState<FormData>({
    name: "", business_number: "", operation_report_number: "", hq_access_consent: false,
  });

  const token = searchParams.get("token") ?? null;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.replace("/login");
    });
  }, [router, supabase.auth]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting.current) return;
    isSubmitting.current = true;
    setStep("loading");
    setErrorMsg("");

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) throw new Error("로그인 세션이 만료되었습니다. 다시 로그인해 주세요.");

      const userId = session.user.id;
      const urlParams = new URLSearchParams(window.location.search);
      const currentToken = urlParams.get("token") || null;

      let hqOrgId: string | null = null;
      let isHqSponsored = false;

      if (currentToken) {
        const { data: invite, error: inviteError } = await supabase.from("hq_invites").select("id, hq_org_id, status").eq("token", currentToken).single<HqInviteRow>();
        if (inviteError || !invite) throw new Error("초대 링크가 유효하지 않거나 만료되었습니다.");
        if (invite.status !== "PENDING") throw new Error("이미 사용된 초대 링크입니다.");
        const { error: updateError } = await supabase.from("hq_invites").update({ status: "USED" }).eq("id", invite.id);
        if (updateError) throw new Error(`초대 코드 처리 중 오류: ${updateError.message}`);

        hqOrgId = invite.hq_org_id;
        isHqSponsored = true;
      }

      const insertPayload = {
        user_id: userId,
        organization_id: hqOrgId,
        name: formData.name.trim(),
        business_number: formData.business_number.replace(/-/g, ""),
        operation_report_number: formData.operation_report_number.trim(),
        hq_access_consent: formData.hq_access_consent, // 체크박스 값 그대로 반영
        is_hq_sponsored: isHqSponsored,
        concept: "",
      };

      const { data: newStore, error: insertError } = await supabase.from("stores").insert(insertPayload).select("id").single();

      if (insertError) {
        if (insertError.code === "23505") throw new Error("이미 등록된 매장 정보입니다. 대시보드에서 추가해 주세요.");
        throw new Error(`매장 등록 중 오류: ${insertError.message}`);
      }

      const { data: roleRow } = await supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle<{ role: string }>();
      const userRole = roleRow?.role ?? null;
      const newStoreId = newStore?.id;

      setStep("done");

      if (userRole === "HQ_ADMIN") { router.replace("/hq/dashboard"); return; }
      if (isHqSponsored) { router.replace(`/dashboard?storeId=${newStoreId}`); return; }
      router.replace("/pricing");

    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
      setStep("error");
    } finally {
      isSubmitting.current = false;
    }
  }, [formData, token, router, supabase]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  // 🚀 핵심 로직: 토큰이 있을 때는 반드시 체크박스에 동의해야만 폼이 유효함
  const isFormValid =
    formData.name.trim().length > 0 &&
    isValidBusinessNumber(formData.business_number) &&
    formData.operation_report_number.trim().length > 0 &&
    (!token || formData.hq_access_consent); // 토큰이 없으면 무시, 토큰이 있으면 true여야 통과

  if (step === "loading") {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-[#0f1117] gap-4">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-400 text-sm font-medium">매장을 등록하는 중입니다...</p>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-[#0f1117] gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-3xl mb-2">✅</div>
        <h2 className="text-xl font-bold text-white">매장 등록 완료!</h2>
        <p className="text-zinc-400 font-medium">대시보드로 이동 중입니다...</p>
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-[#0f1117] px-4">
        <div className="bg-gradient-to-br from-[#1a1d2b] to-[#161822] ring-1 ring-white/10 rounded-3xl shadow-2xl p-8 max-w-md w-full text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/10 text-3xl mb-2 ring-1 ring-rose-500/20">⚠️</div>
          <h2 className="text-lg font-bold text-white">등록 중 문제가 발생했습니다</h2>
          <p className="text-sm text-rose-400 bg-rose-500/10 ring-1 ring-rose-500/20 rounded-xl p-4 text-left leading-relaxed">{errorMsg}</p>
          <button onClick={() => { setStep("form"); setErrorMsg(""); }} className="w-full bg-white/5 hover:bg-white/10 active:scale-95 text-white font-semibold py-3.5 rounded-xl transition-all ring-1 ring-white/10 mt-4">
            다시 시도하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#0f1117] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="bg-gradient-to-b from-[#1a1d2b] to-[#11131a] rounded-[2rem] shadow-2xl p-8 sm:p-10 max-w-md w-full space-y-8 relative z-10 ring-1 ring-white/5">

        <div className="flex flex-col items-center text-center space-y-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg shadow-violet-500/30 ring-1 ring-white/20">
            <span className="text-2xl">🚀</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white tracking-tight">
              사장님께 딱 맞는 <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">맞춤 솔루션</span>을 준비합니다
            </h1>
            <p className="text-xs text-zinc-400 leading-relaxed px-2">
              사장님 매장에 최적화된 상권 분석 및 경쟁사 분석을 위해 실제 운영 중인 사업자 정보 등록이 필요합니다.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
              <span className="text-violet-400">🏪</span> 매장 상호명 <span className="text-rose-500">*</span>
            </label>
            <input id="name" name="name" type="text" value={formData.name} onChange={handleChange} placeholder="예: 리뷰가드 강남점" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:bg-white/10 transition-all placeholder:text-zinc-600" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="business_number" className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                <span className="text-violet-400">📄</span> 사업자등록번호 <span className="text-rose-500">*</span>
              </label>
              <input id="business_number" name="business_number" type="text" value={formData.business_number} onChange={handleChange} placeholder="숫자 10자리" maxLength={12} className={`w-full bg-white/5 border rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:ring-2 transition-all placeholder:text-zinc-600 ${formData.business_number && !isValidBusinessNumber(formData.business_number) ? "border-rose-500/50 focus:ring-rose-500/50" : "border-white/10 focus:ring-violet-500/50 focus:bg-white/10"}`} required />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="operation_report_number" className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                <span className="text-violet-400">✔️</span> 영업신고번호 <span className="text-rose-500">*</span>
              </label>
              <input id="operation_report_number" name="operation_report_number" type="text" value={formData.operation_report_number} onChange={handleChange} placeholder="영업신고증 기재" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:bg-white/10 transition-all placeholder:text-zinc-600" required />
            </div>
          </div>

          {/* 🚀 토큰(본사 초대)이 있을 때만 나타나는 필수 동의 영역 */}
          {token && (
            <div className={`mt-2 rounded-xl p-4 transition-all duration-300 border ${formData.hq_access_consent ? 'bg-violet-500/10 border-violet-500/30' : 'bg-[#0f1117] border-white/10'}`}>
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  id="hq_access_consent"
                  name="hq_access_consent"
                  type="checkbox"
                  checked={formData.hq_access_consent}
                  onChange={handleChange}
                  className="mt-0.5 w-4 h-4 rounded bg-white/5 border-white/20 text-violet-500 focus:ring-violet-500 focus:ring-offset-0 transition-all cursor-pointer"
                />
                <span className={`text-sm leading-relaxed font-medium transition-colors ${formData.hq_access_consent ? 'text-violet-200' : 'text-zinc-400 group-hover:text-zinc-300'}`}>
                  [필수] 프랜차이즈 본사(HQ)의 매장 데이터 열람 및 관리 권한 위임에 동의합니다.
                </span>
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={!isFormValid}
            className="w-full mt-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all duration-200 text-sm shadow-lg shadow-violet-500/25"
          >
            {token ? "리뷰가드 마스터 권한 획득 🚀" : "매장 등록 완료하기"}
          </button>
        </form>
      </div>
    </div>
  );
}