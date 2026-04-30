"use client";

import { useState } from "react";
import Link from "next/link";
import Footer from "@/app/components/Footer";

const faqs = [
  {
    q: "가맹점 추가 연동 시 과금 방식이 어떻게 되나요?",
    a: "결제 후 14일 이내라도, 고객의 QR 스캔이나 AI 리뷰 답글 생성이 단 1건이라도 발생한 경우 서비스 사용(디지털 콘텐츠 제공 개시)으로 간주하여 절대 환불이 불가합니다. 미사용 상태에서만 환불이 가능합니다."
  },
  {
    q: "전자세금계산서 발행이 가능한가요?",
    a: "네, B2B 결제의 경우 전자세금계산서 발행이 기본 적용됩니다. 대시보드의 [결제 및 세무 정보 관리]에서 사업자등록번호와 대표자명을 정확히 기재해 주시기 바랍니다."
  },
  {
    q: "본사 관리자(HQ_ADMIN) 계정은 몇 개까지 생성 가능한가요?",
    a: "네, 대시보드의 '키워드 설정' 화면에서 언제든지 매장의 주력 메뉴나 컨셉에 맞게 수정하실 수 있으며, 수정된 데이터는 이후 생성되는 AI 리뷰에 즉시 반영됩니다."
  },
  {
    q: "하위 가맹점의 대시보드 열람 권한을 통제할 수 있나요?",
    a: "현재는 1계정 1매장 원칙으로 운영되고 있으나, 조만간 프랜차이즈 및 대형 매장을 위한 다중 매장 관리 플랜이 업데이트될 예정입니다."
  }
];

export default function SupportPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    if (openIndex === idx) setOpenIndex(null);
    else setOpenIndex(idx);
  };

  return (
    <div className="min-h-dvh bg-[#0f1117] text-zinc-100 flex flex-col">
      {/* ── 헤더 ── */}
      <header className="border-b border-white/5 bg-[#0f1117]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-6 py-4">
          <Link href="/dashboard" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
               <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <span className="text-lg font-bold tracking-tight">고객 센터</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl w-full px-6 py-10 flex-1">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10 ring-1 ring-blue-500/20">
             <svg className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
               <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-white">무엇을 도와드릴까요?</h1>
          <div className="mt-4 inline-flex items-center gap-2 px-6 py-2 rounded-full bg-blue-500/10 border border-blue-500/30">
            <span className="text-xs font-black text-blue-400 uppercase tracking-widest">Enterprise Hotline</span>
            <span className="text-sm font-black text-white">1555-5555</span>
          </div>
          <p className="mt-4 text-sm text-zinc-400 max-w-lg mx-auto">
            자주 묻는 질문을 통해 빠르고 정확한 답변을 확인하세요.<br /> 
            해결되지 않은 문제가 있다면 언제든 기술 지원팀으로 이메일을 남겨주시면 신속히 도와드리겠습니다.
          </p>
        </div>

        {/* ── 이메일 문의 박스 ── */}
        <section className="mb-12 rounded-2xl bg-gradient-to-br from-indigo-900/40 to-blue-900/20 p-6 sm:p-8 ring-1 ring-white/10 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
           <div className="text-center sm:text-left">
             <h2 className="text-lg font-bold text-white mb-1">직접 전문가의 도움이 필요하신가요?</h2>
             <p className="text-sm text-indigo-200">운영시간: 평일 10:00 - 18:00 (주말/공휴일 제외)</p>
           </div>
           <a 
             href="mailto:support@reviewguard.ai" 
             className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-bold text-indigo-900 shadow-xl transition hover:bg-zinc-100 active:scale-95 whitespace-nowrap w-full sm:w-auto"
           >
             <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
               <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
             </svg>
             이메일 문의하기
           </a>
        </section>

        {/* ── FAQ 아코디언 ── */}
        <section>
          <h2 className="text-xl font-bold text-white mb-6">자주 묻는 질문 (FAQ)</h2>
          <div className="flex flex-col gap-3">
            {faqs.map((faq, idx) => {
              const isOpen = openIndex === idx;
              return (
                <div 
                  key={idx} 
                  className={`rounded-2xl border transition-colors ${isOpen ? 'border-white/20 bg-white/5' : 'border-white/5 bg-[#161822] hover:border-white/10'}`}
                >
                  <button 
                    onClick={() => toggleFaq(idx)}
                    className="flex w-full items-center justify-between p-5 text-left"
                  >
                    <span className={`font-semibold ${isOpen ? 'text-white' : 'text-zinc-300'}`}>{faq.q}</span>
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/5 text-zinc-400">
                      <svg 
                        className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-white' : ''}`} 
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="px-5 pb-5 pt-0 text-sm leading-relaxed text-zinc-400">
                       <div className="rounded-xl bg-black/20 p-4 border border-white/5">
                         {faq.a}
                       </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
