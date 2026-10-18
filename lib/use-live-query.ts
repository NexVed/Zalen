"use client";
import { useMemo, useState, useSyncExternalStore } from "react";
import { getFunctionName, makeFunctionReference, type FunctionArgs, type FunctionReference, type FunctionReturnType } from "convex/server";
import { convex } from "./convex";

function createQueryStore<Query extends FunctionReference<"query">>(queryName: string, argsKey: string | null) {
  const query = makeFunctionReference<"query", FunctionArgs<Query>, FunctionReturnType<Query>>(queryName);
  type Snapshot = { data: FunctionReturnType<Query> | undefined; error: boolean };
  const initial: Snapshot = { data: undefined, error: false };
  let snapshot = initial;
  return {
    read: () => snapshot,
    server: () => initial,
    subscribe(listener: () => void) {
      if (argsKey === null) return () => {};
      const watch = convex.watchQuery(query, JSON.parse(argsKey));
      const timer = setTimeout(() => { if (snapshot.data === undefined) { snapshot = { data: undefined, error: true }; listener(); } }, 15000);
      const read = () => {
        try {
          const data = watch.localQueryResult();
          if (data !== undefined && (data !== snapshot.data || snapshot.error)) {
            clearTimeout(timer); snapshot = { data, error: false }; listener();
          }
        } catch {
          clearTimeout(timer); snapshot = { data: undefined, error: true }; listener();
        }
      };
      const unsubscribe = watch.onUpdate(read);
      read();
      return () => { clearTimeout(timer); unsubscribe(); };
    },
  };
}

/** A query subscription that keeps connection errors inside its own section. */
export function useLiveQuery<Query extends FunctionReference<"query">>(query: Query, args: FunctionArgs<Query> | "skip") {
  const [attempt, setAttempt] = useState(0);
  const argsKey = args === "skip" ? null : JSON.stringify(args);
  const queryName = getFunctionName(query);
  const store = useMemo(() => ({ ...createQueryStore<Query>(queryName, argsKey), attempt }), [queryName, argsKey, attempt]);
  const snapshot = useSyncExternalStore(store.subscribe, store.read, store.server);
  return { ...snapshot, retry: () => setAttempt(value => value + 1) };
}
