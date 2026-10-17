/**
 * convex/forum.ts
 *
 * Reddit-style public forum: posts, upvote/downvote, edit, delete, comments.
 *
 * Auth model:
 *  - Any authenticated user can create posts and comments.
 *  - Only the author may edit or delete their own posts / comments.
 *  - Votes are one-per-(user, post); re-casting the same direction removes it.
 */

import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";

// ---------------------------------------------------------------------------
// Shared auth helper
// ---------------------------------------------------------------------------

async function requireUser(ctx: QueryCtx | MutationCtx): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError("Not authenticated");

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
    .unique();

  if (!user) throw new ConvexError("User not synced — call users.store first");
  return user;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * List all posts, optionally filtered by category, sorted by score desc.
 * Also returns the calling user's vote on each post (or null if not signed in).
 */
export const listPosts = query({
  args: {
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    // Resolve the current user's Convex ID so we can attach their vote
    let currentUserId: Id<"users"> | null = null;
    if (identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
        .unique();
      currentUserId = user?._id ?? null;
    }

    // Fetch posts — if a category filter was requested, use the index
    const postsQuery = args.category
      ? ctx.db
          .query("forumPosts")
          .withIndex("by_category", (q) => q.eq("category", args.category!))
      : ctx.db.query("forumPosts");

    const posts = await postsQuery.collect();

    // Sort by score descending (hot), then by creation time desc (newest)
    posts.sort((a, b) => b.score - a.score || b._creationTime - a._creationTime);

    // If the user is signed in, fetch their votes for all these posts in parallel
    if (!currentUserId) {
      return posts.map((post) => ({ ...post, myVote: 0 as 0 | 1 | -1 }));
    }

    const myVotes = await Promise.all(
      posts.map((post) =>
        ctx.db
          .query("forumVotes")
          .withIndex("by_user_post", (q) =>
            q.eq("userId", currentUserId!).eq("postId", post._id),
          )
          .unique(),
      ),
    );

    return posts.map((post, i) => ({
      ...post,
      myVote: (myVotes[i]?.direction ?? 0) as 0 | 1 | -1,
    }));
  },
});

/**
 * Fetch a single post by ID, with the calling user's vote attached.
 */
export const getPost = query({
  args: { postId: v.id("forumPosts") },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) return null;

    const identity = await ctx.auth.getUserIdentity();
    let myVote: 0 | 1 | -1 = 0;

    if (identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
        .unique();
      if (user) {
        const vote = await ctx.db
          .query("forumVotes")
          .withIndex("by_user_post", (q) =>
            q.eq("userId", user._id).eq("postId", args.postId),
          )
          .unique();
        myVote = (vote?.direction ?? 0) as 0 | 1 | -1;
      }
    }

    return { ...post, myVote };
  },
});

/**
 * List comments for a post, sorted oldest-first.
 */
export const listComments = query({
  args: { postId: v.id("forumPosts") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("forumComments")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .order("asc")
      .collect();
  },
});

/**
 * Resolves the signed download URLs for all images attached to a post.
 * Returns an empty array if the post has no images.
 */
export const getPostImageUrls = query({
  args: { postId: v.id("forumPosts") },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post?.imageStorageIds?.length) return [];
    const urls = await Promise.all(
      post.imageStorageIds.map((id) => ctx.storage.getUrl(id)),
    );
    return urls.filter((u): u is string => u !== null);
  },
});

// ---------------------------------------------------------------------------
// Post mutations
// ---------------------------------------------------------------------------

/**
 * Create a new forum post.
 */
export const createPost = mutation({
  args: {
    title: v.string(),
    body: v.string(),
    category: v.string(),
    imageStorageIds: v.optional(v.array(v.id("_storage"))),
    linkUrl: v.optional(v.string()),
    linkTitle: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    if (!args.title.trim()) throw new ConvexError("Title is required");
    if (!args.body.trim()) throw new ConvexError("Body is required");

    return ctx.db.insert("forumPosts", {
      authorId: user._id,
      authorName: user.name ?? user.email ?? "Zalen member",
      category: args.category,
      title: args.title.trim(),
      body: args.body.trim(),
      score: 0,
      commentCount: 0,
      imageStorageIds: args.imageStorageIds,
      linkUrl: args.linkUrl?.trim() || undefined,
      linkTitle: args.linkTitle?.trim() || undefined,
    });
  },
});

/**
 * Edit the title and/or body of a post. Author-only.
 * Images and link can also be updated; pass the full new lists.
 */
