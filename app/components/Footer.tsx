import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full border-t border-white/10 bg-[#0f1117] px-6 py-10 mt-auto text-zinc-400">
      <div className="mx-auto max-w-7xl flex flex-col md:flex-row justify-between gap-6">
        <div className="flex flex-col gap-2 text-xs leading-relaxed">
          <div className="font-bold text-zinc-200 text-sm mb-1">ReviewGuard</div>
          <p>상호명: ReviewGuard AI | 대표: 홍길동 (임시)</p>
          <p>사업자등록번호: 123-45-67890 (임시)</p>
          <p>통신판매업신고번호: 2026-서울강남-1234 (임시)</p>
          <p>이메일 문의: <a href="mailto:support@reviewguard.ai" className="hover:text-white transition-colors">support@reviewguard.ai</a></p>
          <p className="mt-4 text-[11px] text-zinc-600">© 2026 ReviewGuard. All rights reserved.</p>
        </div>
        
        <div className="flex gap-4 text-xs font-medium">
          <Link href="/terms" className="hover:text-zinc-200 transition-colors">이용약관</Link>
          <Link href="/privacy" className="hover:text-zinc-200 transition-colors">개인정보처리방침</Link>
        </div>
      </div>
    </footer>
  );
}
