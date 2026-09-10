// hajimetecho.jp serves this app from the domain root (the app itself lives
// under /app, but that's a route, not a basePath), so there is no prefix to
// add in any environment. Centralized here so a future basePath change only
// needs to happen in one place instead of the ~10 call sites that used to
// each repeat `process.env.NODE_ENV === "production" ? "/mitaiken" : ""`.
export const ASSET_BASE = "";
