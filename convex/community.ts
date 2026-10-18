import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";

const mediaValidator = v.object({
  storageId: v.id("_storage"),
  kind: v.union(v.literal("image"), v.literal("video")),
});

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

async function currentUserId(ctx: QueryCtx | MutationCtx): Promise<Id<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
    .unique();
  return user?._id ?? null;
}

export const listPosts = query({
  args: {},
  handler: async (ctx) => {
    const userId = await currentUserId(ctx);
    const posts = await ctx.db.query("communityPosts").order("desc").take(40);
    return await Promise.all(posts.map(async (post) => {
      const author = await ctx.db.get(post.authorId);
      const media = await Promise.all(post.media.map(async (item) => ({
        ...item,
        url: await ctx.storage.getUrl(item.storageId),
      })));
      const liked = userId
        ? Boolean(await ctx.db.query("communityLikes").withIndex("by_user_post", (q) => q.eq("userId", userId).eq("postId", post._id)).unique())
        : false;
      return {
        _id: post._id,
        _creationTime: post._creationTime,
        body: post.body,
        authorName: post.authorName,
        authorImage: author?.imageUrl ?? null,
        likeCount: post.likeCount,
        commentCount: post.commentCount,
        mine: userId === post.authorId,
        liked,
        media,
      };
    }));
  },
});

export const listComments = query({
  args: { postId: v.id("communityPosts") },
  handler: async (ctx, args) => {
    const comments = await ctx.db.query("communityComments").withIndex("by_post", (q) => q.eq("postId", args.postId)).collect();
    comments.sort((a, b) => a._creationTime - b._creationTime);
    return comments.map((comment) => ({
      _id: comment._id,
      body: comment.body,
      authorName: comment.authorName,
      _creationTime: comment._creationTime,
    }));
  },
});

export const createPost = mutation({
  args: {
    body: v.string(),
    media: v.array(mediaValidator),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const body = args.body.trim();
    if (body.length < 1 || body.length > 4000) throw new ConvexError("Write between 1 and 4000 characters.");
    if (args.media.length > 4) throw new ConvexError("Attach up to 4 images or videos.");
    return await ctx.db.insert("communityPosts", {
      authorId: user._id,
      authorName: user.name || "Zalen member",
      body,
      media: args.media,
      likeCount: 0,
      commentCount: 0,
    });
  },
});

export const deletePost = mutation({
  args: { postId: v.id("communityPosts") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const post = await ctx.db.get(args.postId);
    if (!post) return null;
    if (post.authorId !== user._id) throw new ConvexError("You can only remove your own post.");
    const likes = await ctx.db.query("communityLikes").withIndex("by_post", (q) => q.eq("postId", args.postId)).collect();
    const comments = await ctx.db.query("communityComments").withIndex("by_post", (q) => q.eq("postId", args.postId)).collect();
    await Promise.all([...likes.map((like) => ctx.db.delete(like._id)), ...comments.map((comment) => ctx.db.delete(comment._id))]);
    await ctx.db.delete(post._id);
    return null;
  },
});

export const toggleLike = mutation({
  args: { postId: v.id("communityPosts") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const post = await ctx.db.get(args.postId);
    if (!post) throw new ConvexError("Post not found.");
    const existing = await ctx.db.query("communityLikes").withIndex("by_user_post", (q) => q.eq("userId", user._id).eq("postId", args.postId)).unique();
    if (existing) {
      await ctx.db.delete(existing._id);
      await ctx.db.patch(post._id, { likeCount: Math.max(0, post.likeCount - 1) });
      return false;
    }
    await ctx.db.insert("communityLikes", { postId: args.postId, userId: user._id });
    await ctx.db.patch(post._id, { likeCount: post.likeCount + 1 });
    return true;
  },
});

export const addComment = mutation({
  args: { postId: v.id("communityPosts"), body: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const post = await ctx.db.get(args.postId);
    if (!post) throw new ConvexError("Post not found.");
    const body = args.body.trim();
    if (body.length < 1 || body.length > 2000) throw new ConvexError("Write a comment between 1 and 2000 characters.");
    const id = await ctx.db.insert("communityComments", {
      postId: args.postId,
      authorId: user._id,
      authorName: user.name || "Zalen member",
      body,
    });
    await ctx.db.patch(post._id, { commentCount: post.commentCount + 1 });
    return id;
  },
});
