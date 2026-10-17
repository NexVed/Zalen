"use client";

import { ConvexReactClient } from "convex/react";

const address =
  process.env.NEXT_PUBLIC_CONVEX_URL ?? "http://127.0.0.1:3210";

export const convex = new ConvexReactClient(address);
