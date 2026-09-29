"use client";
import * as React from "react";

const EVENT = "bmus:m-pref";

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function read(key: string): string | null {
  try { return globalThis.localStorage?.getItem(key) ?? null; } catch { return null; }
}

/** Persist a per-browser string preference (null clears it) and notify subscribers in this tab. */
export function writeLocalPref(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch { /* storage unavailable: the choice just won't survive a reload */ }
  window.dispatchEvent(new Event(EVENT));
}

/** A localStorage-backed string preference, null on the server and when unset. */
export function useLocalPref(key: string): string | null {
  return React.useSyncExternalStore(subscribe, () => read(key), () => null);
}
