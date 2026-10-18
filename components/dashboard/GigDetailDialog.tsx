"use client";
/**
 * GigDetailDialog.tsx
 *
 * Full detail overlay for a single gig.
 * - Full description, skills, budget, duration, reference URL
 * - Proposal form for eligible freelancers
 * - Edit form for the user's own existing proposal
 * - All proposals (with accept / reject) for the gig author
 */
import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as stylex from "@stylexjs/stylex";
import {
  X,
  ArrowUpRight,
  ExternalLink,
  CheckCircle2,
  XCircle,
  DollarSign,
  Clock,
} from "lucide-react";
import { useMutation } from "convex/react";
import { useLiveQuery } from "@/lib/use-live-query";
import { ServiceState } from "./ServiceState";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { Gig } from "./Gigs";
import { CATEGORY_LABELS } from "./Gigs";
import { ui } from "./ui";
import { BoardDialog } from "./BoardDialog";
import styles from "./Hub.module.css";
import gigStyles from "./Gigs.module.css";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Proposal = {
  _id: Id<"gigApplications">;
  _creationTime: number;
  applicantId: Id<"users">;
  applicantName: string;
  coverLetter: string;
  proposedRate?: string;
  portfolioUrl?: string;
  status: string;
  editedAt?: number;
  isMine: boolean;
  isAuthor: boolean;
};

// ---------------------------------------------------------------------------
// GigDetailDialog
// ---------------------------------------------------------------------------

export function GigDetailDialog({
  gig,
  currentUserId,
  signedIn,
  onClose,
  onSignIn,
  onDone,
}: {
  gig: Gig;
  currentUserId: Id<"users"> | null;
  signedIn: boolean;
  onClose: () => void;
  onSignIn: () => void;
  onDone: (message: string) => void;
}) {
  const isAuthor = !!currentUserId && gig.authorId === currentUserId;
  const canApply =
    signedIn && !isAuthor && !gig.myProposalId && gig.status === "open";

  const { data: proposals, error: loadError, retry } = useLiveQuery(api.gigs.listProposals, {
    gigId: gig._id,
  });

  // The current user's own proposal (if any) from the list
  const myProposal = proposals?.find((p) => p.isMine);

  return (
    <BoardDialog title={gig.title} onClose={onClose} maxWidth={720}>
        {loadError && <ServiceState title="Applications" onRetry={retry} />}
        {/* Header */}
        <div className={styles.dialogHeading}>
          <Dialog.Title
            className={styles.dialogTitle}
            style={{ fontSize: 22, wordBreak: "break-word" }}
          >
            {gig.title}
          </Dialog.Title>
          <button
            {...stylex.props(ui.iconButton)}
            aria-label="Close"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* Meta badges */}
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 18,
          }}
        >
          <span className={gigStyles.categoryBadge}>
            {CATEGORY_LABELS[gig.category] ?? gig.category}
          </span>
          <span
            className={`${gigStyles.statusBadge} ${gigStyles[`status${capitalize(gig.status)}`] ?? ""}`}
          >
            {gig.status}
          </span>
          {gig.budget && (
            <span className={gigStyles.budgetBadge}>
              <DollarSign size={11} />
              {gig.budget}
              {gig.budgetType === "hourly" ? "/hr" : ""}
            </span>
          )}
          {gig.duration && (
            <span className={gigStyles.durationBadge}>
              <Clock size={11} />
              {gig.duration}
            </span>
          )}
        </div>

        {/* Description */}
        <p className={styles.bodyText}>{gig.description}</p>

        {/* Skills */}
        {gig.skills && gig.skills.length > 0 && (
          <div className={styles.tags} style={{ marginTop: 14 }}>
            {gig.skills.map((s) => (
              <span key={s} className={styles.tag}>
                {s}
              </span>
            ))}
          </div>
        )}

        {/* Reference link */}
        {gig.referenceUrl && (
          <a
            href={gig.referenceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={gigStyles.refLink}
            style={{ marginTop: 14, display: "inline-flex" }}
          >
            <ExternalLink size={13} />
            View reference / brief
          </a>
        )}

        <div
          style={{
            borderTop: "1px solid var(--border)",
            marginTop: 24,
            paddingTop: 24,
          }}
        >
          <p
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              marginBottom: 16,
            }}
          >
            Posted by {gig.authorName} · {gig.proposalCount}{" "}
            {gig.proposalCount === 1 ? "proposal" : "proposals"}
          </p>

          {/* Proposal form for new applicants */}
          {canApply && (
            <ProposalForm gigId={gig._id} onDone={onDone} />
          )}

          {/* Sign-in prompt */}
          {!signedIn && (
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
              <button {...stylex.props(ui.textButton)} onClick={onSignIn}>
                Sign in
              </button>{" "}
              to submit a proposal.
            </p>
          )}

          {/* Already applied — show own proposal with edit option */}
          {gig.myProposalId && !isAuthor && myProposal && (
            <MyProposalSection proposal={myProposal} gigStatus={gig.status} onDone={onDone} />
          )}

          {/* Author: all proposals */}
          {isAuthor && proposals && proposals.length > 0 && (
            <ProposalsForAuthor
              proposals={proposals}
              gigStatus={gig.status}
              onDone={onDone}
            />
          )}

          {isAuthor && proposals && proposals.length === 0 && (
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
              No proposals yet. Share this gig to attract freelancers.
            </p>
          )}
        </div>
    </BoardDialog>
  );
}

