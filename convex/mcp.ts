import { ConvexError, v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";

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

async function userByClerk(ctx: QueryCtx | MutationCtx, clerkUserId: string) {
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", clerkUserId))
    .unique();
  if (!user) throw new ConvexError("Sign in to Zalen once so this account can publish.");
  return user;
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function randomToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const body = Array.from(bytes).map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `zalen_${body}`;
}

export const createKey = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const name = args.name.trim().slice(0, 60) || "Claude";
    const existing = await ctx.db.query("mcpKeys").withIndex("by_user", (q) => q.eq("userId", user._id)).take(6);
    if (existing.length >= 5) throw new ConvexError("Revoke an older key before creating another. You can keep 5.");
    const token = randomToken();
    const id = await ctx.db.insert("mcpKeys", {
      userId: user._id,
      clerkUserId: user.clerkUserId,
      name,
      tokenHash: await sha256(token),
      prefix: token.slice(0, 12),
    });
    return { id, name, prefix: token.slice(0, 12), token };
  },
});

export const listKeys = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
      .unique();
    if (!user) return [];
    const keys = await ctx.db.query("mcpKeys").withIndex("by_user", (q) => q.eq("userId", user._id)).take(10);
    return keys.map((key) => ({
      id: key._id,
      name: key.name,
      prefix: key.prefix,
      createdAt: key._creationTime,
      lastUsedAt: key.lastUsedAt ?? null,
    }));
  },
});

export const revokeKey = mutation({
  args: { keyId: v.id("mcpKeys") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const key = await ctx.db.get(args.keyId);
    if (!key || key.userId !== user._id) throw new ConvexError("Key not found.");
    await ctx.db.delete(key._id);
    return null;
  },
});

export const authenticateKey = internalMutation({
  args: { tokenHash: v.string() },
  handler: async (ctx, args) => {
    const key = await ctx.db
      .query("mcpKeys")
      .withIndex("by_token_hash", (q) => q.eq("tokenHash", args.tokenHash))
      .unique();
    if (!key) return null;
    await ctx.db.patch(key._id, { lastUsedAt: Date.now() });
    return { clerkUserId: key.clerkUserId, name: key.name, prefix: key.prefix };
  },
});

export const myWorkspace = internalQuery({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .unique();
    if (!user) return null;
    const [profile, skills, projects, achievements, posts] = await Promise.all([
      ctx.db.query("profiles").withIndex("by_user_id", (q) => q.eq("userId", user._id)).unique(),
      ctx.db.query("userSkills").withIndex("by_user_id", (q) => q.eq("userId", user._id)).take(100),
      ctx.db.query("portfolioProjects").withIndex("by_user_id", (q) => q.eq("userId", user._id)).take(50),
      ctx.db.query("achievements").withIndex("by_user_id", (q) => q.eq("userId", user._id)).take(50),
      ctx.db.query("communityPosts").withIndex("by_author", (q) => q.eq("authorId", user._id)).take(20),
    ]);
    return {
      id: user._id,
      name: user.name ?? null,
      email: user.email ?? null,
      imageUrl: user.imageUrl ?? null,
      profile,
      skills,
      projects,
      achievements,
      communityPosts: posts.map((post) => ({
        id: post._id,
        body: post.body,
        likeCount: post.likeCount,
        commentCount: post.commentCount,
        createdAt: post._creationTime,
      })),
    };
  },
});

export const createCommunityPost = internalMutation({
  args: { clerkUserId: v.string(), body: v.string() },
  handler: async (ctx, args) => {
    const user = await userByClerk(ctx, args.clerkUserId);
    const body = args.body.trim();
    if (body.length < 1 || body.length > 4000) throw new ConvexError("Write between 1 and 4000 characters.");
    return await ctx.db.insert("communityPosts", {
      authorId: user._id,
      authorName: user.name || "Zalen member",
      body,
      media: [],
      likeCount: 0,
      commentCount: 0,
    });
  },
});

