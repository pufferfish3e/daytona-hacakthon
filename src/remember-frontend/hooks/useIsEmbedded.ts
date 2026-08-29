import { useSyncExternalStore } from "react";

function subscribe() {
  return () => {};
}

function getIsEmbedded() {
  return window.self !== window.top;
}

function getServerSnapshot() {
  return false;
}

/** True when this page is rendered inside a preview iframe (not the top-level app). */
export function useIsEmbedded(): boolean {
  return useSyncExternalStore(subscribe, getIsEmbedded, getServerSnapshot);
}
