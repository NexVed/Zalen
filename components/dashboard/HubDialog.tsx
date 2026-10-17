"use client";
import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as stylex from "@stylexjs/stylex";
import { ArrowUp, ArrowDown, ArrowUpRight, Pencil, Trash2, X, Check, ExternalLink } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { DirectoryEntry, DirectoryKind, Draft, HubState } from "@/lib/hub-data";
import { DiscussionForm, IntroductionForm, ListingForm } from "./HubEntryForms";
import { ForumPostDialog } from "./ForumPostDialog";
import { ui } from "./ui";
import styles from "./Hub.module.css";
import type { ForumPost } from "./Forum";

export type HubModal =
  | { kind: "create"; type: DirectoryKind | "thread" }
  | { kind: "entry"; entry: DirectoryEntry }
  | { kind: "thread"; post: ForumPost }
  | { kind: "draft"; entry: DirectoryEntry; type: Draft["kind"] }
  | null;

export function HubDialog({
  modal,
  onClose,
  state,
  update,
  name,
  userId,
  currentUserId,
  signedIn,
  onSignIn,
  onDraft,
  onDone,
}: {
  modal: HubModal;
  onClose: () => void;
  state: HubState;
  update: (fn: (value: HubState) => HubState) => void;
  name: string;
  userId: string | null;
  currentUserId: Id<"users"> | null;
  signedIn: boolean;
  onSignIn: () => void;
  onDraft: (entry: DirectoryEntry) => void;
  onDone: (message: string) => void;
}) {
  const title =
    !modal
      ? ""
      : modal.kind === "thread"
        ? modal.post.title
        : modal.kind === "entry"
          ? modal.entry.name
          : modal.kind === "draft"
            ? modal.type === "pitch"
              ? "Draft a pitch"
              : "Draft an introduction"
            : modal.type === "thread"
              ? "Create a discussion"
              : modal.type === "business"
                ? "Add a business listing"
                : "Add a freelancer profile";

  return (
    <Dialog.Root open={!!modal} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={styles.dialog}>
          <div className={styles.dialogHeading}>
            <Dialog.Title className={styles.dialogTitle}>{title}</Dialog.Title>
            <Dialog.Close {...stylex.props(ui.iconButton)} aria-label="Close dialog">
              <X size={18} />
            </Dialog.Close>
          </div>
          <Dialog.Description className={styles.dialogDescription}>
            {modal?.kind === "entry"
              ? "Review the profile details."
              : modal?.kind === "thread"
                ? "Read the discussion and add a comment."
                : "Enter the details below."}
          </Dialog.Description>

          {modal?.kind === "create" &&
            (modal.type === "thread" ? (
              <DiscussionForm
                author={name || "Zalen member"}
                onSave={(thread) => {
                  update((s) => ({ ...s, threads: [thread, ...s.threads] }));
                  onDone("Discussion saved on this device.");
                }}
              />
            ) : (
              <ListingForm
                kind={modal.type}
                name={name}
                onSave={(entry) => {
                  update((s) => ({ ...s, listings: [entry, ...s.listings] }));
                  onDone("Your listing is saved in this account's local workspace.");
                }}
              />
            ))}

          {modal?.kind === "draft" && (
            <IntroductionForm
              entry={modal.entry}
              kind={modal.type}
              onSave={(draft) => {
                update((s) => ({ ...s, drafts: [draft, ...s.drafts] }));
                onDone("Draft saved on this device. No message has been sent.");
              }}
            />
          )}

          {modal?.kind === "entry" && (
            <div className={styles.detail}>
              <span className={styles.tag}>
                {state.listings.some((e) => e.id === modal.entry.id)
                  ? "Your local listing"
                  : "Illustrative profile"}
              </span>
              <h3 className={styles.name}>{modal.entry.title}</h3>
              <p className={styles.bodyText}>{modal.entry.description}</p>
              <div className={styles.tags}>
                {modal.entry.tags.map((tag) => (
                  <span className={styles.tag} key={tag}>{tag}</span>
                ))}
              </div>
              <span className={styles.location}>{modal.entry.location} · {modal.entry.detail}</span>
              <button {...stylex.props(ui.primary)} onClick={() => onDraft(modal.entry)}>
                {modal.entry.kind === "investor" ? "Draft a pitch" : "Draft an introduction"}
                <ArrowUpRight size={15} />
              </button>
            </div>
          )}

          {modal?.kind === "thread" && (
            <ThreadView
              post={modal.post}
              currentUserId={currentUserId}
              name={name}
              signedIn={signedIn}
              onSignIn={onSignIn}
              onClose={onClose}
            />
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ---------------------------------------------------------------------------
// ThreadView — full post detail with votes, images, link, comments, edit, delete
// ---------------------------------------------------------------------------

function ThreadView({
  post: initialPost,
  currentUserId,
  name,
  signedIn,
  onSignIn,
  onClose,
}: {
  post: ForumPost;
  currentUserId: Id<"users"> | null;
  name: string;
  signedIn: boolean;
  onSignIn: () => void;
  onClose: () => void;
}) {
  // Re-subscribe to live post data inside the dialog
  const livePost = useQuery(api.forum.getPost, { postId: initialPost._id });
  const comments = useQuery(api.forum.listComments, { postId: initialPost._id });
  // Resolve signed image URLs
  const imageUrls = useQuery(api.forum.getPostImageUrls, { postId: initialPost._id });

  const castVote = useMutation(api.forum.vote);
  const doEditPost = useMutation(api.forum.editPost);
  const doDeletePost = useMutation(api.forum.deletePost);
  const doAddComment = useMutation(api.forum.addComment);
  const doEditComment = useMutation(api.forum.editComment);
  const doDeleteComment = useMutation(api.forum.deleteComment);

  // Use live data once it arrives, fallback to initial snapshot
  const post = livePost ?? initialPost;
  const isAuthor = !!currentUserId && post.authorId === currentUserId;

  const [voting, setVoting] = useState(false);
  const [editingPost, setEditingPost] = useState(false);
  const [deletingPost, setDeletingPost] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<Id<"forumComments"> | null>(null);
  const [editCommentBody, setEditCommentBody] = useState("");

  const timeAgo = formatTimeAgo(post._creationTime);

  async function handleVote(direction: 1 | -1) {
    if (!signedIn) { onSignIn(); return; }
    if (voting) return;
    setVoting(true);
    try { await castVote({ postId: post._id, direction }); }
    finally { setVoting(false); }
  }

  async function handleDeletePost() {
    if (!confirm("Delete this post and all its comments?")) return;
    setDeletingPost(true);
    try { await doDeletePost({ postId: post._id }); onClose(); }
    catch { setDeletingPost(false); }
  }

  async function handleAddComment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const body = String(new FormData(e.currentTarget).get("comment") ?? "").trim();
    if (!body) return;
    await doAddComment({ postId: post._id, body });
    (e.currentTarget as HTMLFormElement).reset();
  }

  async function handleSaveComment(commentId: Id<"forumComments">) {
    if (!editCommentBody.trim()) return;
    await doEditComment({ commentId, body: editCommentBody });
    setEditingCommentId(null);
  }

  async function handleDeleteComment(commentId: Id<"forumComments">) {
    if (!confirm("Delete this comment?")) return;
    await doDeleteComment({ commentId });
  }

  // While the edit dialog is open, render it overlaid
  if (editingPost) {
    return (
      <ForumPostDialog
        initial={{
          title: post.title,
          category: post.category,
          body: post.body,
          imageStorageIds: post.imageStorageIds ?? [],
          linkUrl: post.linkUrl ?? "",
          linkTitle: post.linkTitle ?? "",
        }}
        onClose={() => setEditingPost(false)}
        onSave={async ({ title, category, body, imageStorageIds, linkUrl, linkTitle }) => {
          await doEditPost({
            postId: post._id,
            title,
            body,
            imageStorageIds: imageStorageIds.length ? imageStorageIds : undefined,
            linkUrl: linkUrl || undefined,
            linkTitle: linkTitle || undefined,
          });
          setEditingPost(false);
        }}
      />
    );
  }

  return (
    <div className={styles.detail}>
      {/* Post header tags */}
      <div className={styles.tags}>
        <span className={styles.tag}>{post.category}</span>
        {post.editedAt && <span className={styles.tag}>edited</span>}
      </div>

      {/* Body text */}
      <p className={styles.bodyText}>{post.body}</p>

      {/* Attached images */}
      {(imageUrls?.length ?? 0) > 0 && (
        <div className={styles.imageGrid}>
          {imageUrls!.map((url, i) => (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.imageThumb}
              aria-label={`View image ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Attachment ${i + 1}`} className={styles.thumbImg} />
            </a>
          ))}
        </div>
      )}

      {/* Attached link card */}
      {post.linkUrl && (
        <a
          href={post.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.linkCard}
        >
          <div className={styles.linkCardBody}>
            <span className={styles.linkCardTitle}>
              {post.linkTitle || safeHostname(post.linkUrl)}
            </span>
            <span className={styles.linkCardUrl}>{post.linkUrl}</span>
          </div>
          <ExternalLink size={15} className={styles.linkCardIcon} />
        </a>
      )}

      {/* Vote bar */}
      <div className={styles.voteBar}>
        <button
          className={`${styles.voteBtn} ${post.myVote === 1 ? styles.voteUp : ""}`}
          aria-label="Upvote"
          aria-pressed={post.myVote === 1}
          disabled={voting}
          onClick={() => handleVote(1)}
        >
          <ArrowUp size={15} />
        </button>
        <span className={`${styles.voteScore} ${
          post.score > 0 ? styles.scorePositive : post.score < 0 ? styles.scoreNegative : ""
        }`}>
          {post.score}
        </span>
        <button
          className={`${styles.voteBtn} ${post.myVote === -1 ? styles.voteDn : ""}`}
          aria-label="Downvote"
          aria-pressed={post.myVote === -1}
          disabled={voting}
          onClick={() => handleVote(-1)}
        >
          <ArrowDown size={15} />
        </button>
        <span className={styles.threadMetaInline}>
          {post.authorName} · {timeAgo}
        </span>

        {isAuthor && (
          <span className={styles.postActions}>
            <button className={styles.actionBtn} onClick={() => setEditingPost(true)}>
              <Pencil size={12} />Edit
            </button>
            <button
              className={`${styles.actionBtn} ${styles.actionDelete}`}
              disabled={deletingPost}
              onClick={handleDeletePost}
            >
              <Trash2 size={12} />Delete
            </button>
          </span>
        )}
      </div>

      {/* Comments */}
      <h3 className={styles.commentsHeading}>Comments ({post.commentCount})</h3>

      {comments === undefined && (
        <p className={styles.bodyText} style={{ opacity: 0.5 }}>Loading comments…</p>
      )}

      {comments?.map((comment) => {
        const isCommentAuthor = !!currentUserId && comment.authorId === currentUserId;
        const isEditing = editingCommentId === comment._id;
        return (
          <div key={comment._id} className={styles.reply}>
            <div className={styles.replyMeta}>
              <strong>{comment.authorName}</strong>
              <span>{formatTimeAgo(comment._creationTime)}</span>
              {comment.editedAt && <span className={styles.tag}>edited</span>}
              {isCommentAuthor && !isEditing && (
                <span className={styles.postActions}>
                  <button
                    className={styles.actionBtn}
                    onClick={() => { setEditingCommentId(comment._id); setEditCommentBody(comment.body); }}
                  >
                    <Pencil size={11} />Edit
                  </button>
                  <button
                    className={`${styles.actionBtn} ${styles.actionDelete}`}
                    onClick={() => handleDeleteComment(comment._id)}
                  >
                    <Trash2 size={11} />Delete
                  </button>
                </span>
              )}
            </div>

            {isEditing ? (
              <div className={styles.editForm}>
                <textarea
                  {...stylex.props(ui.input)}
                  rows={3}
                  value={editCommentBody}
                  onChange={(e) => setEditCommentBody(e.target.value)}
                  maxLength={2000}
                />
                <div className={styles.editActions}>
                  <button {...stylex.props(ui.primary)} onClick={() => handleSaveComment(comment._id)}>
                    <Check size={13} />Save
                  </button>
                  <button {...stylex.props(ui.secondary)} onClick={() => setEditingCommentId(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className={styles.bodyText}>{comment.body}</p>
            )}
          </div>
        );
      })}

      {/* Add comment form */}
      {signedIn ? (
        <form className={styles.replyForm} onSubmit={handleAddComment}>
          <label {...stylex.props(ui.label)}>
            Add a comment
            <textarea
              name="comment"
              required
              minLength={2}
              maxLength={2000}
              rows={3}
              {...stylex.props(ui.input)}
            />
          </label>
          <button {...stylex.props(ui.primary)} type="submit">
            Post comment <ArrowUpRight size={14} />
          </button>
        </form>
      ) : (
        <button {...stylex.props(ui.primary)} onClick={onSignIn}>
          Sign in to join the conversation <ArrowUpRight size={14} />
        </button>
      )}
    </div>
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
