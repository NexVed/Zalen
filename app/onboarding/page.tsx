"use client";
import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Sun, Moon } from "lucide-react";
import { useAccountProfile } from "@/components/SyncUser";
import { useTheme } from "@/components/ThemeProvider";
import { ProfileFlow } from "@/components/onboarding/ProfileFlow";
import { ProfileAccess } from "@/components/onboarding/ProfileAccess";
import { clerkConfigured } from "@/lib/auth-config";
import styles from "@/components/onboarding/ProfileSystem.module.css";

export default function OnboardingPage() {
  const { status, bundle } = useAccountProfile(); const { toggleTheme } = useTheme(); const router = useRouter();
  useEffect(() => { if (status === "ready" && bundle?.onboarding?.completed) router.replace("/profile"); }, [status, bundle, router]);
  return <main className={styles.page} id="main"><header className={styles.topbar}><Link href="/" aria-label="Zalen home"><Image src="/brand/zalen-wordmark.png" alt="Zalen" width={110} height={38} /></Link><div className={styles.topbarActions}><button className={styles.secondary} onClick={toggleTheme} aria-label="Switch color theme"><Sun className="theme-sun" size={17} /><Moon className="theme-moon" size={17} /></button>{clerkConfigured && <UserButton />}</div></header>{status !== "ready" || !bundle ? <ProfileAccess /> : bundle.onboarding?.completed ? <section className={styles.state} role="status"><h1>Your profile is ready</h1><p>Opening your profile…</p><Link className={styles.primary} href="/profile">View profile</Link></section> : <ProfileFlow bundle={bundle} onDone={() => router.replace("/profile")} />}</main>;
}
