import { Suspense } from "react";
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <Suspense fallback={null}>
        <SignIn />
      </Suspense>
    </div>
  );
}
