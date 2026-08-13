import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "未体験ゾーン",
  description: "まだ知らない「やってみたい」を見つけて、未来の楽しみとして貯めるノート。",
  applicationName: "未体験ゾーン",
  manifest: "/mitaiken/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "未体験ゾーン",
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
