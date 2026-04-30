"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showSignupModal, setShowSignupModal] = useState(false);

  const getKoreanErrorMsg = (msg: string) => {
    if (msg.toLowerCase().includes("invalid login credentials")) return "이메일 또는 비밀번호가 일치하지 않습니다.";
    if (msg.toLowerCase().includes("rate limit exceeded")) return "이메일 발송 한도를 초과했습니다. 잠시 후 다시 시도해주세요.";
    if (msg.toLowerCase().includes("already registered")) return "이미 가입된 이메일입니다.";
    if (msg.toLowerCase().includes("email not confirmed")) return "이메일 인증이 완료되지 않았습니다. 메일함을 확인해 주세요.";
    return msg;
  };

  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(getKoreanErrorMsg(error.message));
      setLoading(false);
    } else {
      setSuccessMsg("로그인 성공! 대시보드로 이동 중...");
      router.push('/dashboard');
      router.refresh();
    }
  };

  const handleSignup = async () => {
    if (!email || !password) {
      setErrorMsg("이메일과 비밀번호를 입력해 주세요.");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`, // 이메일 확인용 (기본적으로 끄는 것도 무방)
      },
    });

    if (error) {
      setErrorMsg(getKoreanErrorMsg(error.message));
      setLoading(false);
    } else {
      setShowSignupModal(true);
      setLoading(false);
    }
  };

  return (
    <>
      {showSignupModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#1a1d2b] p-6 shadow-2xl ring-1 ring-white/10 text-center" style={{ animation: "fadeSlideUp 0.3s ease-out" }}>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
              <span className="text-3xl">📧</span>
            </div>
            <h3 className="mb-2 text-lg font-bold text-white">이메일 인증 필수</h3>
            <p className="mb-6 text-sm text-zinc-400 font-medium leading-relaxed">
              회원가입이 완료되었습니다!<br />
              입력하신 이메일의 수신함을 확인하여 <strong>[인증 링크]</strong>를 클릭해 주셔야 로그인이 가능합니다.
            </p>
            <button
              onClick={() => setShowSignupModal(false)}
              className="w-full rounded-xl bg-emerald-600 py-3 font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-500 active:scale-95"
            >
              확인
            </button>
          </div>
        </div>
      )}

      <div className="min-h-screen flex items-center justify-center bg-[#0f1117] px-4 font-sans text-zinc-100">
        <div className="w-full max-w-md p-8 bg-[#1a1d2b]/80 backdrop-blur-xl rounded-3xl shadow-2xl ring-1 ring-white/10">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-xl font-black shadow-lg shadow-emerald-500/30">
            RG
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            사장님 로그인
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            ReviewGuard 대시보드 접근을 위해 로그인해주세요.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
              이메일 (Email)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl bg-white/5 px-4 py-3 text-sm text-white placeholder-zinc-500 ring-1 ring-white/10 transition focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              placeholder="owner@store.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
              비밀번호 (Password)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl bg-white/5 px-4 py-3 text-sm text-white placeholder-zinc-500 ring-1 ring-white/10 transition focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              placeholder="••••••••"
            />
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              {successMsg}
            </div>
          )}

          <div className="pt-4 flex flex-col gap-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center h-[52px] rounded-xl bg-emerald-600 font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-500 active:scale-[0.98] disabled:opacity-50 disabled:cursor-wait"
            >
              {loading ? "처리 중..." : "로그인"}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleSignup}
              className="w-full flex justify-center items-center h-[52px] rounded-xl bg-white/5 font-semibold text-zinc-300 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white active:scale-[0.98] disabled:opacity-50"
            >
              새 점포 회원가입
            </button>
          </div>
        </form>
      </div>
      </div>
    </>
  );
}
