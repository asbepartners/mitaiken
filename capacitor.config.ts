import type { CapacitorConfig } from "@capacitor/cli";

// ライブURL読み込み型（#21で決定）: 本番の hajimetecho.jp をそのままWebViewで表示する。
// webDir は cap add/sync がファイルの存在を要求するためのプレースホルダーで、
// server.url が設定されている間はアプリの実際の表示内容には使われない。
const config: CapacitorConfig = {
  appId: "jp.hajimetecho.app",
  appName: "わたしのはじめて帖",
  webDir: "out",
  server: {
    url: "https://hajimetecho.jp",
  },
};

export default config;
