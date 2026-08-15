import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "はじめてちょう",
    short_name: "はじめてちょう",
    description: "まだ知らない「やってみたい」を見つけて、未来の楽しみとして貯めるノート。",
    start_url: "/mitaiken/",
    display: "standalone",
    background_color: "#faf5e9",
    theme_color: "#faf5e9",
    lang: "ja",
  };
}
