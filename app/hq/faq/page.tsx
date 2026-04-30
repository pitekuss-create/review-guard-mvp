"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Phone, Mail, HelpCircle } from "lucide-react";

export default function HqFAQPage() {
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
            엔터프라이즈 전용 고객센터 및 FAQ
          </h1>
          <p className="mt-4 text-zinc-400 font-medium">서비스 이용 중 궁금하신 점이나 도움이 필요하신가요?</p>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl bg-white/[0.02] p-8 ring-1 ring-white/10 shadow-lg">
            <h3 className="text-lg font-bold text-white mb-4">1. 전국 가맹점 데이터는 언제 동기화되나요?</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              본사 플랜은 실시간 API 연동을 통해 최대 1시간 주기로 전국 가맹점 데이터가 통합 동기화됩니다.
            </p>
          </div>

          <div className="rounded-2xl bg-white/[0.02] p-8 ring-1 ring-white/10 shadow-lg">
            <h3 className="text-lg font-bold text-white mb-4">2. 신규 가맹점이 오픈하면 어떻게 추가하나요?</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              담당 매니저에게 신규 가맹점의 네이버 플레이스 URL을 전달해 주시면 24시간 내에 관제 보드에 추가됩니다.
            </p>
          </div>

          <div className="rounded-2xl bg-white/[0.02] p-8 ring-1 ring-white/10 shadow-lg">
            <h3 className="text-lg font-bold text-white mb-4">3. 지역 슈퍼바이저에게 특정 매장 권한만 줄 수 있나요?</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              네, 우측 상단 '엔터프라이즈 계약 관리' 메뉴를 통해 슈퍼바이저별로 열람 가능한 가맹점을 지정할 수 있습니다.
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
