import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "わたしのはじめて帖",
    short_name: "わたしのはじめて帖",
    description: "まだ知らない「やってみたい」を見つけて、未来の楽しみとして貯めるノート。",
    start_url: "/mitaiken/",
    display: "standalone",
    background_color: "#faf5e9",
    theme_color: "#faf5e9",
    lang: "ja",
    icons: [
      { src: "/mitaiken/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/mitaiken/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
