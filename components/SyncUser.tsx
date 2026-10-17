"use client";
import { Component, Suspense, createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { useRouter, usePathname } from "next/navigation";
import type { ProfileBundle } from "@/lib/profile-data";

type AccountProfile = { status: "unconfigured" | "signed-out" | "loading" | "ready" | "error"; bundle: ProfileBundle | null; retry: () => void };
const retryPage = () => window.location.reload();
const context = createContext<AccountProfile>({ status: "unconfigured", bundle: null, retry: retryPage });
export function useAccountProfile() { return useContext(context); }

class ProfileBoundary extends Component<{ children: ReactNode; content: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <context.Provider value={{ status: "error", bundle: null, retry: retryPage }}>{this.props.content}</context.Provider> : this.props.children; }
}
export function SyncUser({ children }: { children: ReactNode }) {
  return <Suspense fallback={<context.Provider value={{ status: "loading", bundle: null, retry: retryPage }}>{children}</context.Provider>}><ProfileBoundary content={children}><ConnectedProfileProvider>{children}</ConnectedProfileProvider></ProfileBoundary></Suspense>;
}
function ConnectedProfileProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useConvexAuth();
  const { user, isLoaded } = useUser();
  const router = useRouter(); const pathname = usePathname();
  const store = useMutation(api.users.store);
  const [attempt, setAttempt] = useState(0);
  const [failure, setFailure] = useState(false);
  const bundle = useQuery(api.profile.getMyProfile, isAuthenticated ? {} : "skip");
  useEffect(() => {
    let active = true;
    if (isAuthenticated) store().catch(() => { if (active) setFailure(true); });
    return () => { active = false; };
  }, [isAuthenticated, store, user?.id, attempt]);
  useEffect(() => {
    if (!user || bundle) return;
    const timer = setTimeout(() => setFailure(true), 15000);
    return () => clearTimeout(timer);
  }, [user, bundle, attempt]);
  const status = !isLoaded ? "loading" : !user ? "signed-out" : bundle ? "ready" : failure ? "error" : "loading";
  useEffect(() => {
    if (status !== "ready" || !bundle || bundle.onboarding?.completed || pathname === "/profile" || pathname.startsWith("/onboarding") || pathname.startsWith("/sign-")) return;
    router.replace("/onboarding");
  }, [status, bundle, pathname, router]);
  return <context.Provider value={{ status, bundle: bundle ?? null, retry: () => { setFailure(false); setAttempt(value => value + 1); } }}>{children}</context.Provider>;
}
