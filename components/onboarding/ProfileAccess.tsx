"use client";
import Link from "next/link";
import { useAccountProfile } from "@/components/SyncUser";
import styles from "./ProfileSystem.module.css";
export function ProfileAccess() {
  const { status, retry } = useAccountProfile();
  if (status === "loading") return <section className={styles.state} role="status"><h2>Loading your profile</h2><p>Connecting your account and saved details…</p></section>;
  if (status === "signed-out") return <section className={styles.state}><h2>Your Zalen profile</h2><p>Sign in to set up your profile, manage your skills, and add your work.</p><Link className={styles.primary} href="/sign-in">Sign in</Link><Link className={styles.secondary} href="/">Browse Zalen</Link></section>;
  return <section className={styles.state} role="alert"><h2>Your profile is unavailable</h2><p>We couldn’t connect to your saved profile. Your changes haven’t been saved. Please try again.</p><button className={styles.primary} onClick={retry}>Try again</button><Link className={styles.secondary} href="/">Back to Zalen</Link></section>;
}
