"use client";
import { useMemo, useSyncExternalStore } from "react";
import { emptyHub, type HubState } from "./hub-data";

function createStore(userId: string | null) {
  const key = userId ? `zalen-hub-v1:${userId}` : null;
  let current = emptyHub;
  let previous: string | null | undefined;
  const listeners = new Set<() => void>();
  function read(): HubState {
    if (!key) return emptyHub;
    try {
      const raw = localStorage.getItem(key);
      if (raw !== previous) {
        previous = raw;
        const parsed = raw ? JSON.parse(raw) : null;
        current = parsed && Array.isArray(parsed.listings) && Array.isArray(parsed.threads)
          && Array.isArray(parsed.votes) && Array.isArray(parsed.drafts)
          && parsed.replies && typeof parsed.replies === "object" && !Array.isArray(parsed.replies) ? parsed : emptyHub;
      }
    } catch { /* Retain in-memory work if storage is unavailable. */ }
    return current;
  }
  return {
    read,
    subscribe(listener: () => void) {
      listeners.add(listener);
      const onStorage = (event: StorageEvent) => { if (event.key === key || event.key === null) listener(); };
      window.addEventListener("storage", onStorage);
      return () => { listeners.delete(listener); window.removeEventListener("storage", onStorage); };
    },
    update(updater: (state: HubState) => HubState) {
      if (!key) return;
      current = updater(read());
      try { previous = JSON.stringify(current); localStorage.setItem(key, previous); } catch { /* Keep local edits in memory. */ }
      listeners.forEach(listener => listener());
    },
  };
}

export function useHubState(userId: string | null) {
  const store = useMemo(() => createStore(userId), [userId]);
  const state = useSyncExternalStore(store.subscribe, store.read, () => emptyHub);
  return [state, store.update] as const;
}
