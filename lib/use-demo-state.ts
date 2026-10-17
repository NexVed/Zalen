"use client";
import { useSyncExternalStore } from "react";
import { initialDemo, type DemoState } from "./demo-data";

const key = "zalen-demo-v1";
let cached: DemoState = initialDemo;
let previous: string | null | undefined;
const listeners = new Set<() => void>();
function read(): DemoState {
  try {
    const raw = localStorage.getItem(key);
    if (raw !== previous) {
      previous = raw;
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed && Array.isArray(parsed.saved) && Array.isArray(parsed.applications) && Array.isArray(parsed.portfolio) && Array.isArray(parsed.joined) && Array.isArray(parsed.customOpportunities) && typeof parsed.profile?.name === "string") cached = parsed;
      else cached = initialDemo;
    }
  } catch { /* Keep a usable in-memory preview if browser storage is unavailable. */ }
  return cached;
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => { if (event.key === key || event.key === null) listener(); };
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(listener); window.removeEventListener("storage", onStorage); };
}
export function useDemoState() {
  const state = useSyncExternalStore(subscribe, read, () => initialDemo);
  function update(updater: (value: DemoState) => DemoState) {
    cached = updater(read());
    try { previous = JSON.stringify(cached); localStorage.setItem(key, previous); } catch { /* Changes remain in memory. */ }
    listeners.forEach(listener => listener());
  }
  return [state, update] as const;
}
