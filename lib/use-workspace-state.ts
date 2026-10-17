"use client";
import { useMemo, useSyncExternalStore } from "react";
import { initialDemo, type DemoState } from "./demo-data";

// Local workspace activity is isolated by Clerk account. Never import the old
// shared demo key: it contains a fictional user's profile and activity.
function createStore(userId: string | null) {
  const key = userId ? `zalen-workspace-v2:${userId}` : null;
  let cached = initialDemo;
  let previous: string | null | undefined;
  const listeners = new Set<() => void>();
  function read(): DemoState {
    if (!key) return initialDemo;
    try {
      const raw = localStorage.getItem(key);
      if (raw !== previous) {
        previous = raw;
        const parsed = raw ? JSON.parse(raw) : null;
        cached = parsed && Array.isArray(parsed.saved) && Array.isArray(parsed.applications)
          && Array.isArray(parsed.portfolio) && Array.isArray(parsed.joined)
          && Array.isArray(parsed.customOpportunities)
          && ["name", "headline", "skills", "link"].every(field => typeof parsed.profile?.[field] === "string")
          ? parsed : initialDemo;
      }
    } catch { /* Keep local changes usable when storage is unavailable. */ }
    return cached;
  }
  return {
    read,
    subscribe(listener: () => void) {
      listeners.add(listener);
      const onStorage = (event: StorageEvent) => { if (event.key === key || event.key === null) listener(); };
      window.addEventListener("storage", onStorage);
      return () => { listeners.delete(listener); window.removeEventListener("storage", onStorage); };
    },
    update(updater: (value: DemoState) => DemoState) {
      if (!key) return;
      cached = updater(read());
      try { previous = JSON.stringify(cached); localStorage.setItem(key, previous); } catch { /* Keep changes in memory. */ }
      listeners.forEach(listener => listener());
    },
  };
}

export function useWorkspaceState(userId: string | null, name: string) {
  const store = useMemo(() => createStore(userId), [userId]);
  const saved = useSyncExternalStore(store.subscribe, store.read, () => initialDemo);
  const state = useMemo(() => ({ ...saved, profile: { ...saved.profile, name: name || saved.profile.name } }), [saved, name]);
  return [state, (updater: (value: DemoState) => DemoState) => store.update(current => updater({ ...current, profile: { ...current.profile, name: name || current.profile.name } }))] as const;
}
