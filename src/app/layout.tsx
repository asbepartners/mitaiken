import type { Metadata } from "next";
import "./globals.css";

const title = "わたしのはじめて帖";
const description = "まだ知らない「やってみたい」を見つけて、未来の楽しみとして貯めるノート。";

export const metadata: Metadata = {
  metadataBase: new URL("https://hajimetecho.jp"),
  title,
  description,
  applicationName: title,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title,
  },
  openGraph: {
    title,
    description,
    url: "/",
    siteName: title,
    locale: "ja_JP",
    type: "website",
    images: [{ url: "/header-explore-v4.png", width: 1920, height: 819 }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/header-explore-v4.png"],
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
