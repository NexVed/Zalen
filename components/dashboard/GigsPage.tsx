"use client";
/**
 * GigsPage.tsx
 *
 * Full freelance gig board page.
 * Real-time list from Convex, category + status filters, search, post / edit /
 * detail dialogs — all wired to convex/gigs.ts.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import * as stylex from "@stylexjs/stylex";
import { Search, Plus, ArrowUpRight, Info } from "lucide-react";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Gigs, type Gig } from "./Gigs";
import { GigPostDialog, type GigFormValues } from "./GigPostDialog";
import { GigDetailDialog } from "./GigDetailDialog";
import { ui } from "./ui";
import { useLiveQuery } from "@/lib/use-live-query";
import { ServiceState } from "./ServiceState";
import styles from "./Hub.module.css";

// ---------------------------------------------------------------------------
// Filter config
// ---------------------------------------------------------------------------

const CATEGORY_FILTERS = [
  { label: "All", value: "" },
  { label: "Development", value: "development" },
  { label: "Design", value: "design" },
  { label: "Writing", value: "writing" },
  { label: "Marketing", value: "marketing" },
  { label: "Video", value: "video" },
  { label: "Data", value: "data" },
  { label: "Consulting", value: "consulting" },
  { label: "Other", value: "other" },
];

const STATUS_FILTERS = [
  { label: "Open", value: "open" },
  { label: "Hired", value: "hired" },
  { label: "Completed", value: "completed" },
  { label: "All statuses", value: "" },
];

// ---------------------------------------------------------------------------
// GigsPage
// ---------------------------------------------------------------------------

export function GigsPage({
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

  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("open");
  const [showPost, setShowPost] = useState(false);
  const [editTarget, setEditTarget] = useState<Gig | null>(null);
  const [detailTarget, setDetailTarget] = useState<Gig | null>(null);
  const [message, setMessage] = useState("");

  // Resolve Convex user
  const convexUser = useQuery(
    api.users.current,
    isAuthenticated ? {} : "skip",
  );
  const currentUserId = (convexUser?._id ?? null) as Id<"users"> | null;

  // Fetch gigs from Convex
  const { data: rawGigs, error: loadError, retry } = useLiveQuery(api.gigs.listGigs, {
    category: categoryFilter || undefined,
    status: statusFilter || undefined,
  });

  // Mutations
  const createGig = useMutation(api.gigs.createGig);
  const editGig = useMutation(api.gigs.editGig);

  // Client-side search filter
  const query = search.trim().toLowerCase();
  const gigs: Gig[] = (rawGigs ?? []).filter(
    (g) =>
      !query ||
      `${g.title} ${g.description} ${g.authorName} ${(g.skills ?? []).join(" ")} ${g.category}`
        .toLowerCase()
        .includes(query),
  );

  const loading = rawGigs === undefined;

  function requireAccount(action: () => void) {
    if (!userId) router.push("/sign-up");
    else action();
  }

  function flash(msg: string) {
    setMessage(msg);
    setTimeout(() => setMessage(""), 5000);
  }

  async function handleSavePost(values: GigFormValues) {
    await createGig({
      title: values.title,
      category: values.category,
      budgetType: values.budgetType || undefined,
      budget: values.budget || undefined,
      duration: values.duration || undefined,
      description: values.description,
      skills: values.skills.length ? values.skills : undefined,
      referenceUrl: values.referenceUrl || undefined,
    });
    setShowPost(false);
    flash("Your gig was posted.");
  }

  async function handleSaveEdit(values: GigFormValues) {
    if (!editTarget) return;
    await editGig({
      gigId: editTarget._id,
      title: values.title,
      category: values.category,
      budgetType: values.budgetType || undefined,
      budget: values.budget || undefined,
      duration: values.duration || undefined,
      description: values.description,
      skills: values.skills.length ? values.skills : undefined,
      referenceUrl: values.referenceUrl || undefined,
    });
    setEditTarget(null);
    flash("Gig updated.");
  }

  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero} aria-label="Gig board introduction">
        <div>
          <h2>Freelance gig board</h2>
          <p>
            Post paid projects and find talented freelancers. Browse open gigs
            and submit a proposal to get hired.
          </p>
        </div>
          <button
            {...stylex.props(ui.primary)}
            onClick={() => requireAccount(() => setShowPost(true))}
          >
            Post a gig
            <ArrowUpRight size={15} />
          </button>
      </section>

      {/* Toast */}
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

      {/* Category filter tabs */}
      <div className={styles.toolbar}>
        <div
          className={styles.tabs}
          role="group"
          aria-label="Gig category filter"
        >
          {CATEGORY_FILTERS.map((f) => (
            <button
              key={f.value}
              className={`${styles.tab} ${categoryFilter === f.value ? styles.active : ""}`}
              aria-pressed={categoryFilter === f.value}
              onClick={() => setCategoryFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <label className={styles.search}>
          <Search size={15} />
          <input
            type="search"
            aria-label="Search gigs"
            placeholder="Search by title, skill, or author…"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
          />
        </label>
      </div>

      {/* Status sub-filters */}
      <div
        className={styles.tabs}
        role="group"
        aria-label="Gig status filter"
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

      {(search || categoryFilter || statusFilter !== "open") && <button className={styles.cardButton} onClick={() => { onSearch(""); setCategoryFilter(""); setStatusFilter("open"); }}>Clear filters</button>}
      {/* Meta bar */}
      <div className={styles.meta}>
        <span>
          {loadError ? "Could not load results" : loading
            ? "Loading gigs…"
            : `${gigs.length} ${gigs.length === 1 ? "gig" : "gigs"}`}
        </span>
        {userId && (
          <button
            className={styles.cardButton}
            onClick={() => setShowPost(true)}
          >
            <Plus size={13} />
            New gig
          </button>
        )}
      </div>

      {/* Gig list */}
      <section id="gig-results" aria-label="Gig results">
        {loadError ? <ServiceState title="Gigs" onRetry={retry} /> : loading ? (
          <ServiceState title="Gigs" loading />
        ) : (
          <Gigs
            gigs={gigs}
            currentUserId={currentUserId}
            signedIn={!!userId}
            onOpen={(g) => setDetailTarget(g)}
            onEdit={(g) => setEditTarget(g)}
            onSignIn={() => router.push("/sign-in")}
          />
        )}
      </section>

      {/* Post dialog */}
      {showPost && (
        <GigPostDialog
          onClose={() => setShowPost(false)}
          onSave={handleSavePost}
        />
      )}

      {/* Edit dialog */}
      {editTarget && (
        <GigPostDialog
          initial={{
            title: editTarget.title,
            category: editTarget.category,
            budgetType: editTarget.budgetType,
            budget: editTarget.budget,
            duration: editTarget.duration,
            description: editTarget.description,
            skills: editTarget.skills,
            referenceUrl: editTarget.referenceUrl,
          }}
          onClose={() => setEditTarget(null)}
          onSave={handleSaveEdit}
        />
      )}

      {/* Detail / proposal dialog */}
      {detailTarget && (
        <GigDetailDialog
          gig={detailTarget}
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
