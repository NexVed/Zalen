"use client";
/**
 * Gigs.tsx
 *
 * Renders a list of gig cards with category icon, status badge, budget,
 * duration, skills, proposal count, and author controls.
 */
import { useState } from "react";
import { useMutation } from "convex/react";
import {
  Pencil,
  Trash2,
  ExternalLink,
  Users,
  Code2,
  Palette,
  PenLine,
  Megaphone,
  Video,
  Database,
  Briefcase,
  Layers,
  Clock,
  DollarSign,
  CheckCircle2,
  XCircle,
  CircleDot,
  UserCheck,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import styles from "./Hub.module.css";
import gigStyles from "./Gigs.module.css";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Gig = {
  _id: Id<"gigs">;
  _creationTime: number;
  authorId: Id<"users">;
  authorName: string;
  title: string;
  description: string;
  category: string;
  status: string;
  budgetType?: string;
  budget?: string;
  duration?: string;
  skills?: string[];
  referenceUrl?: string;
  proposalCount: number;
  editedAt?: number;
  myProposalId: Id<"gigApplications"> | null;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export const CATEGORY_ICONS: Record<string, React.ElementType> = {
  development: Code2,
  design: Palette,
  writing: PenLine,
  marketing: Megaphone,
  video: Video,
  data: Database,
  consulting: Briefcase,
  other: Layers,
};

export const CATEGORY_LABELS: Record<string, string> = {
  development: "Development",
  design: "Design",
  writing: "Writing",
  marketing: "Marketing",
  video: "Video",
  data: "Data",
  consulting: "Consulting",
  other: "Other",
};

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; className: string }
> = {
  open: { label: "Open", icon: CircleDot, className: gigStyles.statusOpen },
  hired: { label: "Hired", icon: UserCheck, className: gigStyles.statusHired },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    className: gigStyles.statusCompleted,
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    className: gigStyles.statusCancelled,
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

export function Gigs({
  gigs,
  currentUserId,
  onOpen,
  onEdit,
}: {
  gigs: Gig[];
  currentUserId: Id<"users"> | null;
  signedIn: boolean;
  onOpen: (gig: Gig) => void;
  onEdit: (gig: Gig) => void;
  onSignIn: () => void;
}) {
  return (
    <div className={gigStyles.gigsLayout}>
      <div className={styles.rows}>
        {gigs.map((gig) => (
          <GigCard
            key={gig._id}
            gig={gig}
            currentUserId={currentUserId}
            onOpen={onOpen}
            onEdit={onEdit}
          />
        ))}
        {gigs.length === 0 && (
          <p className={gigStyles.empty}>
            No gigs yet. Post the first one!
          </p>
        )}
      </div>

      <aside className={gigStyles.sidebar} aria-label="Gig board tips">
        <h3>Gig board tips</h3>
        <p>
          Be specific about deliverables, timeline, and budget so freelancers
          can send targeted proposals.
        </p>
        <p>
          Include skills you need and a reference link when applicable — it
          speeds up the shortlisting process.
        </p>
        <p>
          Review proposals promptly. Accepting one marks the gig as hired and
          lets others know the position is filled.
        </p>
        <p>
          Looking for a full-time role? Try Opportunities. For technical
          challenges with bounties, check the Bounties board.
        </p>
      </aside>
    </div>
  );
}

// ---------------------------------------------------------------------------
// GigCard
// ---------------------------------------------------------------------------

function GigCard({
  gig,
  currentUserId,
  onOpen,
  onEdit,
}: {
  gig: Gig;
  currentUserId: Id<"users"> | null;
  onOpen: (gig: Gig) => void;
  onEdit: (gig: Gig) => void;
}) {
  const removeGig = useMutation(api.gigs.deleteGig);
  const [deleting, setDeleting] = useState(false);

  const isAuthor = !!currentUserId && gig.authorId === currentUserId;
  const CategoryIcon = CATEGORY_ICONS[gig.category] ?? Layers;
  const statusCfg = STATUS_CONFIG[gig.status] ?? STATUS_CONFIG.open;
  const StatusIcon = statusCfg.icon;
  const applied = !!gig.myProposalId;
  const isOpen = gig.status === "open";

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Delete this gig and all its proposals?")) return;
    setDeleting(true);
    try {
      await removeGig({ gigId: gig._id });
    } catch {
      setDeleting(false);
    }
  }

  return (
    <article
      className={`${gigStyles.gigCard} ${!isOpen && gig.status !== "open" ? gigStyles.gigCardClosed : ""}`}
      aria-label={gig.title}
    >
      {/* Category icon column */}
      <div className={gigStyles.iconCol}>
        <span className={gigStyles.categoryIcon} aria-hidden="true">
          <CategoryIcon size={18} />
        </span>
      </div>

      {/* Card body */}
      <div
        className={gigStyles.cardBody}
        role="button"
        tabIndex={0}
        onClick={() => onOpen(gig)}
        onKeyDown={(e) => e.key === "Enter" && onOpen(gig)}
      >
        {/* Top row: category + status + budget + duration */}
        <div className={gigStyles.cardTopRow}>
          <span className={gigStyles.categoryBadge}>
            {CATEGORY_LABELS[gig.category] ?? gig.category}
          </span>
          <span
            className={`${gigStyles.statusBadge} ${statusCfg.className}`}
          >
            <StatusIcon size={11} />
            {statusCfg.label}
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

        {/* Title */}
        <h3 className={gigStyles.cardTitle}>{gig.title}</h3>

        {/* Description preview */}
        <p className={gigStyles.cardDesc}>
          {gig.description.slice(0, 220)}
          {gig.description.length > 220 ? "…" : ""}
        </p>

        {/* Skills */}
        {gig.skills && gig.skills.length > 0 && (
          <div className={styles.tags}>
            {gig.skills.slice(0, 6).map((skill) => (
              <span key={skill} className={styles.tag}>
                {skill}
              </span>
            ))}
          </div>
        )}

        {/* Meta row */}
        <div className={gigStyles.cardMeta}>
          <span>{gig.authorName}</span>
          <span>{formatTimeAgo(gig._creationTime)}</span>
          {gig.editedAt && <span>edited</span>}
          <span className={gigStyles.proposalCount}>
            <Users size={11} />
            {gig.proposalCount}{" "}
            {gig.proposalCount === 1 ? "proposal" : "proposals"}
          </span>
          {gig.referenceUrl && (
            <a
              href={gig.referenceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={gigStyles.refLink}
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink size={11} />
              Reference
            </a>
          )}
          {applied && !isAuthor && (
            <span className={gigStyles.appliedBadge}>Applied</span>
          )}

          {/* Author controls */}
          {isAuthor && (
            <span
              className={styles.postActions}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className={styles.actionBtn}
                aria-label="Edit gig"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(gig);
                }}
              >
                <Pencil size={12} />
                Edit
              </button>
              <button
                className={`${styles.actionBtn} ${styles.actionDelete}`}
                aria-label="Delete gig"
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
