"use client";
/**
 * BountyDetailDialog.tsx
 *
 * Full-page detail overlay for a single bounty.
 * Shows:
 *  - Title, type, status, reward, description, tags, reference URL
 *  - Apply form (proposal) if the user hasn't applied yet and isn't the author
 *  - The user's own application with a solution-submission form
 *  - All applications (proposal + solution + status) for the bounty author
 *  - Accept / reject controls for the author on each pending application
 */
import { useState } from "react";
import * as stylex from "@stylexjs/stylex";
import {
  X,
  ArrowUpRight,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Trophy,
} from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { Bounty } from "./Bounties";
import { ui } from "./ui";
import styles from "./Hub.module.css";
import bountyStyles from "./Bounties.module.css";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Application = {
  _id: Id<"bountyApplications">;
  _creationTime: number;
  applicantId: Id<"users">;
  applicantName: string;
  proposal: string;
  solution?: string;
  status: string;
  editedAt?: number;
  isMine: boolean;
  isAuthor: boolean;
};

// ---------------------------------------------------------------------------
// BountyDetailDialog
// ---------------------------------------------------------------------------

export function BountyDetailDialog({
  bounty,
  currentUserId,
  signedIn,
  onClose,
  onSignIn,
  onDone,
}: {
  bounty: Bounty;
  currentUserId: Id<"users"> | null;
  signedIn: boolean;
  onClose: () => void;
  onSignIn: () => void;
  onDone: (message: string) => void;
}) {
  const isAuthor = !!currentUserId && bounty.authorId === currentUserId;
  const canApply =
    signedIn && !isAuthor && !bounty.myApplicationId && bounty.status === "open";

  const applications = useQuery(
    api.bounties.listApplications,
    { bountyId: bounty._id },
  ) as Application[] | undefined;

  return (
    <div
      className={styles.overlay}
      style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}
    >
      <div
        className={styles.dialog}
        style={{ maxWidth: 700 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bounty-detail-title"
      >
        {/* Header */}
        <div className={styles.dialogHeading}>
          <h2
            className={styles.dialogTitle}
            id="bounty-detail-title"
            style={{ fontSize: 22, wordBreak: "break-word" }}
          >
            {bounty.title}
          </h2>
          <button
            {...stylex.props(ui.iconButton)}
            aria-label="Close"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* Meta badges */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
          <span className={bountyStyles.typeBadge}>{bounty.type.replace("_", " ")}</span>
          <span
            className={`${bountyStyles.statusBadge} ${bountyStyles[`status${capitalize(camelize(bounty.status))}`] ?? ""}`}
          >
            {bounty.status.replace("_", " ")}
          </span>
          {bounty.reward && (
            <span className={bountyStyles.rewardBadge}>
              <Trophy size={11} />
              {bounty.reward}
            </span>
          )}
        </div>

        {/* Description */}
        <p className={styles.bodyText}>{bounty.description}</p>

        {/* Tags */}
        {bounty.tags && bounty.tags.length > 0 && (
          <div className={styles.tags} style={{ marginTop: 14 }}>
            {bounty.tags.map((t) => (
              <span key={t} className={styles.tag}>
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Reference link */}
        {bounty.repoUrl && (
          <a
            href={bounty.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={bountyStyles.repoLink}
            style={{ marginTop: 14, display: "inline-flex" }}
          >
            <ExternalLink size={13} />
            View reference / repo
          </a>
        )}

        <div style={{ borderTop: "1px solid var(--border)", marginTop: 24, paddingTop: 24 }}>
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 16 }}>
            Posted by {bounty.authorName} ·{" "}
            {bounty.applicationCount}{" "}
            {bounty.applicationCount === 1 ? "application" : "applications"}
          </p>

          {/* Apply form — for non-authors who haven't applied yet */}
          {canApply && (
            <ApplyForm
              bountyId={bounty._id}
              onDone={onDone}
            />
          )}

          {/* Not signed in */}
          {!signedIn && (
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
              <button
                {...stylex.props(ui.textButton)}
                onClick={onSignIn}
              >
                Sign in
              </button>{" "}
              to apply or submit a solution.
            </p>
          )}

          {/* The current user's application + solution form */}
          {bounty.myApplicationId && !isAuthor && (
            <MyApplicationSection
              applicationId={bounty.myApplicationId}
              bountyStatus={bounty.status}
              onDone={onDone}
            />
          )}

          {/* Author sees all applications */}
          {isAuthor && applications && applications.length > 0 && (
            <ApplicationsForAuthor
              applications={applications}
              bountyStatus={bounty.status}
              onDone={onDone}
            />
          )}

          {isAuthor && applications && applications.length === 0 && (
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
              No applications yet. Share the bounty to attract contributors.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Apply form
// ---------------------------------------------------------------------------

function ApplyForm({
  bountyId,
  onDone,
}: {
  bountyId: Id<"bounties">;
  onDone: (message: string) => void;
}) {
  const applyMutation = useMutation(api.bounties.applyToBounty);
  const [proposal, setProposal] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!proposal.trim()) return;
    setSaving(true);
    setError("");
    try {
      await applyMutation({ bountyId, proposal: proposal.trim() });
      onDone("Your application was submitted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit. Try again.");
      setSaving(false);
    }
  }

  return (
    <div>
      <h4 style={{ fontFamily: "var(--font-display)", fontSize: 16, marginBottom: 14 }}>
        Apply to this bounty
      </h4>
      <form
        className={styles.form}
        style={{ gap: 14 }}
        onSubmit={handleSubmit}
      >
        <label {...stylex.props(ui.label)}>
          Your proposal *
          <textarea
            required
            minLength={20}
            maxLength={2000}
            rows={4}
            placeholder="Describe your approach, relevant experience, and timeline…"
            value={proposal}
            onChange={(e) => setProposal(e.target.value)}
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
          style={{ alignSelf: "flex-start" }}
        >
          {saving ? "Submitting…" : "Submit application"}
          <ArrowUpRight size={14} />
        </button>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// My application section (edit proposal + submit solution)
// ---------------------------------------------------------------------------

function MyApplicationSection({
  applicationId,
  bountyStatus,
  onDone,
}: {
  applicationId: Id<"bountyApplications">;
  bountyStatus: string;
  onDone: (message: string) => void;
}) {
  const updateMutation = useMutation(api.bounties.updateApplication);
  const [solution, setSolution] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSolution(e: React.FormEvent) {
    e.preventDefault();
    if (!solution.trim()) return;
    setSaving(true);
    setError("");
    try {
      await updateMutation({
        applicationId,
        solution: solution.trim(),
      });
      onDone("Solution submitted!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
      setSaving(false);
    }
  }

  const canSubmitSolution =
    bountyStatus === "in_progress" || bountyStatus === "open";

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: 18,
        marginTop: 16,
      }}
    >
      <h4
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 16,
          marginBottom: 12,
        }}
      >
        Your application
      </h4>

      {canSubmitSolution && (
        <form
          className={styles.form}
          style={{ gap: 14 }}
          onSubmit={handleSolution}
        >
          <label {...stylex.props(ui.label)}>
            Submit your solution
            <textarea
              minLength={10}
              maxLength={5000}
              rows={4}
              placeholder="Describe your solution, paste a PR link, or add any relevant details…"
              value={solution}
              onChange={(e) => setSolution(e.target.value)}
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
            disabled={saving || !solution.trim()}
            style={{ alignSelf: "flex-start" }}
          >
            {saving ? "Saving…" : "Submit solution"}
            <ArrowUpRight size={14} />
          </button>
        </form>
      )}

      {!canSubmitSolution && (
        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
          This bounty is {bountyStatus}. No further submissions accepted.
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Applications section for bounty author
// ---------------------------------------------------------------------------

function ApplicationsForAuthor({
  applications,
  bountyStatus,
  onDone,
}: {
  applications: Application[];
  bountyStatus: string;
  onDone: (message: string) => void;
}) {
  const acceptMutation = useMutation(api.bounties.acceptApplication);
  const rejectMutation = useMutation(api.bounties.rejectApplication);
  const [busy, setBusy] = useState<Id<"bountyApplications"> | null>(null);

  async function handleAccept(appId: Id<"bountyApplications">) {
    if (!confirm("Accept this application? All others will be rejected and the bounty marked completed.")) return;
    setBusy(appId);
    try {
      await acceptMutation({ applicationId: appId });
      onDone("Application accepted. Bounty marked as completed!");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error accepting application.");
      setBusy(null);
    }
  }

  async function handleReject(appId: Id<"bountyApplications">) {
    setBusy(appId);
    try {
      await rejectMutation({ applicationId: appId });
      onDone("Application rejected.");
    } catch {
      setBusy(null);
    }
  }

  const canReview = bountyStatus !== "completed" && bountyStatus !== "cancelled";

  return (
    <div>
      <h4
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 16,
          marginBottom: 14,
        }}
      >
        Applications ({applications.length})
      </h4>
      <div className={bountyStyles.appList}>
        {applications.map((app) => (
          <div
            key={app._id}
            className={`${bountyStyles.appCard} ${app.status === "accepted" ? bountyStyles.accepted : app.status === "rejected" ? bountyStyles.rejected : ""}`}
          >
            <div className={bountyStyles.appCardHeader}>
              <span className={bountyStyles.appAuthor}>{app.applicantName}</span>
              <span
                className={`${bountyStyles.statusBadge} ${
                  app.status === "accepted"
                    ? bountyStyles.statusCompleted
                    : app.status === "rejected"
                      ? bountyStyles.statusCancelled
                      : bountyStyles.statusOpen
                }`}
              >
                {app.status === "accepted" ? (
                  <CheckCircle2 size={11} />
                ) : app.status === "rejected" ? (
                  <XCircle size={11} />
                ) : null}
                {app.status}
              </span>
            </div>

            <p className={bountyStyles.appProposal}>{app.proposal}</p>

            {app.solution && (
              <div className={bountyStyles.appSolution}>
                <p className={bountyStyles.appSolutionLabel}>Solution</p>
                <p className={bountyStyles.appSolutionBody}>{app.solution}</p>
              </div>
            )}

            {canReview && app.status === "pending" && (
              <div className={bountyStyles.appActions}>
                <button
                  {...stylex.props(ui.primary)}
                  style={{ fontSize: 12, minHeight: 34, padding: "0 14px" }}
                  disabled={busy === app._id}
                  onClick={() => handleAccept(app._id)}
                >
                  <CheckCircle2 size={13} />
                  Accept
                </button>
                <button
                  {...stylex.props(ui.secondary)}
                  style={{ fontSize: 12, minHeight: 34, padding: "0 14px" }}
                  disabled={busy === app._id}
                  onClick={() => handleReject(app._id)}
                >
                  <XCircle size={13} />
                  Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function camelize(str: string) {
  return str.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}
