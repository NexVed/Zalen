import { Suspense } from "react";
import { AuthScreen } from "@/components/AuthScreen";

export default function SignUpPage() {
  return (
    <Suspense fallback={<main id="main" aria-busy="true">Getting your space ready…</main>}>
      <AuthScreen mode="sign-up" />
    </Suspense>
  );
}
