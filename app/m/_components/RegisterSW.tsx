"use client";
import { useEffect } from "react";

/** Registers /sw.js scoped to /m/ (the desktop app is not offline-cached). */
export function RegisterSW() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/m/" }).catch((e) => {
        console.warn("service worker registration failed", e);
      });
    }
  }, []);
  return null;
}
