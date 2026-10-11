"use client";
/**
 * Learning Hub (শিখি) progress, saved on this device only — no account,
 * email or server call. Same pattern as bnGuestStore: if the browser blocks
 * storage, everything still works in memory and the page says so.
 * Kept separate from the Bangla-math store so neither can overwrite the other.
 */
import { useSyncExternalStore } from "react";
import { emptyHubProgress, parseHubProgress, type HubProgress } from "@/core/hub";

const KEY = "kdl-learning-hub-v1";
const SERVER_SNAPSHOT: HubProgress = emptyHubProgress();

let cache: HubProgress | null = null;
let storageOk = true;
const listeners = new Set<() => void>();

function read(): HubProgress {
  if (cache) return cache;
  try {
    cache = parseHubProgress(window.localStorage.getItem(KEY));
    storageOk = true;
  } catch {
    storageOk = false;
    cache = emptyHubProgress();
  }
  return cache;
}

function emit() { listeners.forEach((l) => l()); }

/** Apply a change and save it. Returns the new state. */
export function updateHubProgress(change: (p: HubProgress) => HubProgress): HubProgress {
  const prev = read();
  const next = change(prev);
  if (next === prev) return prev;
  cache = next;
  try { window.localStorage.setItem(KEY, JSON.stringify(next)); storageOk = true; } catch { storageOk = false; }
  emit();
  return next;
}

export function getHubProgress(): HubProgress { return read(); }

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => { if (e.key === KEY || e.key === null) { cache = null; emit(); } };
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(l); window.removeEventListener("storage", onStorage); };
}

export function useHubProgress(): { progress: HubProgress; loaded: boolean; storageOk: boolean } {
  const progress = useSyncExternalStore(subscribe, read, () => SERVER_SNAPSHOT);
  return { progress, loaded: progress !== SERVER_SNAPSHOT, storageOk };
}