// ---------------------------------------------------------------------------
// Proposal submission form
// ---------------------------------------------------------------------------

function ProposalForm({
  gigId,
  onDone,
}: {
  gigId: Id<"gigs">;
  onDone: (message: string) => void;
}) {
  const submitMutation = useMutation(api.gigs.submitProposal);
  const [coverLetter, setCoverLetter] = useState("");
  const [proposedRate, setProposedRate] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!coverLetter.trim()) return;
    setSaving(true);
    setError("");
    try {
      await submitMutation({
        gigId,
        coverLetter: coverLetter.trim(),
        proposedRate: proposedRate.trim() || undefined,
        portfolioUrl: portfolioUrl.trim() || undefined,
      });
      onDone("Your proposal was submitted.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not submit. Try again.",
      );
      setSaving(false);
    }
  }

  return (
    <div>
      <h4
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 16,
          marginBottom: 14,
        }}
      >
        Submit a proposal
      </h4>
      <form
        className={styles.form}
        style={{ gap: 14 }}
        onSubmit={handleSubmit}
      >
        <label {...stylex.props(ui.label)}>
          Cover letter *
          <textarea
            required
            minLength={20}
            maxLength={2000}
            rows={4}
            placeholder="Introduce yourself, describe your relevant experience, and explain how you'd approach this project…"
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            {...stylex.props(ui.input)}
          />
        </label>

        <div className={gigStyles.twoCol}>
          <label {...stylex.props(ui.label)}>
            Your rate / quote
            <input
              maxLength={80}
              placeholder="$500 fixed, $30/hr…"
              value={proposedRate}
              onChange={(e) => setProposedRate(e.target.value)}
              {...stylex.props(ui.input)}
            />
          </label>

          <label {...stylex.props(ui.label)}>
            Portfolio / profile URL
            <input
              type="url"
              maxLength={500}
              placeholder="https://your-portfolio.com"
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              {...stylex.props(ui.input)}
            />
          </label>
        </div>

        {error && (
          <p className={gigStyles.formError} role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          {...stylex.props(ui.primary)}
          disabled={saving}
          style={{ alignSelf: "flex-start" }}
        >
          {saving ? "Submitting…" : "Submit proposal"}
          <ArrowUpRight size={14} />
        </button>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Current user's existing proposal
// ---------------------------------------------------------------------------

function MyProposalSection({
  proposal,
  gigStatus,
  onDone,
}: {
  proposal: Proposal;
  gigStatus: string;
  onDone: (message: string) => void;
}) {
  const editMutation = useMutation(api.gigs.editProposal);
  const [editing, setEditing] = useState(false);
  const [coverLetter, setCoverLetter] = useState(proposal.coverLetter);
  const [proposedRate, setProposedRate] = useState(proposal.proposedRate ?? "");
  const [portfolioUrl, setPortfolioUrl] = useState(proposal.portfolioUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!coverLetter.trim()) return;
    setSaving(true);
    setError("");
    try {
      await editMutation({
        proposalId: proposal._id,
        coverLetter: coverLetter.trim(),
        proposedRate: proposedRate.trim() || undefined,
        portfolioUrl: portfolioUrl.trim() || undefined,
      });
      setEditing(false);
      onDone("Proposal updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
      setSaving(false);
    }
  }

  const canEdit = gigStatus === "open" && proposal.status !== "accepted";

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: 18,
        marginTop: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <h4 style={{ fontFamily: "var(--font-display)", fontSize: 16 }}>
          Your proposal
        </h4>
        <span
          className={`${gigStyles.statusBadge} ${
            proposal.status === "accepted"
              ? gigStyles.statusHired
              : proposal.status === "rejected"
                ? gigStyles.statusCancelled
                : gigStyles.statusOpen
          }`}
        >
          {proposal.status}
        </span>
      </div>

      {!editing ? (
        <>
          <p className={gigStyles.proposalBody}>{proposal.coverLetter}</p>
          {proposal.proposedRate && (
            <p
              style={{
                fontSize: 12,
                marginTop: 8,
                color: "var(--accent-primary)",
                fontWeight: 600,
              }}
            >
              Rate: {proposal.proposedRate}
            </p>
          )}
          {proposal.portfolioUrl && (
            <a
              href={proposal.portfolioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={gigStyles.portfolioLink}
              style={{ marginTop: 8 }}
            >
              <ExternalLink size={12} />
              View portfolio
            </a>
          )}
          {canEdit && (
            <button
              {...stylex.props(ui.secondary)}
              style={{ marginTop: 14, fontSize: 12, minHeight: 34 }}
              onClick={() => setEditing(true)}
            >
              Edit proposal
            </button>
          )}
        </>
      ) : (
        <form
          className={styles.form}
          style={{ gap: 14 }}
          onSubmit={handleEdit}
        >
          <label {...stylex.props(ui.label)}>
            Cover letter *
            <textarea
              required
              minLength={20}
              maxLength={2000}
              rows={4}
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              {...stylex.props(ui.input)}
            />
          </label>
          <div className={gigStyles.twoCol}>
            <label {...stylex.props(ui.label)}>
              Rate / quote
              <input
                maxLength={80}
                value={proposedRate}
                onChange={(e) => setProposedRate(e.target.value)}
                {...stylex.props(ui.input)}
              />
            </label>
            <label {...stylex.props(ui.label)}>
              Portfolio URL
              <input
                type="url"
                maxLength={500}
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                {...stylex.props(ui.input)}
              />
            </label>
          </div>
          {error && (
            <p className={gigStyles.formError} role="alert">
              {error}
            </p>
          )}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="submit"
              {...stylex.props(ui.primary)}
              disabled={saving}
              style={{ fontSize: 12, minHeight: 34, padding: "0 14px" }}
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
            <button
              type="button"
              {...stylex.props(ui.secondary)}
              style={{ fontSize: 12, minHeight: 34, padding: "0 14px" }}
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// All proposals for the gig author
// ---------------------------------------------------------------------------

function ProposalsForAuthor({
  proposals,
  gigStatus,
  onDone,
}: {
  proposals: Proposal[];
  gigStatus: string;
  onDone: (message: string) => void;
}) {
  const acceptMutation = useMutation(api.gigs.acceptProposal);
  const rejectMutation = useMutation(api.gigs.rejectProposal);
  const [busy, setBusy] = useState<Id<"gigApplications"> | null>(null);

  async function handleAccept(proposalId: Id<"gigApplications">) {
    if (
      !confirm(
        "Accept this proposal? All others will be rejected and the gig marked as hired.",
      )
    )
      return;
    setBusy(proposalId);
    try {
      await acceptMutation({ proposalId });
      onDone("Proposal accepted. Gig marked as hired!");
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Error accepting proposal.",
      );
      setBusy(null);
    }
  }

  async function handleReject(proposalId: Id<"gigApplications">) {
    setBusy(proposalId);
    try {
      await rejectMutation({ proposalId });
      onDone("Proposal rejected.");
    } catch {
      setBusy(null);
    }
  }

  const canReview =
    gigStatus !== "hired" &&
    gigStatus !== "completed" &&
    gigStatus !== "cancelled";

  return (
    <div>
      <h4
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 16,
          marginBottom: 14,
        }}
      >
        Proposals ({proposals.length})
      </h4>
      <div className={gigStyles.proposalList}>
        {proposals.map((p) => (
          <div
            key={p._id}
            className={`${gigStyles.proposalCard} ${
              p.status === "accepted"
                ? gigStyles.accepted
                : p.status === "rejected"
                  ? gigStyles.rejected
                  : ""
            }`}
          >
            <div className={gigStyles.proposalHeader}>
              <span className={gigStyles.proposalAuthor}>{p.applicantName}</span>
              {p.proposedRate && (
                <span className={gigStyles.proposalRate}>{p.proposedRate}</span>
              )}
              <span
                className={`${gigStyles.statusBadge} ${
                  p.status === "accepted"
                    ? gigStyles.statusHired
                    : p.status === "rejected"
                      ? gigStyles.statusCancelled
                      : gigStyles.statusOpen
                }`}
              >
                {p.status === "accepted" ? (
                  <CheckCircle2 size={11} />
                ) : p.status === "rejected" ? (
                  <XCircle size={11} />
                ) : null}
                {p.status}
              </span>
            </div>

            <p className={gigStyles.proposalBody}>{p.coverLetter}</p>

            {p.portfolioUrl && (
              <a
                href={p.portfolioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={gigStyles.portfolioLink}
              >
                <ExternalLink size={12} />
                View portfolio
              </a>
            )}

            {canReview && p.status === "pending" && (
              <div className={gigStyles.proposalActions}>
                <button
                  {...stylex.props(ui.primary)}
                  style={{ fontSize: 12, minHeight: 34, padding: "0 14px" }}
                  disabled={busy === p._id}
                  onClick={() => handleAccept(p._id)}
                >
                  <CheckCircle2 size={13} />
                  Accept
                </button>
                <button
                  {...stylex.props(ui.secondary)}
                  style={{ fontSize: 12, minHeight: 34, padding: "0 14px" }}
                  disabled={busy === p._id}
                  onClick={() => handleReject(p._id)}
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
// Helper
// ---------------------------------------------------------------------------

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
