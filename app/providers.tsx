"use client";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { convex } from "@/lib/convex";
import { SyncUser } from "@/components/SyncUser";
import { ThemeProvider } from "@/components/ThemeProvider";
import { clerkConfigured } from "@/lib/auth-config";
export function Providers({ children }: { children: React.ReactNode }) {
  if (!clerkConfigured) return <ThemeProvider>{children}</ThemeProvider>;
  return (
    <ClerkProvider localization={{ userButton: { action__manageAccount: "Account settings" } }} appearance={{ cssLayerName: "clerk" }} signInUrl="/sign-in" signUpUrl="/sign-up" signInFallbackRedirectUrl="/" signUpFallbackRedirectUrl="/" afterSignOutUrl="/">
      <ThemeProvider>
        {process.env.NEXT_PUBLIC_CONVEX_URL ? (
          <ConvexProviderWithClerk client={convex} useAuth={useAuth}><SyncUser>{children}</SyncUser></ConvexProviderWithClerk>
        ) : children}
      </ThemeProvider>
    </ClerkProvider>
  );
}
