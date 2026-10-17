"use client";
import { useMemo, useSyncExternalStore } from "react";
import { useAccountProfile } from "@/components/SyncUser";
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
  const { bundle } = useAccountProfile();
  // Profile and portfolio are always read from Convex; the remaining sample
  // opportunity activity still uses the account's local workspace.
  const state = useMemo(() => ({ ...saved, profile: {
    name: bundle?.user.name || name,
    headline: bundle?.profile?.bio || "",
    skills: bundle?.skills.map(skill => skill.name).join(", ") || "",
    link: bundle?.projects[0]?.liveUrl || bundle?.projects[0]?.repoUrl || "",
  }, portfolio: bundle?.projects.map(project => ({ id: project._id, title: project.title, type: project.category || "Project", link: project.liveUrl || project.repoUrl || "" })) ?? [] }), [saved, bundle, name]);
  return [state, (updater: (value: DemoState) => DemoState) => store.update(current => updater({ ...current, profile: state.profile, portfolio: state.portfolio }))] as const;
}
