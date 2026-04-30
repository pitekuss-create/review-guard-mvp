"use client";

import { useState } from "react";
import Link from "next/link";
import Footer from "@/app/components/Footer";

const mockInvoices = [
  { 
    id: "INV-26030199", 
    date: "2026-03-01 14:22:00", 
    item: "ReviewGuard Enterprise 무제한 라이선스 (연간)", 
    price: 9000000, 
    vat: 900000, 
    total: 9900000 
  }
];

export default function BillingPage() {
  const [bizNum, setBizNum] = useState("");
  const [repName, setRepName] = useState("");
  const [savingTax, setSavingTax] = useState(false);
  const [receiptModal, setReceiptModal] = useState<typeof mockInvoices[0] | null>(null);

  const handleSaveTaxInfo = () => {
    setSavingTax(true);
    setTimeout(() => {
      alert("세금계산서 발행 정보가 유효성 검증을 거쳐 저장되었습니다.");
      setSavingTax(false);
    }, 600);
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
          <span className="text-lg font-bold tracking-tight">결제 및 세무 정보 관리</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl w-full px-6 py-10 flex-1">
        <div className="mb-10">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">구독 관리</h1>
          <p className="mt-2 text-sm text-zinc-500">현재 이용 중인 요금제와 결제 내역을 확인할 수 있습니다.</p>
        </div>

        {/* ── 현재 플랜 ── */}
        <section className="mb-8 rounded-2xl bg-[#161822] p-6 ring-1 ring-white/5 shadow-xl">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-amber-400">⚡</span> 현재 구독 중인 플랜
          </h2>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl bg-white/5 p-5">
             <div className="flex flex-col gap-1">
               <div className="flex items-center gap-2">
                 <span className="font-bold text-xl text-white">HQ 통합 관제 플랜</span>
                 <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">Active</span>
               </div>
               <span className="text-sm text-zinc-400">현재 프랜차이즈 본사 전용 무제한 가맹점 연동 라이선스를 이용 중입니다.</span>
               <span className="text-sm text-zinc-500 mt-1">다음 결제 예정일: <strong className="text-zinc-200">2027년 3월 1일 (연간 계약)</strong></span>
             </div>
             <Link href="/pricing" className="inline-flex h-10 items-center justify-center rounded-lg bg-white px-5 text-sm font-bold text-black transition active:scale-95 shadow-md">
               구독 활성화/업그레이드
             </Link>
          </div>
        </section>

        {/* ── 세금계산서 발행 정보 ── */}
        <section className="mb-8 rounded-2xl bg-[#161822] p-6 ring-1 ring-white/5 shadow-xl">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-blue-400">🏢</span> 세금계산서 발행 정보
          </h2>
          <p className="text-xs text-zinc-500 mb-5 leading-relaxed">
            비즈니스(B2B) 결제 증빙을 위한 필수 정보입니다. 정확하게 입력해 주셔야 전자세금계산서가 자동 발행됩니다.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
             <div>
               <label className="block text-xs font-semibold text-zinc-400 mb-2">사업자등록번호 (- 없이 입력)</label>
               <input 
                 type="text" 
                 placeholder="1234567890"
                 value={bizNum}
                 onChange={(e) => setBizNum(e.target.value)}
                 className="w-full rounded-lg bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none ring-1 ring-white/10 transition focus:ring-blue-500/50"
               />
             </div>
             <div>
               <label className="block text-xs font-semibold text-zinc-400 mb-2">대표자명</label>
               <input 
                 type="text" 
                 placeholder="홍길동"
                 value={repName}
                 onChange={(e) => setRepName(e.target.value)}
                 className="w-full rounded-lg bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none ring-1 ring-white/10 transition focus:ring-blue-500/50"
               />
             </div>
          </div>
          <div className="flex justify-end">
             <button 
               onClick={handleSaveTaxInfo}
               disabled={savingTax || !bizNum || !repName}
               className="h-10 rounded-lg bg-blue-600 px-6 text-sm font-bold text-white transition hover:bg-blue-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
             >
               {savingTax ? "저장 중..." : "저장하기"}
             </button>
          </div>
        </section>

        {/* ── 결제 내역 ── */}
        <section className="mb-8 rounded-2xl bg-[#161822] p-6 ring-1 ring-white/5 shadow-xl">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-zinc-400">🧾</span> 결제 내역
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-400">
              <thead className="border-b border-white/10 text-xs font-semibold text-zinc-500">
                <tr>
                  <th className="py-3 px-2">결제 일자</th>
                  <th className="py-3 px-2">상품명</th>
                  <th className="py-3 px-2">결제 금액</th>
                  <th className="py-3 px-2">영수증</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {mockInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-2 whitespace-nowrap">{inv.date.split(" ")[0]}</td>
                    <td className="py-3 px-2 text-zinc-200">{inv.item}</td>
                    <td className="py-3 px-2 font-medium">₩{inv.total.toLocaleString()}</td>
                    <td className="py-3 px-2">
                      <button 
                         onClick={() => setReceiptModal(inv)}
                         className="rounded bg-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/20 transition"
                      >
                        인보이스 보기
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <Footer />

      {/* ── 인보이스 모달 (PG 심사용 엄격 포맷) ── */}
      {receiptModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setReceiptModal(null)} />
          <div className="relative w-full max-w-sm rounded-[24px] bg-white p-6 shadow-2xl animate-[fadeSlideDown_0.2s_ease-out] text-black">
            <div className="flex justify-between items-center mb-6 border-b border-zinc-200 pb-4">
               <div>
                 <h3 className="font-bold text-xl tracking-tight text-zinc-900">결제 영수증</h3>
                 <p className="text-xs text-zinc-500 mt-1">{receiptModal.id}</p>
               </div>
               <button onClick={() => setReceiptModal(null)} className="text-zinc-400 hover:text-black transition">
                 <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                   <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                 </svg>
               </button>
            </div>
            
            <div className="mb-6">
              <div className="flex justify-between items-center py-2 text-sm border-b border-dashed border-zinc-200">
                <span className="text-zinc-600 font-medium">거래 일자</span>
                <span className="font-semibold">{receiptModal.date}</span>
              </div>
              <div className="flex justify-between items-center py-2 text-sm border-b border-dashed border-zinc-200">
                <span className="text-zinc-600 font-medium">서비스 항목</span>
                <span className="font-semibold text-right max-w-[60%]">{receiptModal.item}</span>
              </div>
            </div>

            <div className="rounded-xl bg-zinc-50 p-4 mb-4 border border-zinc-200">
               <div className="flex justify-between items-center mb-2 text-sm">
                 <span className="text-zinc-500">공급 가액</span>
                 <span>₩{receiptModal.price.toLocaleString()}</span>
               </div>
               <div className="flex justify-between items-center mb-2 text-sm">
                 <span className="text-zinc-500">부가세 (VAT)</span>
                 <span>₩{receiptModal.vat.toLocaleString()}</span>
               </div>
               <div className="flex justify-between items-center mt-3 pt-3 border-t border-zinc-200 text-lg">
                 <span className="font-bold">총 결제 금액</span>
                 <span className="font-bold text-blue-600">₩{receiptModal.total.toLocaleString()}</span>
               </div>
            </div>

            <button onClick={() => setReceiptModal(null)} className="w-full mt-4 bg-zinc-900 text-white font-bold py-3.5 rounded-xl hover:bg-black transition active:scale-95">
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
