"use client";

import Link from "next/link";
import { Shield, QrCode, Zap, TrendingUp, Star, ChevronDown, CheckCircle2, ArrowRight, MapPin, BarChart2, Target } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/* ─────────────────────────────────────────────────────────────
   Tiny hook: IntersectionObserver for scroll-reveal
───────────────────────────────────────────────────────────── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0, rootMargin: "100px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

/* ─────────────────────────────────────────────────────────────
   Animated counter
───────────────────────────────────────────────────────────── */
function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const { ref, visible } = useReveal();
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const step = target / 60;
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [visible, target]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ─────────────────────────────────────────────────────────────
   Main Page
───────────────────────────────────────────────────────────── */
export default function Home() {
  const agitRef = useReveal();
  const featRef = useReveal();
  const statsRef = useReveal();
  const [isEnterpriseModalOpen, setIsEnterpriseModalOpen] = useState(false);

  return (
    <main className="min-h-screen bg-[#050A14] text-white overflow-x-hidden font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&family=Bebas+Neue&display=swap');

        * { font-family: 'Noto Sans KR', sans-serif; }

        .bebas { font-family: 'Bebas Neue', sans-serif; }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-14px); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.9); opacity: 0.8; }
          70% { transform: scale(1.3); opacity: 0; }
          100% { transform: scale(0.9); opacity: 0; }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px #0af, 0 0 40px #0af2; }
          50% { box-shadow: 0 0 40px #0af, 0 0 80px #0af4; }
        }
        @keyframes scanLine {
          0% { top: 0%; }
          100% { top: 100%; }
        }
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes starPop {
          0% { transform: scale(0) rotate(-20deg); opacity: 0; }
          80% { transform: scale(1.2) rotate(5deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }

        .animate-float { animation: float 3.5s ease-in-out infinite; }
        .animate-pulse-ring { animation: pulse-ring 2s ease-out infinite; }
        .animate-shimmer {
          background: linear-gradient(90deg, #00aaff 0%, #00eeff 30%, #ffffff 50%, #00eeff 70%, #00aaff 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 3s linear infinite;
        }
        .animate-fadeUp { animation: fadeUp 0.7s cubic-bezier(.22,1,.36,1) both; }
        .animate-glow { animation: glow 2.5s ease-in-out infinite; }
        .ticker-inner { animation: ticker 20s linear infinite; }

        .reveal { opacity: 0; transform: translateY(30px); transition: opacity 0.7s ease, transform 0.7s ease; }
        .reveal.visible { opacity: 1; transform: translateY(0); }

        .card-hover {
          transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
        }
        .card-hover:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 60px -10px rgba(0,170,255,0.25);
          border-color: rgba(0,170,255,0.5);
        }

        .btn-primary {
          position: relative;
          overflow: hidden;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .btn-primary::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
          transform: translateX(-100%);
          transition: transform 0.5s ease;
        }
        .btn-primary:hover::before { transform: translateX(100%); }
        .btn-primary:hover {
          transform: scale(1.04);
          box-shadow: 0 0 50px rgba(0,170,255,0.6), 0 10px 30px rgba(0,170,255,0.3);
        }
        .btn-primary:active { transform: scale(0.98); }

        .noise-bg {
          position: relative;
        }
        .noise-bg::after {
          content: '';
          position: absolute;
          inset: 0;
          opacity: 0.025;
          pointer-events: none;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
        }

        .grid-lines {
          background-image: linear-gradient(rgba(0,170,255,0.04) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0,170,255,0.04) 1px, transparent 1px);
          background-size: 60px 60px;
        }

        .step-num {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 5rem;
          line-height: 1;
          background: linear-gradient(135deg, rgba(0,170,255,0.15), rgba(0,170,255,0.02));
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>

      {/* ── NAVBAR (Fix: 모바일 대응 및 로그인 버튼 추가) ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 py-4 bg-[#050A14]/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Shield className="w-6 h-6 sm:w-7 sm:h-7 text-[#00aaff]" strokeWidth={2.5} />
            <div className="absolute inset-0 bg-[#00aaff]/20 rounded-full blur-md" />
          </div>
          <span className="text-base sm:text-lg font-black tracking-tight text-white">Review<span className="text-[#00aaff]">Guard</span></span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {/* 로그인 버튼 (모바일/PC 모두 노출) */}
          <Link
            href="/login"
            className="text-white/70 text-sm font-medium hover:text-white transition-colors"
          >
            로그인
          </Link>

          {/* 무료 체험 버튼 (모바일에서도 보이게 hidden 제거, 크기 조정) */}
          <Link
            href="/login"
            className="flex items-center gap-1.5 sm:gap-2 bg-[#00aaff]/10 border border-[#00aaff]/30 text-[#00aaff] px-3 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold hover:bg-[#00aaff]/20 transition-all duration-200"
          >
            무료 체험
            <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </Link>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════════
          HERO SECTION
      ══════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 pb-16 px-4 overflow-hidden noise-bg grid-lines">
        {/* Background orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-[#003380]/30 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-[#00aaff]/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 w-[250px] h-[250px] bg-[#0055ff]/10 rounded-full blur-[80px] pointer-events-none" />

        {/* Floating badge */}
        <div
          className="animate-float mb-8 flex items-center gap-2 bg-white/5 border border-[#00aaff]/20 px-5 py-2.5 rounded-full backdrop-blur-sm"
          style={{ animationDelay: "0s" }}
        >
          <div className="relative flex items-center justify-center w-5 h-5">
            <div className="animate-pulse-ring absolute w-4 h-4 rounded-full bg-[#00ff88]/40" />
            <div className="w-2 h-2 rounded-full bg-[#00ff88]" />
          </div>
          <span className="text-sm font-medium text-white/80">네이버 플레이스 1위 달성 솔루션</span>
        </div>

        {/* Main headline */}
        <h1
          className="text-center mb-5 leading-tight animate-fadeUp"
          style={{ animationDelay: "0.1s" }}
        >
          <span className="block text-[clamp(2.8rem,9vw,7rem)] font-black tracking-tight">
            리뷰 1위부터
          </span>
          <span className="block text-[clamp(2.8rem,9vw,7rem)] font-black tracking-tight animate-shimmer">
            매출 1위까지.
          </span>
        </h1>

        {/* Sub headline */}
        <p
          className="text-[clamp(1.1rem,3vw,1.5rem)] text-white/60 font-medium text-center mb-3 animate-fadeUp"
          style={{ animationDelay: "0.25s" }}
        >
          네이버 플레이스 1위 부스터,{" "}
          <span className="text-[#00aaff] font-bold">ReviewGuard</span>
        </p>
        <p
          className="text-[clamp(0.9rem,2vw,1.1rem)] text-white/40 text-center mb-12 max-w-md animate-fadeUp"
          style={{ animationDelay: "0.35s" }}
        >
          스마트 관제 시스템이 리뷰를 수집·방어·분석하는 동안,
          <br />사장님은 음식에만 집중하세요.
        </p>

        {/* CTA Button */}
        <div
          className="animate-fadeUp flex flex-col sm:flex-row gap-4 items-center"
          style={{ animationDelay: "0.45s" }}
        >
          <Link
            href="/pricing"
            className="btn-primary animate-glow inline-flex items-center gap-3 bg-gradient-to-r from-[#0088ff] to-[#00ccff] text-white font-black text-[clamp(1rem,2.5vw,1.2rem)] px-10 py-5 rounded-2xl shadow-2xl"
          >
            무료로 시작하기
            <ArrowRight className="w-5 h-5" />
          </Link>
          <span className="text-white/30 text-sm">신용카드 불필요 · 즉시 시작</span>
        </div>

        {/* Trust indicators */}
        <div
          className="mt-16 flex flex-wrap justify-center gap-6 sm:gap-10 animate-fadeUp"
          style={{ animationDelay: "0.6s" }}
        >
          {[
            { icon: <Star className="w-4 h-4 text-amber-400 fill-amber-400" />, label: "평균 리뷰 증가", value: "+340%" },
            { icon: <TrendingUp className="w-4 h-4 text-[#00aaff]" />, label: "플레이스 순위 상승", value: "94%" },
            { icon: <CheckCircle2 className="w-4 h-4 text-[#00ff88]" />, label: "분석 상권 데이터", value: "2,800+" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2.5 text-sm text-white/50">
              {item.icon}
              <span>{item.label}</span>
              <span className="font-bold text-white/90">{item.value}</span>
            </div>
          ))}
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/20 animate-bounce">
          <ChevronDown className="w-5 h-5" />
        </div>
      </section>

      {/* ── TICKER TAPE ── */}
      <div className="py-4 bg-[#0088ff]/10 border-y border-[#0088ff]/20 overflow-hidden">
        <div className="ticker-inner flex gap-16 whitespace-nowrap text-[#00aaff] font-bold text-sm">
          {Array.from({ length: 2 }).map((_, i) => (
            <span key={i} className="flex gap-16">
              {["리뷰 수집 자동화", "AI 악성 리뷰 차단", "경쟁사 키워드 추출", "네이버 플레이스 1위", "매출 역전 달성", "14일 무료 체험", "리뷰 수집 자동화", "AI 악성 리뷰 차단", "경쟁사 키워드 추출", "네이버 플레이스 1위"].map((t, idx) => (
                <span key={`${t}-${idx}`} className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00aaff] inline-block" />
                  {t}
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          AGITATION SECTION
      ══════════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#050A14] via-[#080f1e] to-[#050A14]" />

        <div
          ref={agitRef.ref}
          className={`reveal ${agitRef.visible ? "visible" : ""} relative max-w-5xl mx-auto`}
        >
          {/* Section label */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-px bg-[#ff4444]" />
            <span className="text-[#ff4444] text-sm font-bold tracking-widest uppercase">현실 직시</span>
            <div className="w-12 h-px bg-[#ff4444]" />
          </div>

          {/* Headline */}
          <h2 className="text-center text-[clamp(1.8rem,5vw,3.5rem)] font-black leading-tight mb-6">
            배달앱 수수료{" "}
            <span className="relative">
              <span className="text-[#ff4444]">30%</span>
              <span className="absolute -top-1 -right-4 text-xl">💸</span>
            </span>
            ,<br />
            남는 게{" "}
            <span className="relative inline-block">
              있으십니까?
              <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 200 12" fill="none">
                <path d="M2 8 C50 2, 150 2, 198 8" stroke="#ff4444" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </span>
          </h2>

          <p className="text-center text-[clamp(1.1rem,2.5vw,1.4rem)] text-white/60 mb-16 max-w-2xl mx-auto leading-relaxed">
            해답은 마진율 <span className="text-[#00ff88] font-black text-[clamp(1.3rem,3vw,1.8rem)]">100%</span>의{" "}
            <span className="text-white font-bold">'홀(Offline) 매출'</span>입니다.
            <br />네이버 플레이스 1위 매장이 홀 손님을 쓸어담는 이유, 알고 계신가요?
          </p>

          {/* Pain cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                icon: "💀",
                title: "배달 의존 함정",
                desc: "배달앱 수수료 15~30% 지출 후, 순이익은 거의 0에 가깝습니다.",
                color: "#ff4444",
              },
              {
                icon: "😡",
                title: "악성 리뷰의 공포",
                desc: "경쟁사 댓글 테러 1건이 신규 고객 수십 명을 날려버립니다.",
                color: "#ff8800",
              },
              {
                icon: "📉",
                title: "검색 순위 하락",
                desc: "리뷰 수가 밀리면 네이버 알고리즘에서 점점 뒤로 밀려납니다.",
                color: "#ff4488",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="card-hover bg-white/[0.03] border border-white/8 rounded-2xl p-7 relative overflow-hidden group"
                style={{ borderColor: `${card.color}22` }}
              >
                <div
                  className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
                  style={{ background: card.color }}
                />
                <div className="text-4xl mb-4">{card.icon}</div>
                <h3 className="text-lg font-black mb-2" style={{ color: card.color }}>
                  {card.title}
                </h3>
                <p className="text-white/60 text-sm leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          STATS SECTION
      ══════════════════════════════════════════════════════════ */}
      <section className="py-16 px-4 bg-gradient-to-r from-[#001833] via-[#00254d] to-[#001833] border-y border-[#00aaff]/10">
        <div
          ref={statsRef.ref}
          className={`reveal ${statsRef.visible ? "visible" : ""} max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8`}
        >
          {[
            { value: 2800, suffix: "+", label: "분석 상권 데이터" }, // Fix: 과대광고 방지 워딩 수정
            { value: 340, suffix: "%", label: "평균 리뷰 증가율" },
            { value: 94, suffix: "%", label: "1페이지 달성률" },
            { value: 14, suffix: "일", label: "무료 체험" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-[clamp(2rem,5vw,3.5rem)] font-black text-[#00aaff] leading-none">
                <Counter target={s.value} suffix={s.suffix} />
              </div>
              <div className="text-white/50 text-sm mt-1 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FEATURES (3-STEP) SECTION
      ══════════════════════════════════════════════════════════ */}
      <section className="py-28 px-4 relative overflow-hidden noise-bg">
        <div className="absolute inset-0 grid-lines opacity-50" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#00aaff]/5 rounded-full blur-[100px] pointer-events-none" />

        <div
          ref={featRef.ref}
          className={`reveal ${featRef.visible ? "visible" : ""} relative max-w-5xl mx-auto`}
        >
          {/* Label */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-px bg-[#00aaff]" />
            <span className="text-[#00aaff] text-sm font-bold tracking-widest uppercase">How It Works</span>
            <div className="w-12 h-px bg-[#00aaff]" />
          </div>

          <h2 className="text-center text-[clamp(2rem,5vw,3.5rem)] font-black mb-4 leading-tight">
            단 <span className="text-[#00aaff]">3단계</span>로
            <br />지역 1위를 만듭니다
          </h2>
          <p className="text-center text-white/50 text-[clamp(0.95rem,2vw,1.1rem)] mb-20 max-w-xl mx-auto">
            복잡한 마케팅 지식 없이도, 자동화된 시스템이 알아서 결과를 만들어냅니다.
          </p>

          {/* Steps */}
          <div className="space-y-6">
            {[
              {
                step: "01",
                icon: <QrCode className="w-8 h-8" />,
                color: "#00aaff",
                bg: "from-[#00aaff]/10 to-transparent",
                badge: "리뷰 수집",
                title: "테이블 QR 수집",
                subtitle: "고객 동선 방해 없는 압도적 리뷰 확보",
                desc: "계산 후 자연스럽게 QR 스캔 → 리뷰 작성까지, 고객 동선에 완벽히 녹아든 수집 플로우. 기존 대비 최대 8배 더 많은 리뷰를 자동으로 확보합니다.",
                points: ["QR 스캔 1회로 리뷰 완료", "카카오톡 연동 즉시 발송", "재방문 쿠폰 자동 지급"],
              },
              {
                step: "02",
                icon: <Shield className="w-8 h-8" />,
                color: "#00ff88",
                bg: "from-[#00ff88]/10 to-transparent",
                badge: "AI 방어",
                title: "리뷰 리스크 사전 방어 (비밀 소리함)",
                subtitle: "악플은 거르고 고품질 리뷰만 네이버에 꽂아 넣음",
                desc: "감성 분석 알고리즘이 부정적 피드백을 감지하고, 네이버 리뷰 대신 점주 전용 비밀 소리함으로 유도하여 별점 테러를 차단합니다.",
                points: ["악성 리뷰 사전 차단 99.3%", "감성 분석 기반 자동 필터링", "법적 대응 리포트 자동 생성"],
              },
              {
                step: "03",
                icon: <Target className="w-8 h-8" />,
                color: "#ff8800",
                bg: "from-[#ff8800]/10 to-transparent",
                badge: "경쟁 분석",
                title: "경쟁사 타겟팅",
                subtitle: "지역 1위 매장의 핵심 키워드 자동 추출",
                desc: "우리 상권 1위 매장이 어떤 키워드로 상위 노출되는지 실시간 추적·분석. 그 키워드를 우리 매장 리뷰에 자연스럽게 반영해 검색 순위를 역전시킵니다.",
                points: ["상위 10개 매장 키워드 분석", "우리 매장 리뷰 자동 최적화", "주간 순위 변동 리포트"],
              },
            ].map((item, idx) => (
              <div
                key={item.step}
                className="card-hover group relative bg-white/[0.03] border border-white/8 rounded-3xl p-8 sm:p-10 overflow-hidden"
                style={{
                  borderColor: `${item.color}18`,
                  transitionDelay: `${idx * 0.1}s`,
                }}
              >
                {/* Gradient side accent */}
                <div
                  className={`absolute inset-0 bg-gradient-to-r ${item.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl`}
                />
                <div
                  className="absolute left-0 top-6 bottom-6 w-0.5 rounded-full"
                  style={{ background: item.color }}
                />

                <div className="relative flex flex-col sm:flex-row gap-6 sm:gap-10 items-start">
                  {/* Step number bg */}
                  <div className="hidden sm:block absolute right-0 top-0 step-num opacity-30 group-hover:opacity-60 transition-opacity duration-500">
                    {item.step}
                  </div>

                  {/* Icon */}
                  <div
                    className="flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ background: `${item.color}18`, color: item.color }}
                  >
                    {item.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <span
                        className="text-xs font-black tracking-widest px-3 py-1 rounded-full"
                        style={{ background: `${item.color}20`, color: item.color }}
                      >
                        STEP {item.step} · {item.badge}
                      </span>
                    </div>
                    <h3 className="text-[clamp(1.4rem,3vw,2rem)] font-black mb-1">
                      {item.title}
                    </h3>
                    <p className="text-white/60 font-medium mb-4 text-[clamp(0.9rem,2vw,1rem)]">
                      {item.subtitle}
                    </p>
                    <p className="text-white/45 text-sm leading-relaxed mb-5 max-w-xl">
                      {item.desc}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {item.points.map((pt) => (
                        <span
                          key={pt}
                          className="flex items-center gap-1.5 text-xs font-medium text-white/60 bg-white/5 px-3 py-1.5 rounded-full border border-white/8"
                        >
                          <CheckCircle2 className="w-3 h-3" style={{ color: item.color }} />
                          {pt}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SOCIAL PROOF
      ══════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4 bg-[#080f1e]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-[clamp(1.5rem,4vw,2.5rem)] font-black mb-14">
            실제 사용 사장님들의{" "}
            <span className="text-[#00aaff]">리얼 후기</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                name: "김○○ 사장님",
                store: "경기 수원 삼겹살집",
                stars: 5,
                text: "3개월 만에 리뷰 48개에서 312개로 늘었어요. 지금은 검색하면 첫 번째 나와요. 배달 주문보다 홀 손님이 더 많아졌습니다.",
                metric: "리뷰 +550%",
              },
              {
                name: "박○○ 사장님",
                store: "서울 강남 카페",
                stars: 5,
                text: "경쟁사가 악성 리뷰를 달아도 AI가 알아서 막아주니까 스트레스가 0이에요. 오히려 제 매장만 별점 4.9 유지하고 있습니다.",
                metric: "별점 4.9 유지",
              },
              {
                name: "이○○ 사장님",
                store: "부산 해운대 일식집",
                stars: 5,
                text: "경쟁사 키워드 분석 기능이 진짜 대박입니다. 1위 매장 키워드 심어줬더니 두 달 만에 저희 매장이 1위 됐어요.",
                metric: "지역 1위 달성",
              },
            ].map((review) => (
              <div
                key={review.name}
                className="card-hover bg-white/[0.03] border border-white/8 rounded-2xl p-7 flex flex-col gap-4"
              >
                <div className="flex gap-0.5">
                  {Array.from({ length: review.stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-white/70 text-sm leading-relaxed flex-1">"{review.text}"</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-black text-sm">{review.name}</p>
                    <p className="text-white/40 text-xs">{review.store}</p>
                  </div>
                  <span className="text-xs font-black text-[#00ff88] bg-[#00ff88]/10 px-3 py-1.5 rounded-full">
                    {review.metric}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          PRICING SECTION
      ══════════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 bg-[#050A14] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#080f1e] to-[#050A14] pointer-events-none" />
        <div className="relative max-w-6xl mx-auto">
          {/* Headline */}
          <div className="text-center mb-16">
            <h2 className="text-[clamp(1.8rem,5vw,3rem)] font-black text-white mb-4">
              투자 대비 확실한 매출 상승, <span className="text-[#00aaff]">요금제</span>
            </h2>
            <p className="text-white/60 text-[clamp(1rem,2vw,1.2rem)] font-medium">
              숨겨진 비용 없이, 매장 규모에 맞는 플랜을 선택하십시오.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 lg:gap-8 lg:items-stretch">
            {/* 1. Basic 플랜 */}
            <div className="card-hover bg-white/[0.03] border border-white/8 rounded-3xl p-8 flex flex-col h-full relative mt-4 md:mt-0 md:translate-y-4 lg:translate-y-6">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-2">Basic</h3>
                <p className="text-white/50 text-sm">개인 매장 기본형</p>
              </div>
              <div className="mb-8 relative h-[60px]">
                <div className="text-4xl font-black text-white">₩29,000 <span className="text-lg font-medium text-white/50">/ 월</span></div>
                <p className="text-[#00aaff] text-sm font-bold absolute bottom-0 left-0">결제 없이 오늘 가입 시 14일간 0원</p>
              </div>
              <div className="flex-1 space-y-4 mb-8">
                {[
                  "[강조] 매장 전용 '리뷰 부스터' 테이블 텐트 무료 제공",
                  "1점 테러 사전 방어 '비밀 소리함' 시스템",
                  "맞춤형 리뷰 답글 초안 자동 생성",
                  "네이버 플레이스 리뷰 통합 대시보드",
                  "주간 리뷰 감성 및 키워드 요약 리포트"
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 text-left">
                    <CheckCircle2 className="w-5 h-5 text-[#00aaff] shrink-0" />
                    <span className="text-white/80 text-sm leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/pricing"
                className="btn-primary w-full block text-center bg-[#00aaff] text-white font-bold py-4 rounded-xl transition-all mt-auto"
              >
                베이직 플랜 시작하기
              </Link>
            </div>

            {/* 2. Pro 플랜 (가장 강조) */}
            <div className="relative group z-10 md:scale-105 h-full transition-transform">
              <div className="absolute inset-0 bg-[#00aaff]/20 rounded-3xl blur-xl animate-glow opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <div className="bg-[#0a1526] border border-[#00aaff] rounded-3xl p-8 flex flex-col h-full relative shadow-[0_0_40px_rgba(0,170,255,0.3)]">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#00aaff] text-white text-xs font-bold px-4 py-1.5 rounded-full whitespace-nowrap shadow-[0_0_15px_rgba(0,170,255,0.6)]">
                  가장 많이 선택하는 플랜
                </div>
                <div className="mb-6 mt-2">
                  <h3 className="text-xl font-bold text-[#00aaff] mb-2">Pro</h3>
                  <p className="text-white/50 text-sm">개인 매장 프리미엄형</p>
                </div>
                <div className="mb-8 relative h-[60px]">
                  <div className="text-4xl font-black text-white">₩79,000 <span className="text-lg font-medium text-white/50">/ 월</span></div>
                </div>
                <div className="flex-1 space-y-4 mb-8">
                  {[
                    "[Basic 플랜 모든 기능 포함]",
                    "상권 내 타겟 키워드 자동 분석 및 답글 주입",
                    "핵심 경쟁사 플레이스 트래픽 맹추격 레이더",
                    "부정 리뷰 발생 시 스마트폰 즉각 알림",
                    "경쟁사 대비 매장 성장률 분석 리포트"
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 text-left">
                      <CheckCircle2 className="w-5 h-5 text-[#00aaff] shrink-0" />
                      <span className="text-white/90 text-sm leading-relaxed font-medium">{item}</span>
                    </div>
                  ))}
                </div>
                <Link
                  href="/pricing"
                  className="w-full text-center border border-[#00aaff] text-[#00aaff] font-bold py-4 rounded-xl hover:bg-[#00aaff]/10 transition-all mt-auto"
                >
                  Pro 플랜 시작하기
                </Link>
              </div>
            </div>

            {/* 3. Enterprise 플랜 */}
            <div className="card-hover bg-white/[0.03] border border-white/8 rounded-3xl p-8 flex flex-col h-full relative mt-4 md:mt-0 md:translate-y-4 lg:translate-y-6">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-2">Enterprise</h3>
                <p className="text-white/50 text-sm">프랜차이즈 전용</p>
              </div>
              <div className="mb-8 relative h-[60px]">
                <div className="text-4xl font-black text-white">상담 문의</div>
              </div>
              <div className="flex-1 space-y-4 mb-8">
                {[
                  "[Pro 플랜 모든 기능 포함]",
                  "권한별(본사/슈퍼바이저/가맹점) 통합 관제 대시보드",
                  "전국 가맹점 리뷰 리스크 랭킹 및 신호등 모니터링",
                  "본사 ➔ 가맹점 데이터 실시간 통합 동기화"
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 text-left">
                    <CheckCircle2 className="w-5 h-5 text-[#00aaff] shrink-0" />
                    <span className="text-white/80 text-sm leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setIsEnterpriseModalOpen(true)}
                className="w-full block text-center bg-[#1a2333] hover:bg-[#253247] text-white font-bold py-4 rounded-xl transition-all border border-white/10 mt-auto"
              >
                프랜차이즈 도입 문의
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FINAL CTA SECTION
      ══════════════════════════════════════════════════════════ */}
      <section className="relative py-32 px-4 overflow-hidden">
        {/* Deep background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#001028] via-[#00204a] to-[#001028]" />
        <div className="absolute inset-0 grid-lines opacity-30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-[#0055cc]/25 rounded-full blur-[120px] pointer-events-none" />

        {/* Decorative corner lines */}
        <div className="absolute top-8 left-8 w-20 h-20 border-l-2 border-t-2 border-[#00aaff]/30 rounded-tl-xl" />
        <div className="absolute top-8 right-8 w-20 h-20 border-r-2 border-t-2 border-[#00aaff]/30 rounded-tr-xl" />
        <div className="absolute bottom-8 left-8 w-20 h-20 border-l-2 border-b-2 border-[#00aaff]/30 rounded-bl-xl" />
        <div className="absolute bottom-8 right-8 w-20 h-20 border-r-2 border-b-2 border-[#00aaff]/30 rounded-br-xl" />

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Icon cluster */}
          <div className="flex items-center justify-center gap-4 mb-10">
            <div className="w-14 h-14 rounded-2xl bg-[#00aaff]/10 border border-[#00aaff]/20 flex items-center justify-center">
              <BarChart2 className="w-7 h-7 text-[#00aaff]" />
            </div>
            <div className="w-16 h-16 rounded-2xl bg-[#00aaff]/15 border border-[#00aaff]/30 flex items-center justify-center">
              <Shield className="w-8 h-8 text-[#00aaff]" />
            </div>
            <div className="w-14 h-14 rounded-2xl bg-[#00aaff]/10 border border-[#00aaff]/20 flex items-center justify-center">
              <MapPin className="w-7 h-7 text-[#00aaff]" />
            </div>
          </div>

          <h2 className="text-[clamp(2rem,6vw,4.5rem)] font-black leading-tight mb-6">
            매출 역전을 위한
            <br />
            <span className="animate-shimmer">가장 확실한 선택.</span>
          </h2>

          <p className="text-[clamp(1rem,2.5vw,1.3rem)] text-white/55 mb-4 max-w-2xl mx-auto leading-relaxed">
            지금 이 순간에도 경쟁 매장은 리뷰를 쌓고 있습니다.
            <br />
            <span className="text-white/80 font-bold">오늘 시작하지 않으면, 내일은 더 힘들어집니다.</span>
          </p>

          <p className="text-white/35 text-sm mb-14">
            14일 무료 체험 → 성과 확인 → 그다음에 결제 여부 결정
          </p>

          {/* Big CTA */}
          <Link
            href="/pricing"
            className="btn-primary animate-glow inline-flex items-center gap-4 bg-gradient-to-r from-[#0066ff] via-[#0099ff] to-[#00ccff] text-white font-black text-[clamp(1.1rem,2.5vw,1.4rem)] px-12 py-6 rounded-2xl shadow-2xl mb-8"
          >
            <Zap className="w-6 h-6" />
            무료 체험 시작하기
            <ArrowRight className="w-6 h-6" />
          </Link>

          {/* Micro guarantees */}
          <div className="flex flex-wrap justify-center gap-5 mt-8">
            {[
              { icon: <CheckCircle2 className="w-4 h-4 text-[#00ff88]" />, text: "신용카드 불필요" },
              { icon: <CheckCircle2 className="w-4 h-4 text-[#00ff88]" />, text: "즉시 시작 가능" },
              { icon: <CheckCircle2 className="w-4 h-4 text-[#00ff88]" />, text: "언제든 해지 가능" },
              { icon: <CheckCircle2 className="w-4 h-4 text-[#00ff88]" />, text: "전담 온보딩 지원" },
            ].map((g) => (
              <div key={g.text} className="flex items-center gap-2 text-white/50 text-sm">
                {g.icon}
                {g.text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER (Fix: 연도 2026 수정) ── */}
      <footer className="py-10 px-4 bg-[#030810] border-t border-white/5">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#00aaff]" strokeWidth={2.5} />
            <span className="font-black text-white">Review<span className="text-[#00aaff]">Guard</span></span>
          </div>
          <p className="text-white/25 text-xs text-center">
            © 2026 ReviewGuard. All rights reserved. · 사업자등록번호 000-00-00000
          </p>
          <div className="flex gap-5 text-white/30 text-xs">
            <Link href="/privacy" className="hover:text-white/60 transition-colors">개인정보처리방침</Link>
            <Link href="/terms" className="hover:text-white/60 transition-colors">이용약관</Link>
          </div>
        </div>
      </footer>

      {/* Enterprise Modal */}
      {isEnterpriseModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-black/60">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#0f1117] border border-white/10 p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsEnterpriseModalOpen(false)}
              className="absolute top-6 right-6 text-zinc-400 hover:text-white transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            
            <div className="mb-8 text-left">
              <h2 className="text-2xl font-black text-white flex items-center gap-2 mb-6">
                👑 Enterprise 프랜차이즈 도입 문의
              </h2>
              <p className="font-bold text-white text-lg mb-3 leading-relaxed">
                "단순한 관리 툴을 넘어, 프랜차이즈 본사의 압도적인 경쟁력이 되겠습니다."
              </p>
              <p className="text-zinc-400 text-sm leading-relaxed">
                가맹점 폐점 리스크를 실시간으로 방어하고, 신규 가맹점 유치 시 강력한 '본사 지원 혜택'으로 활용할 수 있는 최고의 파트너가 되어 드립니다.
              </p>
            </div>

            <div className="bg-white/5 rounded-2xl p-6 ring-1 ring-white/10 space-y-4 mb-8 text-left">
              <div className="flex items-start gap-3">
                <span className="text-xl">📞</span>
                <div>
                  <div className="text-sm font-bold text-white mb-1">담당자 직통 핫라인</div>
                  <div className="text-emerald-400 font-black text-lg">010-0000-0000</div>
                  <div className="text-xs text-zinc-500 mt-1">(부재 시 문자 남겨주시면 즉시 연락드립니다)</div>
                </div>
              </div>
              <div className="h-px bg-white/10 w-full" />
              <div className="flex items-start gap-3">
                <span className="text-xl">✉️</span>
                <div>
                  <div className="text-sm font-bold text-white mb-1">다이렉트 이메일</div>
                  <div className="text-blue-400 font-black text-base">ceo@reviewguard.com</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsEnterpriseModalOpen(false)}
              className="w-full rounded-xl bg-white py-4 text-sm font-bold text-black transition-all hover:bg-zinc-200 active:scale-95"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
