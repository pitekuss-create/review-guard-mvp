"use client";

import { useRouter } from "next/navigation";

export default function PaymentFailPage() {
  const router = useRouter();

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-[#0f1117] text-white p-6">
      <div className="w-full max-w-sm text-center bg-[#161822] p-8 rounded-[24px] ring-1 ring-white/10 shadow-2xl">
         <div className="mx-auto w-16 h-16 bg-rose-500/20 text-rose-500 flex items-center justify-center rounded-full mb-6 text-2xl">
           <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
           </svg>
         </div>
         <h1 className="text-xl font-bold mb-4">결제 실패</h1>
         <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
           결제 처리 중 문제가 발생했습니다.<br/>
           잔액 부족이나 한도 초과 등 카드 상태를 확인하신 후 다시 시도해 주세요.
         </p>
         <button 
           onClick={() => router.push('/pricing')}
           className="w-full bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold py-4 rounded-xl transition"
         >
           요금제 페이지로 돌아가기
         </button>
      </div>
    </div>
  );
}
