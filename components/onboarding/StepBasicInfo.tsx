"use client";
import { useState } from "react";
import * as stylex from "@stylexjs/stylex";
import { Upload, User } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { colors } from "@/styles/tokens.stylex";
import { ui } from "@/components/dashboard/ui";
import { formStyles } from "@/components/dashboard/forms";
import type { BasicInfoData } from "@/lib/onboarding-types";

interface StepBasicInfoProps {
  data: BasicInfoData;
  onChange: (data: BasicInfoData) => void;
  onNext: (data: BasicInfoData) => Promise<void>;
  clerkUser: {
    fullName?: string | null;
    primaryEmailAddress?: { emailAddress: string } | null;
  } | null;
  isLoading: boolean;
}

export function StepBasicInfo({ data, onChange, onNext, clerkUser, isLoading }: StepBasicInfoProps) {
  const [bioLen, setBioLen] = useState(data.bio?.length ?? 0);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json() as { storageId: string };
      onChange({ ...data, avatarStorageId: storageId });
    } catch {
      // Upload failed silently — avatar is optional
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const next: BasicInfoData = {
      phone: (fd.get("phone") as string | null)?.trim() || undefined,
      phoneCountryCode: (fd.get("phoneCountryCode") as string | null)?.trim() || "+91",
      bio: (fd.get("bio") as string | null)?.trim() || undefined,
      location: (fd.get("location") as string | null)?.trim() || undefined,
      avatarStorageId: data.avatarStorageId,
    };
    await onNext(next);
  }

  return (
    <form {...stylex.props(formStyles.form)} onSubmit={handleSubmit}>
      <p {...stylex.props(s.stepDescription)}>
        Let&apos;s start with the basics. This information helps others find and connect with you.
      </p>

      {/* Avatar */}
      <div {...stylex.props(s.avatarSection)}>
        <div {...stylex.props(s.avatarPreview)}>
          {avatarPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarPreview} alt="Avatar preview" {...stylex.props(s.avatarImg)} />
          ) : (
            <span {...stylex.props(s.avatarPlaceholder)}>
              <User size={28} />
            </span>
          )}
        </div>
        <div {...stylex.props(ui.column)}>
          <label {...stylex.props(s.uploadLabel)}>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              disabled={uploading}
              {...stylex.props(s.hiddenInput)}
            />
            <span {...stylex.props(ui.secondary, s.uploadButton)}>
              <Upload size={14} />
              {uploading ? "Uploading…" : "Upload photo"}
            </span>
          </label>
          <span {...stylex.props(ui.caption)}>Optional. JPG, PNG or WebP, max 5 MB.</span>
        </div>
      </div>

      {/* Name — read-only from Clerk */}
      <label {...stylex.props(ui.label)}>
        Full name
        <input
          name="name"
          value={clerkUser?.fullName ?? ""}
          readOnly
          title="Update your name in your Clerk account settings."
          {...stylex.props(ui.input, s.readonlyInput)}
        />
        <span {...stylex.props(ui.caption)}>Synced from your account. Edit via account settings.</span>
      </label>

      {/* Email — read-only */}
      <label {...stylex.props(ui.label)}>
        Email address
        <input
          name="email"
          value={clerkUser?.primaryEmailAddress?.emailAddress ?? ""}
          readOnly
          {...stylex.props(ui.input, s.readonlyInput)}
        />
        <span {...stylex.props(ui.caption)}>Managed by your Clerk account. Not displayed publicly.</span>
      </label>

      {/* Phone */}
      <label {...stylex.props(ui.label)}>
        Mobile number <span {...stylex.props(ui.caption)}>(optional)</span>
        <div {...stylex.props(s.phoneRow)}>
          <input
            name="phoneCountryCode"
            defaultValue={data.phoneCountryCode ?? "+91"}
            maxLength={6}
            placeholder="+91"
            {...stylex.props(ui.input, s.countryCode)}
          />
          <input
            name="phone"
            defaultValue={data.phone ?? ""}
            type="tel"
            placeholder="9876543210"
            {...stylex.props(ui.input, s.phoneInput)}
          />
        </div>
      </label>

      {/* Location */}
      <label {...stylex.props(ui.label)}>
        Location <span {...stylex.props(ui.caption)}>(optional)</span>
        <input
          name="location"
          defaultValue={data.location ?? ""}
          placeholder="Mumbai, Maharashtra"
          {...stylex.props(ui.input)}
        />
      </label>

      {/* Bio */}
      <label {...stylex.props(ui.label)}>
        Bio <span {...stylex.props(ui.caption)}>(optional · {bioLen}/300)</span>
        <textarea
          name="bio"
          defaultValue={data.bio ?? ""}
          maxLength={300}
          rows={3}
          placeholder="A short intro about yourself — what you do, what drives you."
          onChange={e => setBioLen(e.target.value.length)}
          {...stylex.props(ui.input)}
        />
      </label>

      <button type="submit" {...stylex.props(ui.primary)} disabled={isLoading || uploading}>
        {isLoading ? "Saving…" : "Continue"}
      </button>
    </form>
  );
}

const s = stylex.create({
  stepDescription: {
    fontSize: 13,
    color: colors.body,
    lineHeight: 1.7,
    marginBottom: 4,
  },
  avatarSection: {
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  avatarPreview: {
    width: 72,
    height: 72,
    borderRadius: "50%",
    overflow: "hidden",
    backgroundColor: colors.elevated,
    border: "2px solid",
    borderColor: colors.border,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    color: colors.muted,
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  avatarPlaceholder: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: colors.muted,
  },
  uploadLabel: {
    cursor: "pointer",
    display: "inline-block",
  },
  uploadButton: {
    cursor: "pointer",
    minHeight: 38,
    padding: "8px 14px",
    fontSize: 12,
    pointerEvents: "none",
  },
  hiddenInput: {
    position: "absolute",
    opacity: 0,
    width: "1px",
    height: "1px",
    overflow: "hidden",
    clip: "rect(0,0,0,0)",
    whiteSpace: "nowrap",
  },
  readonlyInput: {
    opacity: 0.7,
    cursor: "default",
  },
  phoneRow: {
    display: "flex",
    gap: 8,
  },
  countryCode: {
    width: "90px",
    flexShrink: 0,
  },
  phoneInput: {
    flex: 1,
  },
});
