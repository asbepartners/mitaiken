import { Capacitor } from "@capacitor/core";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";

export function isNativePlatform() {
  return Capacitor.isNativePlatform();
}

// ネイティブアプリ内では、Webのファイル選択ではなくCapacitor Cameraプラグイン
// （カメラ撮影／フォトライブラリ選択）を使う。サイズ・画質は既存のresizeImage/
// compressImageと揃えている。
export async function pickNativePhoto(): Promise<string | undefined> {
  const photo = await Camera.getPhoto({
    source: CameraSource.Prompt,
    resultType: CameraResultType.DataUrl,
    quality: 78,
    width: 1200,
    height: 1200,
    correctOrientation: true,
  });
  return photo.dataUrl;
}
