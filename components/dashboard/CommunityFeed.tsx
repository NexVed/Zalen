"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import * as stylex from "@stylexjs/stylex";
import { ImagePlus, Loader2, MessageCircle, Send, ThumbsUp, Trash2, Video, Search, X } from "lucide-react";
import { useMutation } from "convex/react";
import { useLiveQuery } from "@/lib/use-live-query";
import { ServiceState } from "./ServiceState";
import hub from "./Hub.module.css";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { colors } from "@/styles/tokens.stylex";
import { ui } from "./ui";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/avif"];
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const MAX_MEDIA = 4;

type DraftMedia = {
  preview: string;
  kind: "image" | "video";
  storageId: Id<"_storage"> | null;
  uploading: boolean;
  error?: string;
};

function when(time: number) {
  const minutes = Math.max(1, Math.round((Date.now() - time) / 60000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  return days < 14 ? `${days}d` : new Date(time).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function CommunityFeed({ userId, name, search, onSearch }: { userId: string | null; name: string; search: string; onSearch: (value: string) => void }) {
  const router = useRouter();
  const createPost = useMutation(api.community.createPost);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const [body, setBody] = useState("");
  const [media, setMedia] = useState<DraftMedia[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const previews = useRef(new Set<string>());
  useEffect(() => { const urls = previews.current; return () => { urls.forEach(url => URL.revokeObjectURL(url)); urls.clear(); }; }, []);
  function releasePreview(url: string) { URL.revokeObjectURL(url); previews.current.delete(url); }
  const initials = (name || "You").split(" ").map((part) => part[0]).slice(0, 2).join("");

  async function upload(file: File) {
    const uploadUrl = await generateUploadUrl();
    const response = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": file.type }, body: file });
    if (!response.ok) throw new Error("Upload failed");
    const payload = await response.json() as { storageId: Id<"_storage"> };
    return payload.storageId;
  }

  async function addFiles(list: FileList | null) {
    if (!list) return;
    if (!userId) { router.push("/sign-up"); return; }
    const room = MAX_MEDIA - media.length;
    const accepted: File[] = [];
    const drafts: DraftMedia[] = [];
    let fileError = "";
    for (const file of Array.from(list)) {
      if (accepted.length >= room) break;
      const kind = IMAGE_TYPES.includes(file.type) ? "image" : VIDEO_TYPES.includes(file.type) ? "video" : null;
      if (!kind) { fileError = "Use a JPEG, PNG, GIF, WebP, AVIF, MP4, WebM, or MOV file."; continue; }
      if (kind === "image" && file.size > 8 * 1024 * 1024) { fileError = "Images need to be 8 MB or smaller."; continue; }
      if (kind === "video" && file.size > 40 * 1024 * 1024) { fileError = "Videos need to be 40 MB or smaller."; continue; }
      accepted.push(file);
      const preview = URL.createObjectURL(file); previews.current.add(preview);
      drafts.push({ preview, kind, storageId: null, uploading: true });
    }
    setError(fileError);
    if (!drafts.length) return;
    setMedia((current) => [...current, ...drafts]);
    const ids = await Promise.allSettled(accepted.map(upload));
    setMedia((current) => current.map((item) => {
      const resultIndex = drafts.findIndex(draft => draft.preview === item.preview);
      if (resultIndex < 0 || resultIndex >= ids.length) return item;
      const result = ids[resultIndex];
      return result.status === "fulfilled"
        ? { ...item, storageId: result.value, uploading: false }
        : { ...item, uploading: false, error: "Upload failed" };
    }));
  }

  async function publish() {
    if (!userId) { router.push("/sign-up"); return; }
    const text = body.trim();
    if (!text) { setError("Write something about the work you want to share."); return; }
    if (media.some((item) => item.uploading)) return;
    if (media.some((item) => item.error)) { setError("Remove failed attachments before posting."); return; }
    const ready = media.filter((item) => item.storageId && !item.error).map((item) => ({ storageId: item.storageId!, kind: item.kind }));
    setSaving(true);
    setError("");
    try {
      await createPost({ body: text, media: ready });
      setBody("");
      media.forEach(item => releasePreview(item.preview));
      setMedia([]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not publish this post.");
    } finally {
      setSaving(false);
    }
  }

  return <div {...stylex.props(s.feed)}>
    <label className={hub.search}><Search size={16} /><input type="search" aria-label="Search community posts" placeholder="Search projects, posts, or people" value={search} onChange={event => onSearch(event.target.value)} /></label>
    <section {...stylex.props(ui.card, s.composer)} aria-label="Share your work">
      <div {...stylex.props(s.composerRow)}>
        <span {...stylex.props(ui.avatar)}>{initials}</span>
        <textarea aria-label="Share your work" value={body} onChange={(event) => setBody(event.target.value)} maxLength={4000} rows={3} placeholder="Share a project, a lesson, or a piece of work…" {...stylex.props(s.composerInput)} />
      </div>
      {media.length > 0 && <div {...stylex.props(s.previews)}>{media.map((item, index) => <div key={item.preview} {...stylex.props(s.preview)}>{item.kind === "video" ? <video src={item.preview} muted {...stylex.props(s.previewMedia)} /> : <Image src={item.preview} alt="Attachment preview" width={280} height={140} unoptimized {...stylex.props(s.previewMedia)} />}{item.uploading && <span {...stylex.props(s.previewState)}><Loader2 size={16} /> Uploading</span>}{item.error && <span {...stylex.props(s.previewState)}>{item.error}</span>}<button type="button" aria-label="Remove attachment" {...stylex.props(s.remove)} onClick={() => { releasePreview(item.preview); setMedia((current) => current.filter((_, itemIndex) => itemIndex !== index)); }}><X size={14} /></button></div>)}</div>}
      <div {...stylex.props(s.composerActions)}>
        <input ref={fileRef} type="file" accept={[...IMAGE_TYPES, ...VIDEO_TYPES].join(",")} multiple hidden onChange={(event) => { void addFiles(event.target.files); event.target.value = ""; }} />
        <button type="button" {...stylex.props(s.attach)} onClick={() => fileRef.current?.click()} disabled={saving || media.length >= MAX_MEDIA || media.some(item => item.uploading)}><ImagePlus size={16} /> Photo <Video size={16} /> Video</button>
        <button type="button" {...stylex.props(ui.primary, s.post)} onClick={() => void publish()} disabled={saving || media.some((item) => item.uploading)}>{saving ? <Loader2 size={15} /> : <Send size={15} />} Post</button>
      </div>
      {error && <p role="alert" {...stylex.props(s.error)}>{error}</p>}
      {!userId && <p {...stylex.props(ui.caption)}>Sign in to publish. Anyone can read the feed.</p>}
    </section>
    <FeedList search={search} signedIn={Boolean(userId)} onSignIn={() => router.push("/sign-in")} />
  </div>;
}

type CommunityPost = {
  _id: Id<"communityPosts">; _creationTime: number; body: string; authorName: string; authorImage: string | null;
  likeCount: number; commentCount: number; mine: boolean; liked: boolean;
  media: { storageId: Id<"_storage">; kind: "image" | "video"; url: string | null }[];
};

function FeedList({ search, signedIn, onSignIn }: { search: string; signedIn: boolean; onSignIn: () => void }) {
  const { data: posts, error: failed, retry } = useLiveQuery(api.community.listPosts, {});
  const query = search.trim().toLowerCase();
  const visible = (posts ?? []).filter((post) => !query || `${post.body} ${post.authorName}`.toLowerCase().includes(query));
  if (failed) return <ServiceState title="Community" onRetry={retry} />;
  if (posts === undefined) return <ServiceState title="Community" loading />;
  if (!visible.length) return <div {...stylex.props(ui.card, ui.empty)}><p>{query ? "No posts match your search. Try another name or keyword." : "No posts yet. Share a project to start the conversation."}</p></div>;
  return <>{visible.map((post) => <PostCard key={post._id} post={post} signedIn={signedIn} onSignIn={onSignIn} />)}</>;
}

function PostCard({ post, signedIn, onSignIn }: {
  post: CommunityPost;
  signedIn: boolean;
  onSignIn: () => void;
}) {
  const toggleLike = useMutation(api.community.toggleLike);
  const remove = useMutation(api.community.deletePost);
  const addComment = useMutation(api.community.addComment);
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [commentError, setCommentError] = useState("");
  const { data: comments, error: commentsFailed, retry: retryComments } = useLiveQuery(api.community.listComments, open ? { postId: post._id } : "skip");
  const [busy, setBusy] = useState(false);
  const [deleteArmed, setDeleteArmed] = useState(false);
  async function act(action: () => Promise<unknown>) {
    if (!signedIn) { onSignIn(); return; }
    setBusy(true); setCommentError("");
    try { await action(); } catch { setCommentError("Could not save this change. Please try again."); } finally { setBusy(false); }
  }

  async function sendComment() {
    if (!signedIn) { onSignIn(); return; }
    const text = comment.trim();
    if (!text) return;
    setBusy(true); setCommentError("");
    try {
      await addComment({ postId: post._id, body: text });
      setComment("");
      setOpen(true);
    } catch (reason) {
      setCommentError(reason instanceof Error ? reason.message : "Could not add that comment.");
    } finally { setBusy(false); }
  }

  return <article {...stylex.props(ui.card, s.postCard)}>
    <header {...stylex.props(s.postHead)}>
      {post.authorImage ? <Image src={post.authorImage} alt="" width={40} height={40} unoptimized {...stylex.props(s.photo)} /> : <span {...stylex.props(ui.avatar)}>{post.authorName.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span>}
      <div><strong {...stylex.props(s.author)}>{post.authorName}</strong><span {...stylex.props(ui.caption)}>{when(post._creationTime)}</span></div>
      {post.mine && <button type="button" aria-label={deleteArmed ? "Confirm delete post" : "Delete post"} disabled={busy} {...stylex.props(s.iconAction)} onClick={() => { if (!deleteArmed) setDeleteArmed(true); else void act(() => remove({ postId: post._id })); }}>{deleteArmed ? "Confirm delete" : <Trash2 size={15} />}</button>}
    </header>
    <p {...stylex.props(s.body)}>{post.body}</p>
    {post.media.length > 0 && <div {...stylex.props(s.media, post.media.length === 1 && s.mediaSingle)}>{post.media.map((item) => item.url && (item.kind === "video" ? <video key={item.storageId} src={item.url} controls preload="metadata" {...stylex.props(s.mediaItem)} /> : <Image key={item.storageId} src={item.url} alt="Work shared by the post author" width={680} height={460} unoptimized {...stylex.props(s.mediaItem)} />))}</div>}
    <div {...stylex.props(s.actions)}>
      <button type="button" aria-label={post.liked ? "Unlike post" : "Like post"} aria-pressed={post.liked} disabled={busy} {...stylex.props(s.action, post.liked && s.actionOn)} onClick={() => void act(() => toggleLike({ postId: post._id }))}><ThumbsUp size={15} /> {post.likeCount}</button>
      <button type="button" aria-label="View comments" aria-expanded={open} {...stylex.props(s.action)} onClick={() => setOpen((value) => !value)}><MessageCircle size={15} /> {post.commentCount}</button>
    </div>
    {open && <div {...stylex.props(s.comments)}>
      {commentsFailed ? <ServiceState title="Comments" onRetry={retryComments} /> : comments === undefined ? <p role="status">Loading comments…</p> : !comments.length ? <p {...stylex.props(ui.caption)}>No comments yet.</p> : null}
      {(comments ?? []).map((item) => <div key={item._id} {...stylex.props(s.comment)}><strong>{item.authorName}</strong><span {...stylex.props(ui.caption)}>{when(item._creationTime)}</span><p>{item.body}</p></div>)}
      <form {...stylex.props(s.commentForm)} onSubmit={(event) => { event.preventDefault(); void sendComment(); }}>
        <input aria-label="Your comment" value={comment} onChange={(event) => setComment(event.target.value)} maxLength={2000} placeholder="Add a comment…" {...stylex.props(ui.input)} />
        <button type="submit" disabled={busy || !comment.trim()} {...stylex.props(ui.secondary)}>{busy ? "Saving…" : "Reply"}</button>
      </form>
    </div>}
    {commentError && <p role="alert" {...stylex.props(s.error)}>{commentError}</p>}
  </article>;
}

const s = stylex.create({
  feed: { display: "flex", flexDirection: "column", gap: 16, width: "100%", maxWidth: 720, marginInline: "auto" },
  composer: { padding: 18, display: "flex", flexDirection: "column", gap: 14 },
  composerRow: { display: "flex", gap: 12, alignItems: "flex-start" },
  composerInput: { width: "100%", minHeight: 84, resize: "vertical", border: 0, backgroundColor: colors.secondary, color: colors.foreground, borderRadius: 14, padding: 14, fontSize: 14, lineHeight: 1.6 },
  previews: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 },
  preview: { position: "relative", borderRadius: 12, overflow: "hidden", backgroundColor: colors.elevated, minHeight: 120 },
  previewMedia: { width: "100%", height: 140, objectFit: "cover", display: "block" },
  previewState: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "var(--overlay)", color: colors.foreground, fontSize: 12 },
  remove: { position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: colors.card, color: colors.body },
  composerActions: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" },
  attach: { display: "inline-flex", alignItems: "center", gap: 8, backgroundColor: "transparent", color: colors.body, fontSize: 12, fontWeight: 600, padding: "8px 4px" },
  post: { minHeight: 38 },
  error: { color: colors.primary, fontSize: 12 },
  postCard: { padding: 18, display: "flex", flexDirection: "column", gap: 14 },
  postHead: { display: "flex", alignItems: "center", gap: 12 },
  photo: { width: 40, height: 40, borderRadius: "50%", objectFit: "cover" },
  author: { display: "block", fontSize: 14 },
  iconAction: { marginLeft: "auto", backgroundColor: "transparent", color: colors.muted, padding: 6 },
  body: { fontSize: 14, lineHeight: 1.7, color: colors.body, whiteSpace: "pre-wrap", overflowWrap: "anywhere" },
  media: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 },
  mediaSingle: { gridTemplateColumns: "1fr" },
  mediaItem: { width: "100%", maxHeight: 460, objectFit: "cover", borderRadius: 12, backgroundColor: colors.elevated },
  actions: { display: "flex", gap: 8, borderTop: "1px solid", borderColor: colors.subtleBorder, paddingTop: 10 },
  action: { display: "inline-flex", alignItems: "center", gap: 6, backgroundColor: "transparent", color: colors.muted, fontSize: 12, fontWeight: 600, padding: "8px 10px", borderRadius: 10 },
  actionOn: { color: colors.primary, backgroundColor: colors.softPink },
  comments: { display: "flex", flexDirection: "column", gap: 10 },
  comment: { display: "flex", flexDirection: "column", gap: 2, backgroundColor: colors.secondary, borderRadius: 12, padding: 12, fontSize: 13, color: colors.body },
  commentForm: { display: "flex", gap: 8, alignItems: "center" },
});
