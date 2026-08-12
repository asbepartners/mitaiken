import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 同じWi-Fi上の別端末（iPad等）からLAN IP経由でdevサーバーに
  // アクセスできるようにする。未設定だとJS/HMRがブロックされ、
  // 画面は出てもボタン等が一切反応しなくなる。
  allowedDevOrigins: ["192.168.11.15"],
};

export default nextConfig;
