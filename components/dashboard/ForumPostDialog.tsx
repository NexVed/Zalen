"use client";
/**
 * ForumPostDialog
 *
 * Modal form for creating or editing a forum post.
 * Supports:
 *  - Title, category, body
 *  - Up to 4 image attachments (uploaded directly to Convex storage)
 *  - An optional external link with an optional display title
 */
import { useRef, useState } from "react";
import * as stylex from "@stylexjs/stylex";
import { ArrowUpRight, ImagePlus, Link as LinkIcon, X, Loader2 } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { ui } from "./ui";
import styles from "./Hub.module.css";

const MAX_IMAGES = 4;
const ACCEPTED = "image/jpeg,image/png,image/gif,image/webp,image/avif";

export type PostFormValues = {
  title: string;
  category: string;
  body: string;
  imageStorageIds: Id<"_storage">[];
  linkUrl: string;
  linkTitle: string;
};

/** Shared image-upload hook — uploads one file and returns its storage ID. */
function useUploadImage() {
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);

  return async (file: File): Promise<Id<"_storage">> => {
    const uploadUrl = await generateUploadUrl();
    const res = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`);
    const { storageId } = await res.json() as { storageId: Id<"_storage"> };
    return storageId;
  };
}

type ImageEntry = { preview: string; storageId: Id<"_storage"> | null; uploading: boolean; error?: string };

export function ForumPostDialog({
  /** Provide initial values to pre-fill the form (edit mode) */
  initial,
  onClose,
  onSave,
}: {
  initial?: Partial<PostFormValues>;
  onClose: () => void;
  onSave: (values: PostFormValues) => Promise<void>;
}) {
  const uploadImage = useUploadImage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [category, setCategory] = useState(initial?.category ?? "Questions");
  const [body, setBody] = useState(initial?.body ?? "");
  const [linkUrl, setLinkUrl] = useState(initial?.linkUrl ?? "");
  const [linkTitle, setLinkTitle] = useState(initial?.linkTitle ?? "");
  const [showLink, setShowLink] = useState(!!(initial?.linkUrl));

  // Images: start with any already-saved IDs (edit mode) as empty-preview entries
  const [images, setImages] = useState<ImageEntry[]>(
    (initial?.imageStorageIds ?? []).map((id) => ({
      preview: "",           // previews not available for already-saved IDs
      storageId: id,
      uploading: false,
    })),
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const uploading = images.some((img) => img.uploading);
  const canAddMore = images.length < MAX_IMAGES;

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    const toAdd = Array.from(files).slice(0, MAX_IMAGES - images.length);
    if (!toAdd.length) return;

    // Create placeholder entries immediately so the user sees progress
    const placeholders: ImageEntry[] = toAdd.map((file) => ({
      preview: URL.createObjectURL(file),
      storageId: null,
      uploading: true,
    }));

    setImages((prev) => [...prev, ...placeholders]);

    // Upload each file and fill in the storage ID
    const results = await Promise.allSettled(toAdd.map((f) => uploadImage(f)));
    setImages((prev) => {
      const next = [...prev];
      let placeholderIdx = next.length - placeholders.length;
      results.forEach((result) => {
        if (result.status === "fulfilled") {
          next[placeholderIdx] = { ...next[placeholderIdx], storageId: result.value, uploading: false };
        } else {
          next[placeholderIdx] = { ...next[placeholderIdx], uploading: false, error: "Upload failed" };
        }
        placeholderIdx++;
      });
      return next;
    });
  }

  function removeImage(index: number) {
    setImages((prev) => {
      const next = [...prev];
      const entry = next[index];
      if (entry.preview) URL.revokeObjectURL(entry.preview);
      next.splice(index, 1);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    if (uploading) return;

    const failedUploads = images.filter((img) => img.storageId === null && !img.uploading);
    if (failedUploads.length) {
      setError("Some images failed to upload. Remove them and try again.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await onSave({
        title: title.trim(),
        category,
        body: body.trim(),
        imageStorageIds: images.map((img) => img.storageId!).filter(Boolean),
        linkUrl: showLink ? linkUrl.trim() : "",
        linkTitle: showLink ? linkTitle.trim() : "",
      });
    } catch {
      setError("Could not save. Please try again.");
      setSaving(false);
    }
  }

  return (
    /* Backdrop */
    <div
      className={styles.overlay}
      style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}
    >
      <div
        className={styles.dialog}
        style={{ maxWidth: 640 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.dialogHeading}>
          <h2 className={styles.dialogTitle}>
            {initial ? "Edit post" : "Start a discussion"}
          </h2>
          <button {...stylex.props(ui.iconButton)} aria-label="Close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {/* Title */}
          <label {...stylex.props(ui.label)}>
            Title
            <input
              required
              minLength={8}
              maxLength={140}
              placeholder="What would you like to discuss?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              {...stylex.props(ui.input)}
            />
          </label>

          {/* Category */}
          <label {...stylex.props(ui.label)}>
            Category
            <select value={category} onChange={(e) => setCategory(e.target.value)} {...stylex.props(ui.input)}>
              {["Questions", "Feedback", "Build logs", "Resources"].map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </label>

          {/* Body */}
          <label {...stylex.props(ui.label)}>
            Body
            <textarea
              required
              minLength={20}
              maxLength={4000}
              rows={5}
              placeholder="Share context, what you've tried, or where a fresh perspective would help."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              {...stylex.props(ui.input)}
            />
          </label>

          {/* Image attachments */}
          <div>
            <div className={styles.attachToolbar}>
              <span className={styles.attachLabel}>
                <ImagePlus size={14} />
                Images
                <span className={styles.attachCount}>({images.length}/{MAX_IMAGES})</span>
              </span>
              {canAddMore && (
                <button
                  type="button"
                  className={styles.attachBtn}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  Add image
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED}
                multiple
                style={{ display: "none" }}
                onChange={(e) => handleFiles(e.target.files)}
              />
            </div>

            {images.length > 0 && (
              <div className={styles.imageGrid}>
                {images.map((img, i) => (
                  <div key={i} className={styles.imageThumb}>
                    {img.preview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img.preview} alt={`Attachment ${i + 1}`} className={styles.thumbImg} />
                    ) : (
                      /* Already-saved image — no local preview URL available */
                      <div className={styles.thumbPlaceholder}>Image {i + 1}</div>
                    )}
                    {img.uploading && (
                      <div className={styles.thumbOverlay}>
                        <Loader2 size={18} className={styles.thumbSpinner} />
                      </div>
                    )}
                    {img.error && (
                      <div className={styles.thumbOverlay} style={{ color: "var(--error, #e53e3e)", fontSize: 10 }}>
                        Failed
                      </div>
                    )}
                    <button
                      type="button"
                      className={styles.thumbRemove}
                      aria-label={`Remove image ${i + 1}`}
                      onClick={() => removeImage(i)}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Link attachment */}
          <div>
            <div className={styles.attachToolbar}>
              <span className={styles.attachLabel}>
                <LinkIcon size={14} />
                Link
              </span>
              <button
                type="button"
                className={styles.attachBtn}
                onClick={() => { setShowLink((v) => !v); if (showLink) { setLinkUrl(""); setLinkTitle(""); } }}
              >
                {showLink ? "Remove link" : "Add link"}
              </button>
            </div>

            {showLink && (
              <div className={styles.linkFields}>
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  maxLength={500}
                  {...stylex.props(ui.input)}
                />
                <input
                  type="text"
                  placeholder="Link title (optional)"
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  maxLength={120}
                  {...stylex.props(ui.input)}
                />
              </div>
            )}
          </div>

          {error && <p className={styles.formError} role="alert">{error}</p>}

          <button
            type="submit"
            {...stylex.props(ui.primary)}
            disabled={saving || uploading}
          >
            {saving
              ? "Posting…"
              : uploading
                ? "Uploading images…"
                : initial
                  ? "Save changes"
                  : "Post discussion"}
            <ArrowUpRight size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}