export const addCommunityComment = internalMutation({
  args: { clerkUserId: v.string(), postId: v.id("communityPosts"), body: v.string() },
  handler: async (ctx, args) => {
    const user = await userByClerk(ctx, args.clerkUserId);
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

export const toggleCommunityLike = internalMutation({
  args: { clerkUserId: v.string(), postId: v.id("communityPosts") },
  handler: async (ctx, args) => {
    const user = await userByClerk(ctx, args.clerkUserId);
    const post = await ctx.db.get(args.postId);
    if (!post) throw new ConvexError("Post not found.");
    const existing = await ctx.db
      .query("communityLikes")
      .withIndex("by_user_post", (q) => q.eq("userId", user._id).eq("postId", args.postId))
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
      await ctx.db.patch(post._id, { likeCount: Math.max(0, post.likeCount - 1) });
      return { liked: false };
    }
    await ctx.db.insert("communityLikes", { postId: args.postId, userId: user._id });
    await ctx.db.patch(post._id, { likeCount: post.likeCount + 1 });
    return { liked: true };
  },
});

export const createForumPost = internalMutation({
  args: { clerkUserId: v.string(), title: v.string(), body: v.string(), category: v.string() },
  handler: async (ctx, args) => {
    const user = await userByClerk(ctx, args.clerkUserId);
    const title = args.title.trim();
    const body = args.body.trim();
    if (!title || !body) throw new ConvexError("Title and body are required.");
    return await ctx.db.insert("forumPosts", {
      authorId: user._id,
      authorName: user.name ?? user.email ?? "Zalen member",
      category: args.category.trim() || "general",
      title,
      body,
      score: 0,
      commentCount: 0,
    });
  },
});

export const createBounty = internalMutation({
  args: {
    clerkUserId: v.string(),
    title: v.string(),
    description: v.string(),
    type: v.string(),
    reward: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await userByClerk(ctx, args.clerkUserId);
    const title = args.title.trim();
    const description = args.description.trim();
    if (!title || !description) throw new ConvexError("Title and description are required.");
    return await ctx.db.insert("bounties", {
      authorId: user._id,
      authorName: user.name ?? user.email ?? "Zalen member",
      title,
      description,
      type: args.type.trim() || "feature",
      status: "open",
      reward: args.reward?.trim() || undefined,
      applicationCount: 0,
      score: 0,
    });
  },
});

export const applyToBounty = internalMutation({
  args: { clerkUserId: v.string(), bountyId: v.id("bounties"), proposal: v.string() },
  handler: async (ctx, args) => {
    const user = await userByClerk(ctx, args.clerkUserId);
    const bounty = await ctx.db.get(args.bountyId);
    if (!bounty) throw new ConvexError("Bounty not found.");
    if (bounty.authorId === user._id) throw new ConvexError("You cannot apply to your own bounty.");
    const existing = await ctx.db.query("bountyApplications").withIndex("by_bounty_applicant", (q) => q.eq("bountyId", args.bountyId).eq("applicantId", user._id)).unique();
    if (existing) throw new ConvexError("You have already applied to this bounty.");
    const proposal = args.proposal.trim();
    if (!proposal) throw new ConvexError("Proposal is required.");
    const id = await ctx.db.insert("bountyApplications", {
      bountyId: args.bountyId,
      applicantId: user._id,
      applicantName: user.name ?? user.email ?? "Zalen member",
      proposal,
      status: "pending",
    });
    await ctx.db.patch(args.bountyId, { applicationCount: bounty.applicationCount + 1, status: bounty.status === "open" ? "in_progress" : bounty.status });
    return id;
  },
});

export const voteForumPost = internalMutation({
  args: { clerkUserId: v.string(), postId: v.id("forumPosts"), direction: v.number() },
  handler: async (ctx, args) => {
    const user = await userByClerk(ctx, args.clerkUserId);
    if (args.direction !== 1 && args.direction !== -1) throw new ConvexError("Direction must be 1 or -1.");
    const post = await ctx.db.get(args.postId);
    if (!post) throw new ConvexError("Post not found.");
    const existing = await ctx.db.query("forumVotes").withIndex("by_user_post", (q) => q.eq("userId", user._id).eq("postId", args.postId)).unique();
    if (!existing) {
      await ctx.db.insert("forumVotes", { postId: args.postId, userId: user._id, direction: args.direction });
      await ctx.db.patch(args.postId, { score: post.score + args.direction });
      return { direction: args.direction };
    }
    if (existing.direction === args.direction) {
      await ctx.db.delete(existing._id);
      await ctx.db.patch(args.postId, { score: post.score - args.direction });
      return { direction: 0 };
    }
    await ctx.db.patch(existing._id, { direction: args.direction });
    await ctx.db.patch(args.postId, { score: post.score + args.direction * 2 });
    return { direction: args.direction };
  },
});

export const addForumComment = internalMutation({
  args: { clerkUserId: v.string(), postId: v.id("forumPosts"), body: v.string() },
  handler: async (ctx, args) => {
    const user = await userByClerk(ctx, args.clerkUserId);
    const post = await ctx.db.get(args.postId);
    if (!post) throw new ConvexError("Post not found.");
    const body = args.body.trim();
    if (!body) throw new ConvexError("Comment body is required.");
    const id = await ctx.db.insert("forumComments", { postId: args.postId, authorId: user._id, authorName: user.name ?? user.email ?? "Zalen member", body });
    await ctx.db.patch(args.postId, { commentCount: post.commentCount + 1 });
    return id;
  },
});

export const submitGigProposal = internalMutation({
  args: { clerkUserId: v.string(), gigId: v.id("gigs"), coverLetter: v.string(), proposedRate: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await userByClerk(ctx, args.clerkUserId);
    const gig = await ctx.db.get(args.gigId);
    if (!gig) throw new ConvexError("Gig not found.");
    if (gig.authorId === user._id) throw new ConvexError("You cannot apply to your own gig.");
    const existing = await ctx.db.query("gigApplications").withIndex("by_gig_applicant", (q) => q.eq("gigId", args.gigId).eq("applicantId", user._id)).unique();
    if (existing) throw new ConvexError("You have already submitted a proposal for this gig.");
    const coverLetter = args.coverLetter.trim();
    if (!coverLetter) throw new ConvexError("Cover letter is required.");
    const id = await ctx.db.insert("gigApplications", {
      gigId: args.gigId,
      applicantId: user._id,
      applicantName: user.name ?? user.email ?? "Zalen member",
      coverLetter,
      proposedRate: args.proposedRate?.trim() || undefined,
      status: "pending",
    });
    await ctx.db.patch(args.gigId, { proposalCount: gig.proposalCount + 1 });
    return id;
  },
});

export const saveProfile = internalMutation({
  args: { clerkUserId: v.string(), bio: v.optional(v.string()), location: v.optional(v.string()), phone: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await userByClerk(ctx, args.clerkUserId);
    const existing = await ctx.db.query("profiles").withIndex("by_user_id", (q) => q.eq("userId", user._id)).unique();
    const fields = { bio: args.bio, location: args.location, phone: args.phone };
    if (existing) {
      await ctx.db.patch(existing._id, fields);
      return existing._id;
    }
    return await ctx.db.insert("profiles", { userId: user._id, ...fields });
  },
});

export const saveSkills = internalMutation({
  args: { clerkUserId: v.string(), skills: v.array(v.object({ name: v.string(), category: v.optional(v.string()), proficiency: v.optional(v.string()) })) },
  handler: async (ctx, args) => {
    const user = await userByClerk(ctx, args.clerkUserId);
    const existing = await ctx.db.query("userSkills").withIndex("by_user_id", (q) => q.eq("userId", user._id)).take(200);
    await Promise.all(existing.map((row) => ctx.db.delete(row._id)));
    await Promise.all(args.skills.map((skill) => ctx.db.insert("userSkills", { userId: user._id, name: skill.name.trim(), category: skill.category, proficiency: skill.proficiency })));
    return args.skills.length;
  },
});

export const savePortfolioProject = internalMutation({
  args: { clerkUserId: v.string(), title: v.string(), summary: v.optional(v.string()), liveUrl: v.optional(v.string()), repoUrl: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await userByClerk(ctx, args.clerkUserId);
    const title = args.title.trim();
    if (!title) throw new ConvexError("Title is required.");
    return await ctx.db.insert("portfolioProjects", { userId: user._id, title, summary: args.summary, liveUrl: args.liveUrl, repoUrl: args.repoUrl, visibility: "public" });
  },
});

export const createGig = internalMutation({
  args: {
    clerkUserId: v.string(),
    title: v.string(),
    description: v.string(),
    category: v.string(),
    budget: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await userByClerk(ctx, args.clerkUserId);
    const title = args.title.trim();
    const description = args.description.trim();
    if (!title || !description) throw new ConvexError("Title and description are required.");
    return await ctx.db.insert("gigs", {
      authorId: user._id,
      authorName: user.name ?? user.email ?? "Zalen member",
      title,
      description,
      category: args.category.trim() || "general",
      status: "open",
      budget: args.budget?.trim() || undefined,
      proposalCount: 0,
    });
  },
});
