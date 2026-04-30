import Link from "next/link";
import Footer from "@/app/components/Footer";

export default function TermsPage() {
  return (
    <div className="min-h-dvh bg-[#0f1117] text-zinc-100 flex flex-col">
      <header className="border-b border-white/5 bg-[#0f1117]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-6 py-4">
          <Link href="/" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
               <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <span className="text-lg font-bold tracking-tight">이용약관</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl w-full px-6 py-10 flex-1">
        <div className="rounded-2xl bg-[#161822] p-8 ring-1 ring-white/5">
           <h1 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">제1조 (목적)</h1>
           <p className="text-sm text-zinc-400 leading-relaxed">
             본 약관은 ReviewGuard (이하 "회사"라 함)가 제공하는 B2B 서비스의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항 등을 규정함을 목적으로 합니다.
             <br /><br />
             (본 페이지는 전자상거래법 심사를 위한 임시 더미 페이지입니다. 추후 정식 법률 자문을 거친 전문이 업데이트될 예정입니다.)
           </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
