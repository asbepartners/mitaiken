import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "わたしのはじめて帖",
  description: "まだ知らない「やってみたい」を見つけて、未来の楽しみとして貯めるノート。",
  applicationName: "わたしのはじめて帖",
  manifest: "/mitaiken/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "わたしのはじめて帖",
  },
};

export const viewport = {
  themeColor: "#faf5e9",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-ivory font-body">{children}</body>
    </html>
  );
}
