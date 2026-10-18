"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { ArrowUpRight } from "lucide-react";
import { clerkConfigured } from "@/lib/auth-config";
import styles from "./LandingPage.module.css";

export function GetStarted({ light = false }: { light?: boolean }) {
  return clerkConfigured ? <ConnectedGetStarted light={light} /> : <StartLink light={light} />;
}

function ConnectedGetStarted({ light }: { light: boolean }) {
  const { isSignedIn } = useUser();
  return <StartLink light={light} signedIn={isSignedIn} />;
}

function StartLink({ light, signedIn = false }: { light: boolean; signedIn?: boolean }) {
  return <Link href={signedIn ? "/overview" : "/sign-in"} className={`${styles.cta} ${light ? styles.ctaLight : ""}`}>
    Get started <span aria-hidden="true"><ArrowUpRight size={19} /></span>
  </Link>;
}
