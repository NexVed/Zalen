"use client";
/**
 * BountiesPage.tsx
 *
 * Full bounty-board page component.
 * Wired directly to Convex: real-time list, post, edit, delete, upvote, apply,
 * submit solution, and author accept/reject.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import * as stylex from "@stylexjs/stylex";
import { Search, Plus, ArrowUpRight, Info } from "lucide-react";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Bounties, type Bounty } from "./Bounties";
import { BountyPostDialog, type BountyFormValues } from "./BountyPostDialog";
import { BountyDetailDialog } from "./BountyDetailDialog";
import { ui } from "./ui";
import styles from "./Hub.module.css";

// ---------------------------------------------------------------------------
// Filter config
// ---------------------------------------------------------------------------

const TYPE_FILTERS = [
  { label: "All", value: "" },
  { label: "Bug", value: "bug" },
  { label: "Feature", value: "feature" },
  { label: "Code Review", value: "code_review" },
  { label: "Design", value: "design" },
  { label: "Docs", value: "docs" },
  { label: "Research", value: "research" },
  { label: "Other", value: "other" },
];

const STATUS_FILTERS = [
  { label: "Open", value: "open" },
  { label: "In Progress", value: "in_progress" },
  { label: "Completed", value: "completed" },
  { label: "All statuses", value: "" },
];

// ---------------------------------------------------------------------------
// BountiesPage
// ---------------------------------------------------------------------------

export function BountiesPage({
  userId,
  search,
  onSearch,
}: {
  userId: string | null;
  search: string;
  onSearch: (value: string) => void;
}) {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();

  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("open");
  const [showPost, setShowPost] = useState(false);
  const [editTarget, setEditTarget] = useState<Bounty | null>(null);
  const [detailTarget, setDetailTarget] = useState<Bounty | null>(null);
  const [message, setMessage] = useState("");

  // Resolve Convex user
  const convexUser = useQuery(
    api.users.current,
    isAuthenticated ? {} : "skip",
  );
  const currentUserId = (convexUser?._id ?? null) as Id<"users"> | null;

  // Fetch bounties
  const rawBounties = useQuery(api.bounties.listBounties, {
    type: typeFilter || undefined,
    status: statusFilter || undefined,
  }) as (Bounty & { myVote: boolean; myApplicationId: Id<"bountyApplications"> | null })[] | undefined;

  // Mutations
  const createBounty = useMutation(api.bounties.createBounty);
  const editBounty = useMutation(api.bounties.editBounty);

  const query = search.trim().toLowerCase();
  const bounties: Bounty[] = (rawBounties ?? []).filter(
    (b) =>
      !query ||
      `${b.title} ${b.description} ${b.authorName} ${(b.tags ?? []).join(" ")} ${b.type}`
        .toLowerCase()
        .includes(query),
  );

  const loading = rawBounties === undefined;

  function requireAccount(action: () => void) {
    if (!userId) {
      router.push("/sign-up");
    } else {
      action();
    }
  }

  function flash(msg: string) {
    setMessage(msg);
    setTimeout(() => setMessage(""), 5000);
  }

  async function handleSavePost(values: BountyFormValues) {
    await createBounty({
      title: values.title,
      type: values.type,
      description: values.description,
      reward: values.reward || undefined,
      repoUrl: values.repoUrl || undefined,
      tags: values.tags.length ? values.tags : undefined,
    });
    setShowPost(false);
    flash("Your bounty was posted.");
  }

  async function handleSaveEdit(values: BountyFormValues) {
    if (!editTarget) return;
    await editBounty({
      bountyId: editTarget._id,
      title: values.title,
      type: values.type,
      description: values.description,
      reward: values.reward || undefined,
      repoUrl: values.repoUrl || undefined,
      tags: values.tags.length ? values.tags : undefined,
    });
    setEditTarget(null);
    flash("Bounty updated.");
  }

  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero} aria-label="Bounty board introduction">
        <div>
          <h2>Bounty board</h2>
          <p>
            Post bugs, feature requests, code-review asks, and more. Browse open
            bounties and apply with your proposal or solution.
          </p>
          <button
            {...stylex.props(ui.primary)}
            onClick={() => requireAccount(() => setShowPost(true))}
          >
            Post a bounty
            <ArrowUpRight size={15} />
          </button>
        </div>
      </section>

      {/* Toast / status message */}
      {message && (
        <p className={styles.note} role="status">
          <Info size={16} />
          {message}
          <button
            aria-label="Dismiss message"
            className={styles.cardButton}
            onClick={() => setMessage("")}
          >
            Dismiss
          </button>
        </p>
      )}

      {/* Toolbar */}
      <div className={styles.toolbar}>
        {/* Type filters */}
        <div className={styles.tabs} role="group" aria-label="Bounty type filter">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              className={`${styles.tab} ${typeFilter === f.value ? styles.active : ""}`}
              aria-pressed={typeFilter === f.value}
              onClick={() => setTypeFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <label className={styles.search}>
          <Search size={15} />
          <input
            type="search"
            aria-label="Search bounties"
            placeholder="Search by title, tag, or author…"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
          />
        </label>
      </div>

      {/* Status sub-filter */}
      <div
        className={styles.tabs}
        role="group"
        aria-label="Bounty status filter"
        style={{ marginTop: -8 }}
      >
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            className={`${styles.tab} ${statusFilter === f.value ? styles.active : ""}`}
            aria-pressed={statusFilter === f.value}
            onClick={() => setStatusFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Meta bar */}
      <div className={styles.meta}>
        <span>
          {loading
            ? "Loading bounties…"
            : `${bounties.length} ${bounties.length === 1 ? "bounty" : "bounties"} · Powered by Convex`}
        </span>
        {userId && (
          <button
            className={styles.cardButton}
            onClick={() => setShowPost(true)}
          >
            <Plus size={13} />
            New bounty
          </button>
        )}
      </div>

      {/* Bounty list */}
      <section id="bounty-results" aria-label="Bounty results">
        {loading ? (
          <div className={styles.empty}>
            <p>Loading bounties…</p>
          </div>
        ) : (
          <Bounties
            bounties={bounties}
            currentUserId={currentUserId}
            signedIn={!!userId}
            onOpen={(b) => setDetailTarget(b)}
            onEdit={(b) => setEditTarget(b)}
            onSignIn={() => router.push("/sign-in")}
          />
        )}
      </section>

      {/* Post dialog */}
      {showPost && (
        <BountyPostDialog
          onClose={() => setShowPost(false)}
          onSave={handleSavePost}
        />
      )}

      {/* Edit dialog */}
      {editTarget && (
        <BountyPostDialog
          initial={{
            title: editTarget.title,
            type: editTarget.type,
            description: editTarget.description,
            reward: editTarget.reward,
            repoUrl: editTarget.repoUrl,
            tags: editTarget.tags,
          }}
          onClose={() => setEditTarget(null)}
          onSave={handleSaveEdit}
        />
      )}

      {/* Detail / apply dialog */}
      {detailTarget && (
        <BountyDetailDialog
          bounty={detailTarget}
          currentUserId={currentUserId}
          signedIn={!!userId}
          onClose={() => setDetailTarget(null)}
          onSignIn={() => router.push("/sign-in")}
          onDone={(msg) => {
            setDetailTarget(null);
            flash(msg);
          }}
        />
      )}
    </div>
  );
}
