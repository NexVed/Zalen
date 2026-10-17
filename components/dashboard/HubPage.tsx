"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import * as stylex from "@stylexjs/stylex";
import { ArrowUpRight, Search, Info, FileText, Plus } from "lucide-react";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { directory, type DirectoryEntry, type DirectoryKind } from "@/lib/hub-data";
import type { HubView } from "@/lib/navigation";
import { useHubState } from "@/lib/use-hub-state";
import { Directory } from "./Directory";
import { Forum, type ForumPost } from "./Forum";
import { HubDialog, type HubModal } from "./HubDialog";
import { ForumPostDialog } from "./ForumPostDialog";
import { ui } from "./ui";
import styles from "./Hub.module.css";

const content = {
  Forum: {
    title: "Public discussions",
    body: "Ask a question, request feedback, or share a build log.",
    action: "Start a discussion",
    kind: "freelancer" as DirectoryKind,
    filters: ["All", "Questions", "Feedback", "Build logs", "Resources"],
  },
  Investors: {
    title: "Investor directory",
    body: "Filter profiles by stage and sector. Review each thesis and prepare a pitch draft.",
    action: "Explore investment theses",
    kind: "investor" as DirectoryKind,
    filters: ["All", "Pre-seed", "Angel", "Seed", "My drafts"],
  },
  B2B: {
    title: "Business partnerships",
    body: "Browse service offers and partnership requests. List your business or draft an introduction.",
    action: "List a partnership",
    kind: "business" as DirectoryKind,
    filters: ["All", "Offering", "Seeking", "My drafts"],
  },
};

