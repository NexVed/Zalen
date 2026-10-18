"use client";
/**
 * Bounties.tsx
 *
 * Renders a list of bounty cards with upvote, type badge, status badge,
 * reward, tags, and author controls. Mirrors the Forum card pattern.
 */
import { useMutation } from "convex/react";
import {
  ArrowUp,
  Pencil,
  Trash2,
  ExternalLink,
  Users,
  Trophy,
  Bug,
  Lightbulb,
  Code2,
  Palette,
  FileText,
  FlaskConical,
  Layers,
  Clock,
  CheckCircle2,
  XCircle,
  CircleDot,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import styles from "./Hub.module.css";
import bountyStyles from "./Bounties.module.css";
import { useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Bounty = {
  _id: Id<"bounties">;
  _creationTime: number;
  authorId: Id<"users">;
  authorName: string;
  title: string;
  description: string;
  type: string;
  status: string;
  reward?: string;
  repoUrl?: string;
  tags?: string[];
  applicationCount: number;
  score: number;
  editedAt?: number;
  myVote: boolean;
  myApplicationId: Id<"bountyApplications"> | null;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TYPE_ICONS: Record<string, React.ElementType> = {
  bug: Bug,
  feature: Lightbulb,
  code_review: Code2,
  design: Palette,
  docs: FileText,
  research: FlaskConical,
  other: Layers,
};

const TYPE_LABELS: Record<string, string> = {
  bug: "Bug",
  feature: "Feature",
  code_review: "Code Review",
  design: "Design",
  docs: "Docs",
  research: "Research",
  other: "Other",
};

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; className: string }
> = {
  open: { label: "Open", icon: CircleDot, className: bountyStyles.statusOpen },
  in_progress: {
    label: "In Progress",
    icon: Clock,
    className: bountyStyles.statusInProgress,
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    className: bountyStyles.statusCompleted,
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    className: bountyStyles.statusCancelled,
  },
};

function formatTimeAgo(ms: number): string {
  const secs = Math.floor((Date.now() - ms) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function Bounties({
  bounties,
  currentUserId,
  signedIn,
  onOpen,
  onEdit,
  onSignIn,
}: {
  bounties: Bounty[];
  currentUserId: Id<"users"> | null;
  signedIn: boolean;
  onOpen: (bounty: Bounty) => void;
  onEdit: (bounty: Bounty) => void;
  onSignIn: () => void;
}) {
  return (
    <div className={bountyStyles.bountiesLayout}>
      <div className={styles.rows}>
        {bounties.map((bounty) => (
          <BountyCard
            key={bounty._id}
            bounty={bounty}
            currentUserId={currentUserId}
            signedIn={signedIn}
            onOpen={onOpen}
            onEdit={onEdit}
            onSignIn={onSignIn}
          />
        ))}
        {bounties.length === 0 && (
          <p className={bountyStyles.empty}>
            No bounties yet. Post the first one!
          </p>
        )}
      </div>

      <aside
        className={bountyStyles.sidebar}
        aria-label="Bounty board guidelines"
      >
        <h3>Bounty guidelines</h3>
        <p>
          Be specific — include reproduction steps for bugs, acceptance criteria
          for features, and reference links wherever possible.
        </p>
        <p>
          State your reward clearly. It can be monetary, crypto, open-source
          credit, or a simple shout-out.
        </p>
        <p>
          Review applications promptly and accept one when the work meets your
          criteria.
        </p>
        <p>Respectful, constructive feedback keeps the community healthy.</p>
      </aside>
    </div>
  );
}

// ---------------------------------------------------------------------------
// BountyCard
// ---------------------------------------------------------------------------

function BountyCard({
  bounty,
  currentUserId,
  signedIn,
  onOpen,
  onEdit,
  onSignIn,
}: {
  bounty: Bounty;
  currentUserId: Id<"users"> | null;
  signedIn: boolean;
  onOpen: (bounty: Bounty) => void;
  onEdit: (bounty: Bounty) => void;
  onSignIn: () => void;
}) {
  const castVote = useMutation(api.bounties.voteBounty);
  const removeBounty = useMutation(api.bounties.deleteBounty);
  const [voting, setVoting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isAuthor = !!currentUserId && bounty.authorId === currentUserId;
  const TypeIcon = TYPE_ICONS[bounty.type] ?? Layers;
  const statusCfg = STATUS_CONFIG[bounty.status] ?? STATUS_CONFIG.open;
  const StatusIcon = statusCfg.icon;
  const canVote = signedIn && bounty.status !== "cancelled";
  const applied = !!bounty.myApplicationId;

  async function handleVote(e: React.MouseEvent) {
    e.stopPropagation();
    if (!canVote) {
      if (!signedIn) onSignIn();
      return;
    }
    if (voting) return;
    setVoting(true);
    try {
      await castVote({ bountyId: bounty._id });
    } finally {
      setVoting(false);
    }
  }

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Delete this bounty and all its applications?")) return;
    setDeleting(true);
    try {
      await removeBounty({ bountyId: bounty._id });
    } catch {
      setDeleting(false);
    }
  }

  return (
    <article
      className={`${bountyStyles.bountyCard} ${bounty.status === "completed" ? bountyStyles.cardCompleted : ""}`}
      aria-label={bounty.title}
    >
      {/* Vote column */}
      <div
        className={bountyStyles.voteCol}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className={`${bountyStyles.voteBtn} ${bounty.myVote ? bountyStyles.voted : ""}`}
          aria-label="Upvote"
          aria-pressed={bounty.myVote}
          disabled={voting || !canVote}
          onClick={handleVote}
        >
          <ArrowUp size={16} />
        </button>
        <span className={bountyStyles.voteCount}>{bounty.score}</span>
      </div>

      {/* Card body — click to open detail */}
      <div
        className={bountyStyles.cardBody}
        role="button"
        tabIndex={0}
        onClick={() => onOpen(bounty)}
        onKeyDown={(e) => e.key === "Enter" && onOpen(bounty)}
      >
        {/* Top row: type + status + reward */}
        <div className={bountyStyles.cardTopRow}>
          <span className={bountyStyles.typeBadge}>
            <TypeIcon size={12} />
            {TYPE_LABELS[bounty.type] ?? bounty.type}
          </span>
          <span
            className={`${bountyStyles.statusBadge} ${statusCfg.className}`}
          >
            <StatusIcon size={11} />
            {statusCfg.label}
          </span>
          {bounty.reward && (
            <span className={bountyStyles.rewardBadge}>
              <Trophy size={11} />
              {bounty.reward}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className={bountyStyles.cardTitle}>{bounty.title}</h3>

        {/* Description preview */}
        <p className={bountyStyles.cardDesc}>
          {bounty.description.slice(0, 220)}
          {bounty.description.length > 220 ? "…" : ""}
        </p>

        {/* Tags */}
        {bounty.tags && bounty.tags.length > 0 && (
          <div className={styles.tags}>
            {bounty.tags.slice(0, 6).map((tag) => (
              <span key={tag} className={styles.tag}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Meta row */}
        <div className={bountyStyles.cardMeta}>
          <span>{bounty.authorName}</span>
          <span>{formatTimeAgo(bounty._creationTime)}</span>
          {bounty.editedAt && <span>edited</span>}
          <span className={bountyStyles.appCount}>
            <Users size={11} />
            {bounty.applicationCount}{" "}
            {bounty.applicationCount === 1 ? "application" : "applications"}
          </span>
          {bounty.repoUrl && (
            <a
              href={bounty.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={bountyStyles.repoLink}
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink size={11} />
              Reference
            </a>
          )}
          {applied && !isAuthor && (
            <span className={bountyStyles.appliedBadge}>Applied</span>
          )}

          {/* Author controls */}
          {isAuthor && (
            <span
              className={styles.postActions}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className={styles.actionBtn}
                aria-label="Edit bounty"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(bounty);
                }}
              >
                <Pencil size={12} />
                Edit
              </button>
              <button
                className={`${styles.actionBtn} ${styles.actionDelete}`}
                aria-label="Delete bounty"
                disabled={deleting}
                onClick={handleDelete}
              >
                <Trash2 size={12} />
                Delete
              </button>
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
