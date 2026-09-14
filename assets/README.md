# ストア公開用アイコン・スプラッシュ素材

`public/icons/icon-512.png`（既存のPWAアイコン）を元に、
[@capacitor/assets](https://github.com/ionic-team/capacitor-assets) が読む
標準構成でソース画像を用意したもの。iOS: Capacitorプロジェクトをセットアップする
（Issue #41）／Android: TWAプロジェクトをセットアップする（Issue #39）で、
このディレクトリを `npx @capacitor/assets generate` の入力として使う想定。

## ファイル

| ファイル | サイズ | 用途 |
| --- | --- | --- |
| `icon.png` | 1024x1024, 不透明 | iOS/汎用アプリアイコンのソース |
| `icon-foreground.png` | 1024x1024, 透過 | Android adaptive iconの前景（セーフゾーン66%に収めて中央配置） |
| `icon-background.png` | 1024x1024, 不透明（`#faf5e9`） | Android adaptive iconの背景 |
| `splash.png` | 2732x2732 | 起動スプラッシュ画面のソース（背景 `#faf5e9`、中央にマーク） |
| `splash-dark.png` | 2732x2732 | ダークモード用スプラッシュ（本アプリはダークテーマ未対応のため`splash.png`と同一） |

## 注意

- 元データが512x512のラスター画像のため、1024x1024へは拡大（Lanczos）して生成している。
  デザインの元データ（ベクター）が用意できたら、このディレクトリの画像を差し替えるとより高精細になる。
- `icon.png` は既存の `public/icons/`・`src/app/icon.png` と同じ白背景で統一。
  `icon-background.png` と `splash.png` はアプリ本体のテーマカラー（`#faf5e9`）に合わせている。
- Capacitor/Bubblewrapの設定への反映自体は、プロジェクトが存在しないため未着手（#41, #39待ち）。
