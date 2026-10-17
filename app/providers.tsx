"use client";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { convex } from "@/lib/convex";
import { SyncUser } from "@/components/SyncUser";
import { ThemeProvider } from "@/components/ThemeProvider";
export function Providers({ children }: { children: React.ReactNode }) {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) return <ThemeProvider>{children}</ThemeProvider>;
  return (
    <ClerkProvider appearance={{ cssLayerName: "clerk" }} afterSignOutUrl="/">
      <ThemeProvider>
        {process.env.NEXT_PUBLIC_CONVEX_URL ? (
          <ConvexProviderWithClerk client={convex} useAuth={useAuth}><SyncUser />{children}</ConvexProviderWithClerk>
        ) : children}
      </ThemeProvider>
    </ClerkProvider>
  );
}
