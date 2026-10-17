import { Suspense } from "react";
import { AuthScreen } from "@/components/AuthScreen";

export default function SignInPage() {
  return (
    <Suspense fallback={<main id="main" aria-busy="true">Opening your space…</main>}>
      <AuthScreen mode="sign-in" />
    </Suspense>
  );
}
