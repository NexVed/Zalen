"use client";
/**
 * BountyPostDialog.tsx
 *
 * Modal form for creating or editing a bounty.
 * Fields: title, type, reward (optional), description, repo URL (optional), tags.
 */
import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as stylex from "@stylexjs/stylex";
import { ArrowUpRight, X } from "lucide-react";
import { ui } from "./ui";
import { BoardDialog } from "./BoardDialog";
import styles from "./Hub.module.css";
import bountyStyles from "./Bounties.module.css";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const BOUNTY_TYPES = [
  { value: "bug", label: "Bug" },
  { value: "feature", label: "Feature Request" },
  { value: "code_review", label: "Code Review" },
  { value: "design", label: "Design" },
  { value: "docs", label: "Documentation" },
  { value: "research", label: "Research" },
  { value: "other", label: "Other" },
] as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BountyFormValues = {
  title: string;
  type: string;
  description: string;
  reward: string;
  repoUrl: string;
  tags: string[];
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BountyPostDialog({
  initial,
  onClose,
  onSave,
}: {
  initial?: Partial<BountyFormValues>;
  onClose: () => void;
  onSave: (values: BountyFormValues) => Promise<void>;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [type, setType] = useState(initial?.type ?? "bug");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [reward, setReward] = useState(initial?.reward ?? "");
  const [repoUrl, setRepoUrl] = useState(initial?.repoUrl ?? "");
  const [tagsInput, setTagsInput] = useState((initial?.tags ?? []).join(", "));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 10);

    setSaving(true);
    setError("");
    try {
      await onSave({
        title: title.trim(),
        type,
        description: description.trim(),
        reward: reward.trim(),
        repoUrl: repoUrl.trim(),
        tags,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save. Please try again.");
      setSaving(false);
    }
  }

  return (
    <BoardDialog title={initial ? "Edit bounty" : "Post a bounty"} onClose={onClose} maxWidth={600}>
        {/* Header */}
        <div className={styles.dialogHeading}>
          <Dialog.Title className={styles.dialogTitle}>
            {initial ? "Edit bounty" : "Post a bounty"}
          </Dialog.Title>
          <button {...stylex.props(ui.iconButton)} aria-label="Close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <p className={styles.dialogDescription}>
          {initial
            ? "Update the details of your bounty."
            : "Describe what you need. Be specific so contributors can evaluate fit quickly."}
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          {/* Title */}
          <label {...stylex.props(ui.label)}>
            Title *
            <input
              required
              minLength={8}
              maxLength={140}
              placeholder="e.g. Fix crash when uploading large files"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              {...stylex.props(ui.input)}
            />
          </label>

          {/* Type + Reward (two columns) */}
          <div className={bountyStyles.twoCol}>
            <label {...stylex.props(ui.label)}>
              Type *
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                {...stylex.props(ui.input)}
              >
                {BOUNTY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>

            <label {...stylex.props(ui.label)}>
              Reward
              <input
                maxLength={80}
                placeholder="$50, 100 USDC, open-source credit…"
                value={reward}
                onChange={(e) => setReward(e.target.value)}
                {...stylex.props(ui.input)}
              />
            </label>
          </div>

          {/* Description */}
          <label {...stylex.props(ui.label)}>
            Description *
            <textarea
              required
              minLength={20}
              maxLength={5000}
              rows={6}
              placeholder={
                type === "bug"
                  ? "Steps to reproduce, expected vs actual behaviour, environment details…"
                  : type === "feature"
                    ? "What problem does this solve? What's the desired behaviour or outcome?"
                    : type === "code_review"
                      ? "Link the code, describe focus areas, known concerns, or constraints…"
                      : "Describe the task in as much detail as needed for a contributor to understand and get started."
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              {...stylex.props(ui.input)}
            />
          </label>

          {/* Repo / reference URL */}
          <label {...stylex.props(ui.label)}>
            Reference URL
            <input
              type="url"
              maxLength={500}
              placeholder="https://github.com/org/repo/issues/42"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              {...stylex.props(ui.input)}
            />
          </label>

          {/* Tags */}
          <label {...stylex.props(ui.label)}>
            Tags (comma-separated)
            <input
              maxLength={200}
              placeholder="TypeScript, React, Convex, performance…"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              {...stylex.props(ui.input)}
            />
          </label>

          {error && (
            <p className={bountyStyles.formError} role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            {...stylex.props(ui.primary)}
            disabled={saving}
          >
            {saving
              ? initial
                ? "Saving…"
                : "Posting…"
              : initial
                ? "Save changes"
                : "Post bounty"}
            <ArrowUpRight size={14} />
          </button>
        </form>
    </BoardDialog>
  );
}
