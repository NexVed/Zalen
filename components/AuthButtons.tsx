"use client";

import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/Button";

/**
 * Auth-aware header actions.
 *
 * This runs on the client so the route's server render never branches on the
 * Clerk session. That keeps `/` fully prerenderable and avoids blocking
 * instant-navigation validation on an auth-gated segment.
 */
export function AuthButtons() {
  return (
    <>
      <Show when="signed-out" fallback={null}>
        <SignInButton mode="modal">
          <Button variant="secondary">Sign in</Button>
        </SignInButton>
        <SignUpButton mode="modal">
          <Button variant="primary">Sign up</Button>
        </SignUpButton>
      </Show>
      <Show when="signed-in" fallback={null}>
        <UserButton />
      </Show>
    </>
  );
}
