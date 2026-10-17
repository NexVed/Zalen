"use client";

import Image from "next/image";
import Link from "next/link";
import { ClerkFailed, ClerkLoaded, ClerkLoading, SignIn, SignUp } from "@clerk/nextjs";
import { ArrowLeft, ArrowUpRight, BriefcaseBusiness, Compass, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { clerkConfigured } from "@/lib/auth-config";
import styles from "./AuthScreen.module.css";

const appearance = {
  variables: {
    colorPrimary: "var(--accent-primary)",
    colorBackground: "var(--bg-card)",
    colorForeground: "var(--text-primary)",
    colorMutedForeground: "var(--text-muted)",
    colorInputBackground: "var(--bg-elevated)",
    colorInputText: "var(--text-primary)",
    colorNeutral: "var(--text-primary)",
    fontFamily: '"Inter Variable", sans-serif',
    spacing: "0.75rem",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: styles.clerkRoot,
    cardBox: styles.clerkBox,
    card: styles.clerkCard,
    main: styles.clerkMain,
    form: styles.clerkForm,
    formFieldGroup: styles.clerkFields,
    headerTitle: styles.clerkTitle,
    headerSubtitle: styles.clerkSubtitle,
    socialButtonsBlockButton: styles.socialButton,
    formButtonPrimary: styles.submitButton,
    footer: styles.clerkFooter,
    footerAction: styles.clerkFooterAction,
  },
};

export function AuthScreen({ mode }: { mode: "sign-up" | "sign-in" }) {
  const { theme, toggleTheme } = useTheme();
  const signingUp = mode === "sign-up";
  return <main id="main" className={styles.page}>
    <section className={styles.story} aria-label="Welcome to Zalen">
      <Link href="/" aria-label="Zalen home" className={styles.brand}><Image src="/brand/zalen-wordmark.png" alt="Zalen" width={128} height={44} preload /></Link>
      <div className={styles.storyContent}>
        <h1>Work with startups.<br /><span>Build your portfolio.</span></h1>
        <p>Find startup challenges, paid projects, and local businesses. Manage your applications and portfolio in one account.</p>
        <div className={styles.art}><Image src="/brand/zalen-crystal.png" alt="A crystalline Z with glowing pink and gold orbits" fill sizes="(max-width: 800px) 400px, 600px" preload /></div>
        <div className={styles.features}>
          <div><Compass size={18} /><span>Find projects<small>Startup challenges and paid gigs.</small></span><ArrowUpRight size={14} /></div>
          <div><BriefcaseBusiness size={18} /><span>Showcase your work<small>Add projects and portfolio links.</small></span><ArrowUpRight size={14} /></div>
        </div>
      </div>
    </section>
    <section className={styles.formPanel} aria-label={signingUp ? "Create your account" : "Sign in to your account"}>
      <div className={styles.topbar}><Link href="/"><ArrowLeft size={14} /> Back to Zalen</Link><button onClick={toggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}><Sun className="theme-sun" size={18} /><Moon className="theme-moon" size={18} /></button></div>
      <div className={styles.formContent}>
        <h2>{signingUp ? "Create an account" : "Sign in to Zalen"}</h2>
        <p className={styles.intro}>{signingUp ? "Create your Zalen account." : "Access your applications and projects."}</p>
        {clerkConfigured ? <>
          <ClerkLoading><div className={styles.setupNotice} role="status">Loading your secure {signingUp ? "sign-up" : "sign-in"} form…</div></ClerkLoading>
          <ClerkFailed><div className={styles.setupNotice} role="alert">The sign-in service couldn’t load. Check your connection and try again.<button type="button" onClick={() => window.location.reload()}>Retry</button></div></ClerkFailed>
          <ClerkLoaded>{signingUp
          ? <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" fallbackRedirectUrl="/onboarding" appearance={appearance} />
          : <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" fallbackRedirectUrl="/" appearance={appearance} />}</ClerkLoaded></>
          : <div className={styles.setupNotice} role="status">Account registration is being connected. Please check back soon.<Link href="/">Explore Zalen <ArrowUpRight size={14} /></Link></div>}
        <p className={styles.switchAccount}>{signingUp ? "Already part of the community?" : "New to Zalen?"} <Link href={signingUp ? "/sign-in" : "/sign-up"}>{signingUp ? "Sign in" : "Create an account"} <ArrowUpRight size={12} /></Link></p>
      </div>
      <p className={styles.formFooter}>Zalen</p>
    </section>
  </main>;
}
