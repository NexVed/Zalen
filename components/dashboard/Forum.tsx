"use client";
import { useState } from "react";
import { useMutation } from "convex/react";
import { ArrowUp, ArrowDown, MessageCircle, Pencil, Trash2, ImageIcon, Link as LinkIcon } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import styles from "./Hub.module.css";

export type ForumPost = {
  _id: Id<"forumPosts">;
  _creationTime: number;
  authorId: Id<"users">;
  authorName: string;
  category: string;
  title: string;
  body: string;
  score: number;
  commentCount: number;
  editedAt?: number;
  myVote: 0 | 1 | -1;
  imageStorageIds?: Id<"_storage">[];
  linkUrl?: string;
  linkTitle?: string;
};

export function Forum({
  posts,
  currentUserId,
  signedIn,
  onOpen,
  onSignIn,
}: {
  posts: ForumPost[];
  currentUserId: Id<"users"> | null;
  signedIn: boolean;
  onOpen: (post: ForumPost) => void;
  onSignIn: () => void;
}) {
  return (
    <div className={styles.forumLayout}>
      <div className={styles.rows}>
        {posts.map((post) => (
          <PostCard
            key={post._id}
            post={post}
            currentUserId={currentUserId}
            signedIn={signedIn}
            onOpen={onOpen}
            onSignIn={onSignIn}
          />
        ))}
        {posts.length === 0 && (
          <p className={styles.forumEmpty}>No discussions yet. Start the first one!</p>
        )}
      </div>

      <aside className={styles.guidelines} aria-label="Community guidelines">
        <h3>Forum guidelines</h3>
        <p>Include enough context for others to answer.</p>
        <p>Share build logs and give specific feedback.</p>
        <p>Be kind. Respect people&apos;s time, work, and privacy.</p>
        <p>Looking to hire or sell a service? Try B2B or Gigs.</p>
      </aside>
    </div>
  );
}

function PostCard({
  post,
  currentUserId,
  signedIn,
  onOpen,
  onSignIn,
}: {
  post: ForumPost;
  currentUserId: Id<"users"> | null;
  signedIn: boolean;
  onOpen: (post: ForumPost) => void;
  onSignIn: () => void;
}) {
  const castVote = useMutation(api.forum.vote);
  const removePost = useMutation(api.forum.deletePost);
  const [voting, setVoting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isAuthor = !!currentUserId && post.authorId === currentUserId;

  async function handleVote(direction: 1 | -1, e: React.MouseEvent) {
    e.stopPropagation();
    if (!signedIn) { onSignIn(); return; }
    if (voting) return;
    setVoting(true);
    try { await castVote({ postId: post._id, direction }); }
    finally { setVoting(false); }
  }

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Delete this post and all its comments?")) return;
    setDeleting(true);
    try { await removePost({ postId: post._id }); }
    catch { setDeleting(false); }
  }

  const timeAgo = formatTimeAgo(post._creationTime);

  return (
    <article className={styles.thread} aria-label={post.title}>
      {/* Vote column */}
      <div className={styles.voteCol} onClick={(e) => e.stopPropagation()}>
        <button
          className={`${styles.voteBtn} ${post.myVote === 1 ? styles.voteUp : ""}`}
          aria-label="Upvote"
          aria-pressed={post.myVote === 1}
          disabled={voting}
          onClick={(e) => handleVote(1, e)}
        >
          <ArrowUp size={16} />
        </button>
        <span
          className={`${styles.voteScore} ${
            post.score > 0 ? styles.scorePositive : post.score < 0 ? styles.scoreNegative : ""
          }`}
        >
          {post.score}
        </span>
        <button
          className={`${styles.voteBtn} ${post.myVote === -1 ? styles.voteDn : ""}`}
          aria-label="Downvote"
          aria-pressed={post.myVote === -1}
          disabled={voting}
          onClick={(e) => handleVote(-1, e)}
        >
          <ArrowDown size={16} />
        </button>
      </div>

      {/* Post body — click opens thread */}
      <div
        className={styles.threadBody}
        role="button"
        tabIndex={0}
        onClick={() => onOpen(post)}
        onKeyDown={(e) => e.key === "Enter" && onOpen(post)}
        style={{ cursor: "pointer" }}
      >
        <div className={styles.tags}>
          <span className={styles.tag}>{post.category}</span>
        </div>
        <h3>{post.title}</h3>
        <p>{post.body.slice(0, 200)}{post.body.length > 200 ? "…" : ""}</p>
        <div className={styles.threadMeta}>
          <span>{post.authorName}</span>
          <span>{timeAgo}</span>
          {post.editedAt && <span>edited</span>}
          <span className={styles.commentCount}>
            <MessageCircle size={12} />
            {post.commentCount} {post.commentCount === 1 ? "comment" : "comments"}
          </span>
          {!!post.imageStorageIds?.length && (
            <span className={styles.attachBadge}>
              <ImageIcon size={12} />
              {post.imageStorageIds.length} {post.imageStorageIds.length === 1 ? "image" : "images"}
            </span>
          )}
          {post.linkUrl && (
            <span className={styles.attachBadge}>
              <LinkIcon size={12} />
              {post.linkTitle || safeHostname(post.linkUrl)}
            </span>
          )}
          {isAuthor && (
            <span className={styles.postActions} onClick={(e) => e.stopPropagation()}>
              <button
                className={styles.actionBtn}
                aria-label="Edit post"
                onClick={(e) => { e.stopPropagation(); onOpen({ ...post, _editMode: true } as ForumPost & { _editMode?: boolean }); }}
              >
                <Pencil size={12} />Edit
              </button>
              <button
                className={`${styles.actionBtn} ${styles.actionDelete}`}
                aria-label="Delete post"
                disabled={deleting}
                onClick={handleDelete}
              >
                <Trash2 size={12} />Delete
              </button>
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

function formatTimeAgo(ms: number): string {
  const secs = Math.floor((Date.now() - ms) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

function safeHostname(url: string): string {
  try { return new URL(url).hostname; } catch { return url; }
}
