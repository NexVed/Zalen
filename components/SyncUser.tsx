"use client";

import { useEffect } from "react";
import { useConvexAuth, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

/**
 * Upserts the signed-in Clerk user into Convex on first load.
 * Render this once inside the provider tree.
 */
export function SyncUser() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const store = useMutation(api.users.store);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      store().catch(() => {
        // Ignore transient errors while the Convex/Clerk token settles.
      });
    }
  }, [isLoading, isAuthenticated, store]);

  return null;
}