export function HubPage({
  view,
  userId,
  name,
  search,
  onSearch,
}: {
  view: Exclude<HubView, "Freelancers">;
  userId: string | null;
  name: string;
  search: string;
  onSearch: (value: string) => void;
}) {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  const [state, update] = useHubState(userId);
  const [filter, setFilter] = useState("All");
  const [modal, setModal] = useState<HubModal>(null);
  const [showNewPost, setShowNewPost] = useState(false);
  const [message, setMessage] = useState("");
  const copy = content[view];

  // Resolve the current user's Convex ID for author checks
  const convexUser = useQuery(api.users.current, isAuthenticated ? {} : "skip");
  const currentUserId = (convexUser?._id ?? null) as Id<"users"> | null;

  // Forum-specific Convex queries
  const forumCategory =
    view === "Forum" && filter !== "All" ? filter : undefined;
  const forumPosts = useQuery(
    api.forum.listPosts,
    view === "Forum" ? { category: forumCategory } : "skip",
  );

  // Mutation for creating a forum post (used by DiscussionForm replacement below)
  const createPost = useMutation(api.forum.createPost);

  const query = search.trim().toLowerCase();

  function requireAccount(action: () => void) {
    if (!userId) router.push("/sign-up");
    else action();
  }

  function draft(entry: DirectoryEntry) {
    requireAccount(() =>
      setModal({
        kind: "draft",
        entry,
        type: entry.kind === "investor" ? "pitch" : "partnership",
      }),
    );
  }

  const entries = [...state.listings, ...directory].filter(
    (entry) =>
      entry.kind === copy.kind &&
      (filter === "All" || entry.tags.includes(filter)) &&
      `${entry.name} ${entry.title} ${entry.description} ${entry.tags.join(" ")} ${entry.location}`
        .toLowerCase()
        .includes(query),
  );

  const drafts = state.drafts.filter(
    (d) =>
      (view === "Investors" ? d.kind === "pitch" : d.kind === "partnership") &&
      `${d.title} ${d.body} ${d.recipient}`.toLowerCase().includes(query),
  );

  // Filter forum posts client-side for search
  const filteredPosts: ForumPost[] =
    view === "Forum"
      ? ((forumPosts ?? []) as ForumPost[]).filter(
          (post) =>
            !query ||
            `${post.title} ${post.body} ${post.category} ${post.authorName}`
              .toLowerCase()
              .includes(query),
        )
      : [];

  const count =
    filter === "My drafts"
      ? drafts.length
      : view === "Forum"
        ? filteredPosts.length
        : entries.length;

  const forumLoading = view === "Forum" && forumPosts === undefined;

  return (
    <div className={styles.page}>
      <section className={styles.hero} aria-label={`${view} introduction`}>
        <div>
          <h2>{copy.title}</h2>
          <p>{copy.body}</p>
          <button
            {...stylex.props(ui.primary)}
            onClick={() => {
              if (view === "Investors") {
                document.getElementById("hub-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
              } else if (view === "Forum") {
                requireAccount(() => setShowNewPost(true));
              } else {
                requireAccount(() => setModal({ kind: "create", type: copy.kind }));
              }
            }}
          >
            {copy.action}
            <ArrowUpRight size={15} />
          </button>
        </div>
      </section>

      {message && (
        <p className={styles.note} role="status">
          <Info size={16} />
          {message}
          <button aria-label="Dismiss message" className={styles.cardButton} onClick={() => setMessage("")}>
            Dismiss
          </button>
        </p>
      )}

      <div className={styles.toolbar}>
        <div className={styles.tabs} role="group" aria-label={`${view} filters`}>
          {copy.filters.map((label) => (
            <button
              className={`${styles.tab} ${filter === label ? styles.active : ""}`}
              key={label}
              aria-pressed={filter === label}
              onClick={() => setFilter(label)}
            >
              {label}
            </button>
          ))}
        </div>
        <label className={styles.search}>
          <Search size={15} />
          <input
            type="search"
            aria-label={`Search ${view.toLowerCase()}`}
            placeholder={view === "Forum" ? "Find a conversation..." : "Search by name, skill, or focus..."}
            value={search}
            onChange={(e) => onSearch(e.target.value)}
          />
        </label>
      </div>

      <div className={styles.meta}>
        <span>
          {forumLoading
            ? "Loading discussions…"
            : `${count} ${filter === "My drafts" ? "saved drafts" : view === "Forum" ? "discussions" : "profiles"}${view === "Forum" ? " · Powered by Convex" : filter === "My drafts" ? " · Only visible in your local workspace" : " · Illustrative directory + your local listings"}`}
        </span>
        {view === "Forum" && userId && (
          <button
            className={styles.cardButton}
            onClick={() => setShowNewPost(true)}
          >
            <Plus size={13} />New post
          </button>
        )}
      </div>

      <section id="hub-results" aria-label={`${view} results`}>
        {forumLoading ? (
          <div className={styles.empty}>
            <p>Loading discussions…</p>
          </div>
        ) : !count && !forumLoading ? (
          <div className={styles.empty}>
            <Search size={28} />
            <h3 className={styles.name}>
              {filter === "My drafts" ? "No saved drafts" : "No results just yet."}
            </h3>
            <p>
              {filter === "My drafts"
                ? "Open a profile and prepare a pitch or project introduction. Your saved draft will appear here."
                : view === "Forum"
                  ? "Be the first to start a discussion!"
                  : "Try another topic, skill, or location."}
            </p>
            <button
              {...stylex.props(ui.secondary)}
              onClick={() => { setFilter("All"); onSearch(""); }}
            >
              Explore all <ArrowUpRight size={14} />
            </button>
          </div>
        ) : filter === "My drafts" ? (
          <div className={styles.rows}>
            {drafts.map((d) => (
              <article className={styles.card} key={d.id}>
                <span className={styles.tag}>
                  <FileText size={12} />
                  {d.kind === "pitch" ? "Pitch draft" : "Introduction draft"}
                </span>
                <h3 className={styles.name}>{d.title}</h3>
                <span className={styles.location}>For {d.recipient}</span>
                <p className={styles.bodyText}>{d.body}</p>
                <span className={styles.tag}>Saved locally · Not sent</span>
              </article>
            ))}
          </div>
        ) : view === "Forum" ? (
          <Forum
            posts={filteredPosts}
            currentUserId={currentUserId}
            signedIn={!!userId}
            onOpen={(post) => setModal({ kind: "thread", post })}
            onSignIn={() => router.push("/sign-in")}
          />
        ) : (
          <Directory entries={entries} onOpen={(entry) => setModal({ kind: "entry", entry })} onPitch={draft} />
        )}
      </section>

      {view === "Investors" && (
        <p className={styles.note}>
          <Info size={16} />
          These are illustrative investment profiles, not verified firms or funding offers. Use them to explore the directory and prepare a pitch; no introduction is sent.
        </p>
      )}

      {/* Forum post creation dialog */}
      {showNewPost && (
        <ForumPostDialog
          onClose={() => setShowNewPost(false)}
          onSave={async ({ title, category, body, imageStorageIds, linkUrl, linkTitle }) => {
            await createPost({
              title,
              body,
              category,
              imageStorageIds: imageStorageIds.length ? imageStorageIds : undefined,
              linkUrl: linkUrl || undefined,
              linkTitle: linkTitle || undefined,
            });
            setShowNewPost(false);
            setMessage("Your discussion was posted.");
          }}
        />
      )}

      <HubDialog
        modal={modal}
        onClose={() => setModal(null)}
        state={state}
        update={update}
        name={name}
        userId={userId}
        currentUserId={currentUserId}
        signedIn={!!userId}
        onSignIn={() => router.push("/sign-in")}
        onDraft={draft}
        onDone={(value) => { setModal(null); setMessage(value); }}
      />
    </div>
  );
}
