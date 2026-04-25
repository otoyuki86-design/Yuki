import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "就活マネージャー",
  description: "就職活動の進捗・企業情報を一元管理するツール",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="h-full">
      <body className="h-full bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
