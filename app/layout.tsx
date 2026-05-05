import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "USCPA 演習ログ",
  description: "USCPA試験の演習記録アプリ",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full bg-slate-50">{children}</body>
    </html>
  );
}
