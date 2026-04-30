import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

export const dynamic = 'force-dynamic';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "네이버 플레이스 1위 부스터 | ReviewGuard", template: "%s | ReviewGuard" },
  description: "리뷰 1위부터 매출 1위까지. 악성 리뷰는 차단하고 진성 리뷰는 늘려주는 오프라인 매장 전용 자동화 솔루션입니다.",
  keywords: ["네이버플레이스", "리뷰관리", "식당마케팅", "악플방어", "리뷰가드", "매출상승"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
