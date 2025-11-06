import type { Metadata } from "next";
import "./globals.css";
import "@fontsource-variable/noto-sans-kr";

export const metadata: Metadata = {
  title: "소개팅이 열립니다",
  description:
    "지하철 반대편 첫인상으로 연결되는 새로운 소개팅 실험. 오픈 알림을 받아보세요.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased bg-[#FFF5F5] text-[#222] font-sans">
        {children}
      </body>
    </html>
  );
}
