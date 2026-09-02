"use client";

import { useSyncExternalStore } from "react";

let initialOnline: boolean | undefined;

function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getSnapshot() {
  if (initialOnline === undefined) initialOnline = window.navigator.onLine;
  return window.navigator.onLine;
}

function getServerSnapshot(): boolean | null {
  return null;
}

export function useConnectivity() {
  const onlineSnapshot = useSyncExternalStore<boolean | null>(subscribe, getSnapshot, getServerSnapshot);

  return {
    ready: onlineSnapshot !== null,
    online: onlineSnapshot ?? true,
    offlineAtStartup: initialOnline === false,
  };
}
