"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { loadPaymentWidget, PaymentWidgetInstance } from "@tosspayments/payment-widget-sdk";
import { useStore } from "@/lib/store/useStore";

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan");
  const isYearly = searchParams.get("yearly") === "true";
  const router = useRouter();
  const currentStoreId = useStore((state) => state.currentStoreId);

  const [paymentWidget, setPaymentWidget] = useState<PaymentWidgetInstance | null>(null);
  const paymentMethodsWidgetRef = useRef(null);
  const initRef = useRef(false);

  const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!;
  // 고객 키는 랜덤 생성 (비회원결제 대응) 혹은 유저 ID. 화면 리렌더링마다 안바뀌게 ref 사용
  const customerKeyRef = useRef("anon-" + Math.random().toString(36).substring(2, 10));
  const customerKey = customerKeyRef.current;

  let amount = 29000; // 기본 BASIC 월간 금액
  if (plan === "pro") {
    amount = isYearly ? 41600 * 12 : 79000;
  } else {
    amount = isYearly ? 25000 * 12 : 29000;
  }
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    (async () => {
      try {
        const widget = await loadPaymentWidget(clientKey, customerKey);
        
        const paymentMethodsWidget = widget.renderPaymentMethods(
          "#payment-widget", 
          { value: amount }
        );
        widget.renderAgreement("#agreement");
        
        setPaymentWidget(widget);
        paymentMethodsWidgetRef.current = paymentMethodsWidget as any;
      } catch (err) {
        console.error("Toss widget load error:", err);
      }
    })();
  }, [clientKey, customerKey, amount]);

  const handlePayment = async () => {
    if (!paymentWidget) return;

    const orderId = "order-" + Math.random().toString(36).substring(2, 15);
    
    try {
      await paymentWidget.requestPayment({
        orderId: orderId,
        orderName: `ReviewGuard ${plan === 'pro' ? 'Pro' : 'Basic'} 플랜`,
        successUrl: `${window.location.origin}/payment/success?plan=${plan}&storeId=${currentStoreId || ''}`,
        failUrl: `${window.location.origin}/payment/fail`,
        customerEmail: "support@reviewguard.ai",
        customerName: "리뷰가드 사장님",
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (!plan) return null;

  return (
    <div className="min-h-dvh bg-[#0f1117] text-zinc-100 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xl bg-white text-zinc-900 rounded-[24px] p-8 shadow-2xl">
         <h1 className="text-2xl font-bold mb-2">결제하기</h1>
         <p className="mb-6 text-zinc-500 font-medium">ReviewGuard {plan === 'pro' ? 'Pro' : 'Basic'} 플랜 구독 안전 결제</p>
         
         {/* 토스 결제 UI 마운팅 영역 */}
         <div id="payment-widget" className="w-full mb-2 min-h-[300px]" />
         <div id="agreement" className="w-full mb-8 min-h-[100px]" />
         
         <button 
           onClick={handlePayment} 
           disabled={!paymentWidget}
           className="w-full bg-blue-600 py-4 rounded-xl text-white font-bold text-lg hover:bg-blue-700 transition disabled:opacity-50"
         >
           {amount.toLocaleString()}원 결제하기
         </button>
         
         <button onClick={() => router.push('/pricing')} className="w-full mt-4 text-zinc-500 font-semibold py-3 hover:bg-zinc-50 rounded-xl transition">
           취소하고 돌아가기
         </button>
      </div>
    </div>
  );
}
