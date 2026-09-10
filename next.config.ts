import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // hajimetecho.jp is served from the domain root (no GitHub Pages project
  // subpath like /mitaiken anymore), so no basePath is needed.
  trailingSlash: true,
  // 同じWi-Fi上の別端末（iPad等）からLAN IP経由でdevサーバーに
  // アクセスできるようにする。未設定だとJS/HMRがブロックされ、
  // 画面は出てもボタン等が一切反応しなくなる。
  allowedDevOrigins: ["192.168.11.15"],
};

export default nextConfig;
