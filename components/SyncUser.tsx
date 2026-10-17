"use client";
import { useEffect } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter, usePathname } from "next/navigation";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _api = api as any;

/**
 * Upserts the signed-in Clerk user into Convex on first load, then
 * redirects to /onboarding if the user hasn't completed onboarding yet.
 * Render this once inside the provider tree.
 */
export function SyncUser() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();
  const pathname = usePathname();
  const store = useMutation(api.users.store);

  const onboardingStatus = useQuery(
    isAuthenticated ? _api.profile.getOnboardingStatus : "skip",
  ) as { completed: boolean; currentStep: number } | null | undefined;

  // Sync user to Convex after sign-in
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      store().catch(() => {
        // Ignore transient errors while the Convex/Clerk token settles.
      });
    }
  }, [isLoading, isAuthenticated, store]);

  // Redirect to onboarding if not yet completed
  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    if (onboardingStatus === undefined) return; // still loading from Convex
    if (pathname.startsWith("/onboarding") || pathname.startsWith("/sign-")) return;

    // null means no record yet (new user), or explicitly not completed
    if (onboardingStatus === null || !onboardingStatus.completed) {
      router.replace("/onboarding");
    }
  }, [isLoading, isAuthenticated, onboardingStatus, pathname, router]);

  return null;
}
