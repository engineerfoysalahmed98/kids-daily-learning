"use client";
/**
 * Guest progress for the Bangla math section, saved on this device only.
 * No account, email or server call is involved. If the browser blocks storage
 * (private mode, cleared data) the app keeps working in memory and tells the
 * child/parent that progress may not be kept.
 */
import { useSyncExternalStore } from "react";
import { emptyProgress, parseProgress, type BnProgress } from "@/core/bangla";

const KEY = "kdl-bangla-math-v1";
const SERVER_SNAPSHOT: BnProgress = emptyProgress();

let cache: BnProgress | null = null;
let storageOk = true;
const listeners = new Set<() => void>();

function read(): BnProgress {
  if (cache) return cache;
  try {
    cache = parseProgress(window.localStorage.getItem(KEY));
    storageOk = true;
  } catch {
    storageOk = false;
    cache = emptyProgress();
  }
  return cache;
}

function emit() { listeners.forEach((l) => l()); }

/** Apply a change and save it. Returns the new state. */
export function updateBnProgress(change: (p: BnProgress) => BnProgress): BnProgress {
  const next = change(read());
  cache = next;
  try { window.localStorage.setItem(KEY, JSON.stringify(next)); storageOk = true; } catch { storageOk = false; }
  emit();
  return next;
}

export function getBnProgress(): BnProgress { return read(); }

function subscribe(l: () => void) {
  listeners.add(l);
  // Keep tabs in sync.
  const onStorage = (e: StorageEvent) => { if (e.key === KEY || e.key === null) { cache = null; emit(); } };
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(l); window.removeEventListener("storage", onStorage); };
}

export function useBnProgress(): { progress: BnProgress; loaded: boolean; storageOk: boolean } {
  const progress = useSyncExternalStore(subscribe, read, () => SERVER_SNAPSHOT);
  return { progress, loaded: progress !== SERVER_SNAPSHOT, storageOk };
}
