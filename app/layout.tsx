import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Trip Fixer · 서울 현장 가이드",
  description: "서울 여행 일정이 바뀌었을 때, 원하는 경험과 복귀 약속을 지킬 수 있는 다음 행동을 찾아보세요.",
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7f6ef",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
