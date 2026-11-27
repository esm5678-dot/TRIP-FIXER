"use client";
import { useSyncExternalStore } from "react";

const compactQuery = "(max-width: 780px)";
function subscribe(listener: () => void) {
  const media = window.matchMedia(compactQuery);
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}
export function useCompactLayout() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(compactQuery).matches,
    () => false,
  );
}
