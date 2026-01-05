import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Storyhenge - AI 驅動的寫作平台",
  description: "讓 AI 成為你的編輯夥伴，專注於創作心流",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
