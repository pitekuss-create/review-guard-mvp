"use client";

import { useState } from "react";
import { X, Gift, Package, User, MapPin, Sparkles } from "lucide-react";

interface TableTentRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TableTentRequestModal({ isOpen, onClose }: TableTentRequestModalProps) {
  const [reward, setReward] = useState("");
  const [recipient, setRecipient] = useState("");
  const [address, setAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  if (!isOpen && !showSuccessToast) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // 🚀 API 연동 뼈대 (추후 서버 API /api/tent-request 생성 시 활성화)
      /*
      const response = await fetch('/api/tent-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reward, recipient, address }),
      });
      if (!response.ok) throw new Error('신청 실패');
      */
      
      // 2초간 로딩 스피너 (사용자 요청 사항)
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      setIsSubmitting(false);
      setShowSuccessToast(true);
      
      // 4초 후 토스트와 모달 닫기
      setTimeout(() => {
        setShowSuccessToast(false);
        onClose();
      }, 4000);
    } catch (error) {
      console.error("Tent request error:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[1000] animate-[toastSlideUp_0.4s_ease-out]">
          <div className="rounded-full bg-emerald-500/95 px-8 py-3.5 text-sm font-black text-white shadow-[0_15px_50px_rgba(0,0,0,0.6)] backdrop-blur-md ring-1 ring-white/20 whitespace-nowrap">
            ✅ 신청이 완료되었습니다! 영업일 기준 4~7일 내로 예쁜 테이블 텐트가 배송될 예정입니다.
          </div>
        </div>
      )}

      {isOpen && !showSuccessToast && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
          
          <div className="relative w-full max-w-4xl overflow-hidden rounded-[2.5rem] bg-[#1a1d2b] shadow-2xl ring-1 ring-white/10 animate-[roiModalIn_0.3s_ease-out]">
            {/* 상단 장식 그라데이션 */}
            <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500" />
            
            <button onClick={onClose} className="absolute top-6 right-6 text-zinc-500 hover:text-white transition z-10">
              <X size={24} />
            </button>

            <div className="flex flex-col lg:flex-row">
              {/* 좌측: 실물 이미지 시각화 */}
              <div className="w-full lg:w-[45%] bg-[#12141c] p-10 flex flex-col items-center justify-center border-r border-white/5 relative overflow-hidden">
                {/* 배경을 더 깊이 있게 표현하기 위한 오버레이 */}
                <div className="absolute inset-0 bg-black/20" />
                
                <img 
                  src="/images/table-tent-mockup.png" 
                  alt="테이블 텐트 샘플" 
                  className="relative z-10 w-full h-full object-contain drop-shadow-[0_20px_60px_rgba(0,0,0,0.7)]"
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-[#12141c] via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-10 left-0 right-0 text-center px-6">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-3 py-1 text-[10px] font-black text-white ring-1 ring-white/20 mb-3 uppercase tracking-widest">실물 예시</div>
                  <h4 className="text-white font-black text-2xl mb-2 drop-shadow-lg">프리미엄 테이블 텐트</h4>
                  <p className="text-zinc-300 text-sm font-bold leading-relaxed drop-shadow-md">
                    우리 매장만의 QR코드와<br />
                    리뷰 보상을 한 눈에 보여주세요.
                  </p>
                </div>
              </div>

              {/* 우측: 입력 폼 */}
              <div className="flex-1 p-8 lg:p-12">
                <div className="mb-8">
                  <div className="inline-flex items-center gap-2 rounded-full bg-teal-500/10 px-3 py-1 text-[10px] font-black text-teal-400 ring-1 ring-teal-500/30 mb-3">
                    <Sparkles size={10} /> SPECIAL BENEFIT
                  </div>
                  <h3 className="text-2xl font-black text-white tracking-tight">테이블 텐트 무료 신청</h3>
                  <p className="text-zinc-500 text-sm mt-1">리뷰 활성화를 위해 본사에서 제작비를 전액 지원합니다.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-xs font-black text-zinc-400 uppercase tracking-wider">
                      <Gift size={14} className="text-teal-500" /> 이벤트 내용 (보상)
                    </label>
                    <input
                      required
                      value={reward}
                      onChange={(e) => setReward(e.target.value)}
                      placeholder="예: 리뷰 작성 시 시원한 생맥주 1잔 무료!"
                      className="w-full rounded-xl bg-white/[0.03] px-4 py-3.5 text-sm text-white placeholder:text-zinc-600 outline-none ring-1 ring-white/10 focus:ring-teal-500/50 transition"
                    />
                    <p className="mt-3 text-sm text-emerald-400 leading-relaxed font-black">
                      💡 고객이 리뷰를 쓰게 만드는 가장 강력한 무기입니다! <br/>
                      원가 부담이 적고 매력적인 보상을 적어주세요. <br/>
                      <span className="text-zinc-400 font-medium text-xs">예: 리뷰 작성 시 이번 주 로또 1게임 증정! / 시원한 생맥주 1잔 무료!</span>
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="mb-2 flex items-center gap-2 text-xs font-black text-zinc-400 uppercase tracking-wider">
                        <User size={14} /> 수령인 이름 / 연락처
                      </label>
                      <input
                        required
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        placeholder="홍길동 / 010-0000-0000"
                        className="w-full rounded-xl bg-white/[0.03] px-4 py-3.5 text-sm text-white placeholder:text-zinc-600 outline-none ring-1 ring-white/10 focus:ring-teal-500/50 transition"
                      />
                    </div>
                    <div>
                      <label className="mb-2 flex items-center gap-2 text-xs font-black text-zinc-400 uppercase tracking-wider">
                        <MapPin size={14} /> 택배 받으실 매장 주소
                      </label>
                      <input
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="매장 상세 주소를 입력해주세요"
                        className="w-full rounded-xl bg-white/[0.03] px-4 py-3.5 text-sm text-white placeholder:text-zinc-600 outline-none ring-1 ring-white/10 focus:ring-teal-500/50 transition"
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <p className="mb-4 text-xs text-zinc-500 text-center">
                      ※ 제작 업체 및 시스템 내부 사정에 따라 안내된 배송 일자가 변경되거나 지연될 수 있습니다.
                    </p>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="group relative w-full overflow-hidden rounded-2xl bg-teal-600 py-4 text-sm font-black text-white shadow-xl shadow-teal-600/20 transition hover:bg-teal-500 active:scale-[0.98] disabled:opacity-70"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center justify-center gap-2">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          신청 처리 중...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <Package size={18} /> 무료로 신청하기
                        </div>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
