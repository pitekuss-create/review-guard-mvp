"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Phone, Mail, HelpCircle } from "lucide-react";

export default function FAQPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-zinc-200">
      <div className="mx-auto max-w-4xl px-6 py-20">
        <div className="mb-12">
          <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-zinc-300 transition mb-6">
            <ArrowLeft size={16} />
            이전 화면으로 돌아가기
          </button>
          <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
            <HelpCircle className="text-violet-500" size={40} />
            고객센터 및 FAQ
          </h1>
          <p className="mt-4 text-zinc-400 font-medium">서비스 이용 중 궁금하신 점이나 도움이 필요하신가요?</p>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl bg-white/[0.02] p-8 ring-1 ring-white/10 shadow-lg">
            <h3 className="text-lg font-bold text-white mb-4">1. 리뷰 데이터 수집 주기가 어떻게 되나요?</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              기본적으로 매일 자정 1회 데이터가 동기화됩니다. PRO 및 ENTERPRISE 플랜의 경우 실시간 동기화 옵션을 지원하며, 최대 1시간 주기로 데이터가 갱신됩니다.
            </p>
          </div>

          <div className="rounded-2xl bg-white/[0.02] p-8 ring-1 ring-white/10 shadow-lg">
            <h3 className="text-lg font-bold text-white mb-4">2. 다점포(프랜차이즈) 관리 계정은 어떻게 신청하나요?</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              본사(HQ) 권한을 원하시는 경우, 엔터프라이즈 전용 기술 지원을 통해 별도 신청하셔야 합니다. 우측 하단의 고객센터 연락처를 통해 도입 문의를 남겨주세요.
            </p>
          </div>

          <div className="rounded-2xl bg-white/[0.02] p-8 ring-1 ring-white/10 shadow-lg">
            <h3 className="text-lg font-bold text-white mb-4">3. 탈퇴 시 기존 데이터는 복구할 수 있나요?</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              아니요, 개인정보 보호법에 따라 탈퇴 즉시 계정과 연동된 모든 데이터가 파기되며, 어떠한 경우에도 복구가 불가능합니다.
            </p>
          </div>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl bg-gradient-to-br from-[#1a1c2e] to-[#2d1b4e] p-8 ring-1 ring-white/10 shadow-xl border border-white/5">
            <div className="h-10 w-10 rounded-full bg-violet-500/20 flex items-center justify-center mb-4 text-violet-400">
              <Phone size={20} />
            </div>
            <h4 className="font-bold text-white mb-2">고객센터 전화 문의</h4>
            <p className="text-sm text-zinc-400">1588-0000<br />(평일 10:00 - 18:00)</p>
          </div>

          <div className="rounded-2xl bg-white/[0.02] p-8 ring-1 ring-white/10 shadow-xl border border-white/5">
            <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center mb-4 text-zinc-400">
              <Mail size={20} />
            </div>
            <h4 className="font-bold text-white mb-2">이메일 문의</h4>
            <p className="text-sm text-zinc-400">support@reviewguard.com<br />24시간 접수 가능 (순차 답변)</p>
          </div>
        </div>
      </div>
    </main>
  );
}
