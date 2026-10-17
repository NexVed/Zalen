import { Suspense } from "react";
import { AuthScreen } from "@/components/AuthScreen";

// Opt out of instant (static prerendering) — AuthScreen uses client hooks
// that read localStorage (theme) and Clerk session state.
export const instant = false;

export default function SignUpPage() {
  return (
    <Suspense fallback={<main id="main" aria-busy="true">Getting your space ready…</main>}>
      <AuthScreen mode="sign-up" />
    </Suspense>
  );
}
