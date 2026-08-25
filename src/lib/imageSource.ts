export function imageSource(path: string | undefined, assetBase: string) {
  const source = path ?? "/experiences/noimage.svg";
  if (/^(data:|blob:|https?:\/\/)/.test(source)) return source;
  return `${assetBase}${source}`;
}
