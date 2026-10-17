"use client";
/**
 * GigPostDialog.tsx
 *
 * Modal form for creating or editing a gig.
 * Fields: title, category, budget type, budget, duration, description,
 * required skills (comma-separated), reference URL.
 */
import { useState } from "react";
import * as stylex from "@stylexjs/stylex";
import { ArrowUpRight, X } from "lucide-react";
import { ui } from "./ui";
import styles from "./Hub.module.css";
import gigStyles from "./Gigs.module.css";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const GIG_CATEGORIES = [
  { value: "development", label: "Development" },
  { value: "design", label: "Design" },
  { value: "writing", label: "Writing" },
  { value: "marketing", label: "Marketing" },
  { value: "video", label: "Video & Animation" },
  { value: "data", label: "Data & Analytics" },
  { value: "consulting", label: "Consulting" },
  { value: "other", label: "Other" },
] as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type GigFormValues = {
  title: string;
  category: string;
  budgetType: string;
  budget: string;
  duration: string;
  description: string;
  skills: string[];
  referenceUrl: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GigPostDialog({
  initial,
  onClose,
  onSave,
}: {
  initial?: Partial<GigFormValues>;
  onClose: () => void;
  onSave: (values: GigFormValues) => Promise<void>;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [category, setCategory] = useState(initial?.category ?? "development");
  const [budgetType, setBudgetType] = useState(initial?.budgetType ?? "fixed");
  const [budget, setBudget] = useState(initial?.budget ?? "");
  const [duration, setDuration] = useState(initial?.duration ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [skillsInput, setSkillsInput] = useState(
    (initial?.skills ?? []).join(", "),
  );
  const [referenceUrl, setReferenceUrl] = useState(
    initial?.referenceUrl ?? "",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const skills = skillsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 12);

    setSaving(true);
    setError("");
    try {
      await onSave({
        title: title.trim(),
        category,
        budgetType,
        budget: budget.trim(),
        duration: duration.trim(),
        description: description.trim(),
        skills,
        referenceUrl: referenceUrl.trim(),
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save. Please try again.",
      );
      setSaving(false);
    }
  }

  return (
    <div
      className={styles.overlay}
      style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}
    >
      <div
        className={styles.dialog}
        style={{ maxWidth: 680 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="gig-post-title"
      >
        {/* Header */}
        <div className={styles.dialogHeading}>
          <h2 className={styles.dialogTitle} id="gig-post-title">
            {initial ? "Edit gig" : "Post a gig"}
          </h2>
          <button
            {...stylex.props(ui.iconButton)}
            aria-label="Close"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <p className={styles.dialogDescription}>
          {initial
            ? "Update the details of your gig."
            : "Describe the work you need done. The more specific you are, the better the proposals you'll receive."}
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          {/* Title */}
          <label {...stylex.props(ui.label)}>
            Title *
            <input
              required
              minLength={8}
              maxLength={140}
              placeholder="e.g. Build a responsive landing page in Next.js"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              {...stylex.props(ui.input)}
            />
          </label>

          {/* Category + Budget Type (two columns) */}
          <div className={gigStyles.twoCol}>
            <label {...stylex.props(ui.label)}>
              Category *
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                {...stylex.props(ui.input)}
              >
                {GIG_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>

            <label {...stylex.props(ui.label)}>
              Budget type
              <select
                value={budgetType}
                onChange={(e) => setBudgetType(e.target.value)}
                {...stylex.props(ui.input)}
              >
                <option value="fixed">Fixed price</option>
                <option value="hourly">Hourly rate</option>
              </select>
            </label>
          </div>

          {/* Budget + Duration (two columns) */}
          <div className={gigStyles.twoCol}>
            <label {...stylex.props(ui.label)}>
              Budget
              <input
                maxLength={80}
                placeholder={
                  budgetType === "hourly" ? "$25/hr, ₹500/hr…" : "$500, ₹10,000, open…"
                }
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                {...stylex.props(ui.input)}
              />
            </label>

            <label {...stylex.props(ui.label)}>
              Duration
              <input
                maxLength={60}
                placeholder="1 week, 2 months, ongoing…"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
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
              placeholder="Describe the project scope, deliverables, and any technical requirements or constraints…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              {...stylex.props(ui.input)}
            />
          </label>

          {/* Required skills */}
          <label {...stylex.props(ui.label)}>
            Required skills (comma-separated)
            <input
              maxLength={200}
              placeholder="React, Node.js, Figma, copywriting…"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              {...stylex.props(ui.input)}
            />
          </label>

          {/* Reference URL */}
          <label {...stylex.props(ui.label)}>
            Reference URL
            <input
              type="url"
              maxLength={500}
              placeholder="https://figma.com/file/… or a design brief link"
              value={referenceUrl}
              onChange={(e) => setReferenceUrl(e.target.value)}
              {...stylex.props(ui.input)}
            />
          </label>

          {error && (
            <p className={gigStyles.formError} role="alert">
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
                : "Post gig"}
            <ArrowUpRight size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}
