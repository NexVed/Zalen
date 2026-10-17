"use client";
import Image from "next/image";
import { useClerk } from "@clerk/nextjs";
import type { BasicInfoData } from "@/lib/onboarding-types";
import styles from "./ProfileSystem.module.css";

export function StepBasicInfo({ data, onChange, onNext, clerkUser, isLoading, submitLabel = "Save & continue" }: {
  data: BasicInfoData; onChange: (data: BasicInfoData) => void; onNext: (data: BasicInfoData) => Promise<void>;
  clerkUser: { fullName?: string | null; imageUrl?: string; primaryEmailAddress?: { emailAddress: string } | null } | null;
  isLoading: boolean; submitLabel?: string;
}) {
  const { openUserProfile } = useClerk();
  function field(key: keyof BasicInfoData, value: string) { onChange({ ...data, [key]: value }); }
  const image = clerkUser?.imageUrl;
  return <form className={styles.form} onSubmit={event => { event.preventDefault(); void onNext(data); }}>
    <div className={styles.photoRow}><span className={styles.avatar}>{image ? <Image unoptimized width={100} height={100} src={image} alt="Your account photo" /> : (clerkUser?.fullName || "?").slice(0, 1).toUpperCase()}</span><div><button type="button" className={styles.secondary} onClick={() => openUserProfile()}>Account settings</button><p className={styles.caption}>Manage your photo, name, and sign-in details.</p></div></div>
    <fieldset className={styles.fields} disabled={isLoading}>
      <label>Account name<input autoComplete="name" readOnly value={clerkUser?.fullName ?? ""} /></label>
      <label>Location <span className={styles.optional}>Optional</span><input name="location" autoComplete="address-level2" maxLength={100} placeholder="City, country" value={data.location ?? ""} onChange={event => field("location", event.target.value)} /></label>
      <label>About you <span className={styles.optional}>{data.bio?.length ?? 0}/300</span><textarea name="bio" rows={4} maxLength={300} placeholder="Describe your experience, services, or current work." value={data.bio ?? ""} onChange={event => field("bio", event.target.value)} /></label>
      <label>Phone <span className={styles.optional}>Optional · only visible to you</span><div className={styles.phoneRow}><input aria-label="Country calling code" name="phoneCountryCode" type="tel" maxLength={6} value={data.phoneCountryCode ?? "+91"} onChange={event => field("phoneCountryCode", event.target.value)} /><input aria-label="Phone number" name="phone" type="tel" autoComplete="tel-national" maxLength={24} value={data.phone ?? ""} onChange={event => field("phone", event.target.value)} /></div></label>
      <p className={styles.caption}>Account email: {clerkUser?.primaryEmailAddress?.emailAddress}. Manage sign-in details from your account menu.</p>
      <button type="submit" className={styles.primary}>{isLoading ? "Saving…" : submitLabel}</button>
    </fieldset>
  </form>;
}