export const editPost = mutation({
  args: {
    postId: v.id("forumPosts"),
    title: v.string(),
    body: v.string(),
    imageStorageIds: v.optional(v.array(v.id("_storage"))),
    linkUrl: v.optional(v.string()),
    linkTitle: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const post = await ctx.db.get(args.postId);
    if (!post) throw new ConvexError("Post not found");
    if (post.authorId !== user._id) throw new ConvexError("Not authorised to edit this post");

    await ctx.db.patch(args.postId, {
      title: args.title.trim(),
      body: args.body.trim(),
      imageStorageIds: args.imageStorageIds,
      linkUrl: args.linkUrl?.trim() || undefined,
      linkTitle: args.linkTitle?.trim() || undefined,
      editedAt: Date.now(),
    });
  },
});

/**
 * Delete a post and all its votes and comments. Author-only.
 */
export const deletePost = mutation({
  args: { postId: v.id("forumPosts") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const post = await ctx.db.get(args.postId);
    if (!post) throw new ConvexError("Post not found");
    if (post.authorId !== user._id) throw new ConvexError("Not authorised to delete this post");

    // Clean up votes
    const votes = await ctx.db
      .query("forumVotes")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();
    await Promise.all(votes.map((v) => ctx.db.delete(v._id)));

    // Clean up comments
    const comments = await ctx.db
      .query("forumComments")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();
    await Promise.all(comments.map((c) => ctx.db.delete(c._id)));

    await ctx.db.delete(args.postId);
  },
});

// ---------------------------------------------------------------------------
// Vote mutations
// ---------------------------------------------------------------------------

/**
 * Cast or toggle a vote on a post.
 *
 * Rules:
 *  - If the user hasn't voted → insert the vote, update post.score.
 *  - If the user casts the same direction again → remove the vote (toggle off).
 *  - If the user flips direction → update the existing vote, adjust score by 2.
 */
export const vote = mutation({
  args: {
    postId: v.id("forumPosts"),
    direction: v.union(v.literal(1), v.literal(-1)),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const post = await ctx.db.get(args.postId);
    if (!post) throw new ConvexError("Post not found");

    const existing = await ctx.db
      .query("forumVotes")
      .withIndex("by_user_post", (q) =>
        q.eq("userId", user._id).eq("postId", args.postId),
      )
      .unique();

    if (!existing) {
      // No vote yet — create it
      await ctx.db.insert("forumVotes", {
        postId: args.postId,
        userId: user._id,
        direction: args.direction,
      });
      await ctx.db.patch(args.postId, { score: post.score + args.direction });
    } else if (existing.direction === args.direction) {
      // Same direction — remove vote (toggle off)
      await ctx.db.delete(existing._id);
      await ctx.db.patch(args.postId, { score: post.score - args.direction });
    } else {
      // Flip direction: -1 → 1 is +2, 1 → -1 is -2
      await ctx.db.patch(existing._id, { direction: args.direction });
      await ctx.db.patch(args.postId, { score: post.score + args.direction * 2 });
    }
  },
});

// ---------------------------------------------------------------------------
// Comment mutations
// ---------------------------------------------------------------------------

/**
 * Add a comment to a post.
 */
export const addComment = mutation({
  args: {
    postId: v.id("forumPosts"),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const post = await ctx.db.get(args.postId);
    if (!post) throw new ConvexError("Post not found");

    if (!args.body.trim()) throw new ConvexError("Comment body is required");

    const id = await ctx.db.insert("forumComments", {
      postId: args.postId,
      authorId: user._id,
      authorName: user.name ?? user.email ?? "Zalen member",
      body: args.body.trim(),
    });

    // Increment denormalised comment count
    await ctx.db.patch(args.postId, { commentCount: post.commentCount + 1 });

    return id;
  },
});

/**
 * Edit the body of a comment. Author-only.
 */
export const editComment = mutation({
  args: {
    commentId: v.id("forumComments"),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new ConvexError("Comment not found");
    if (comment.authorId !== user._id) throw new ConvexError("Not authorised to edit this comment");

    await ctx.db.patch(args.commentId, {
      body: args.body.trim(),
      editedAt: Date.now(),
    });
  },
});

/**
 * Delete a comment. Author-only. Also decrements the post's commentCount.
 */
export const deleteComment = mutation({
  args: { commentId: v.id("forumComments") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new ConvexError("Comment not found");
    if (comment.authorId !== user._id) throw new ConvexError("Not authorised to delete this comment");

    await ctx.db.delete(args.commentId);

    // Decrement denormalised comment count (guard against going below 0)
    const post = await ctx.db.get(comment.postId);
    if (post) {
      await ctx.db.patch(post._id, {
        commentCount: Math.max(0, post.commentCount - 1),
      });
    }
  },
});
