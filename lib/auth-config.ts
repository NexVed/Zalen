// A copied .env.example should still allow the public pages to render.
// Clerk validates the full key when a real instance is configured.
const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
export const clerkConfigured = /^pk_(test|live)_[A-Za-z0-9+/]+=*$/.test(publishableKey)
  && !publishableKey.includes("xxxx");
