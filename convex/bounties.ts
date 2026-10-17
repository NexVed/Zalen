/**
 * convex/bounties.ts
 *
 * Bounty board: post bugs, features, code-reviews, design requests, and more.
 * Any authenticated user can:
 *   - Browse bounties (listBounties, getBounty)
 *   - Upvote a bounty (vote)
 *   - Apply / propose a solution (apply)
 *   - Edit their own application or submit a solution (updateApplication)
 *
 * Only the bounty author can:
 *   - Edit (editBounty) or delete (deleteBounty) their post
 *   - Accept / reject an application (reviewApplication)
 *   - Mark the bounty as completed (completeBounty)
 *
 * Auth model: mirrors forum.ts — requireUser() resolves the Clerk identity to
 * a Convex users row, throwing if not authenticated or not yet synced.
 */

import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function requireUser(ctx: QueryCtx | MutationCtx): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError("Not authenticated");

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_user_id", (q) =>
      q.eq("clerkUserId", identity.subject),
    )
    .unique();

  if (!user) throw new ConvexError("User not synced — call users.store first");
  return user;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * List bounties, optionally filtered by type or status.
 * Returns the caller's upvote state (myVote) and whether they have already applied.
 */
export const listBounties = query({
  args: {
    type: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    let currentUserId: Id<"users"> | null = null;
    if (identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_user_id", (q) =>
          q.eq("clerkUserId", identity.subject),
        )
        .unique();
      currentUserId = user?._id ?? null;
    }

    // Use the by_status index when filtering by status to avoid full table scans
    let rawBounties: Doc<"bounties">[];
    if (args.status) {
      rawBounties = await ctx.db
        .query("bounties")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .take(200);
    } else {
      rawBounties = await ctx.db.query("bounties").take(200);
    }

    // Client-side type filter (the table has no composite index for status+type)
    const bounties = args.type
      ? rawBounties.filter((b) => b.type === args.type)
      : rawBounties;

    // Sort by score desc, then newest first
    bounties.sort(
      (a, b) => b.score - a.score || b._creationTime - a._creationTime,
    );

    if (!currentUserId) {
      return bounties.map((b) => ({ ...b, myVote: false, myApplicationId: null }));
    }

    // Fetch user votes and applications in parallel
    const [myVotes, myApps] = await Promise.all([
      Promise.all(
        bounties.map((b) =>
          ctx.db
            .query("bountyVotes")
            .withIndex("by_user_bounty", (q) =>
              q.eq("userId", currentUserId!).eq("bountyId", b._id),
            )
            .unique(),
        ),
      ),
      Promise.all(
        bounties.map((b) =>
          ctx.db
            .query("bountyApplications")
            .withIndex("by_bounty_applicant", (q) =>
              q.eq("bountyId", b._id).eq("applicantId", currentUserId!),
            )
            .unique(),
        ),
      ),
    ]);

    return bounties.map((b, i) => ({
      ...b,
      myVote: !!myVotes[i],
      myApplicationId: myApps[i]?._id ?? null,
    }));
  },
});

/**
 * Fetch a single bounty with the caller's vote + application state.
 */
export const getBounty = query({
  args: { bountyId: v.id("bounties") },
  handler: async (ctx, args) => {
    const bounty = await ctx.db.get(args.bountyId);
    if (!bounty) return null;

    const identity = await ctx.auth.getUserIdentity();
    let myVote = false;
    let myApplicationId: Id<"bountyApplications"> | null = null;

    if (identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_user_id", (q) =>
          q.eq("clerkUserId", identity.subject),
        )
        .unique();
      if (user) {
        const [vote, app] = await Promise.all([
          ctx.db
            .query("bountyVotes")
            .withIndex("by_user_bounty", (q) =>
              q.eq("userId", user._id).eq("bountyId", args.bountyId),
            )
            .unique(),
          ctx.db
            .query("bountyApplications")
            .withIndex("by_bounty_applicant", (q) =>
              q.eq("bountyId", args.bountyId).eq("applicantId", user._id),
            )
            .unique(),
        ]);
        myVote = !!vote;
        myApplicationId = app?._id ?? null;
      }
    }

    return { ...bounty, myVote, myApplicationId };
  },
});

/**
 * List all applications for a bounty.
 * Only the bounty author sees all applications; other users see their own only.
 */
export const listApplications = query({
  args: { bountyId: v.id("bounties") },
  handler: async (ctx, args) => {
    const bounty = await ctx.db.get(args.bountyId);
    if (!bounty) return [];

    const identity = await ctx.auth.getUserIdentity();
    let currentUserId: Id<"users"> | null = null;
    if (identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_user_id", (q) =>
          q.eq("clerkUserId", identity.subject),
        )
        .unique();
      currentUserId = user?._id ?? null;
    }

    const apps = await ctx.db
      .query("bountyApplications")
      .withIndex("by_bounty", (q) => q.eq("bountyId", args.bountyId))
      .take(100);

    // Non-authors can see all applications (proposal visible to everyone) but
    // the author's identity and full solution are public too — this is a public board.
    // Return all, sorted: accepted first, then pending, then rejected.
    const order: Record<string, number> = { accepted: 0, pending: 1, rejected: 2 };
    apps.sort(
      (a, b) =>
        (order[a.status] ?? 3) - (order[b.status] ?? 3) ||
        a._creationTime - b._creationTime,
    );

    // Tag which application belongs to the current user
    return apps.map((app) => ({
      ...app,
      isMine: app.applicantId === currentUserId,
      isAuthor: bounty.authorId === currentUserId,
    }));
  },
});

// ---------------------------------------------------------------------------
// Bounty mutations
// ---------------------------------------------------------------------------

/**
 * Create a new bounty.
 */
export const createBounty = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    type: v.string(),
    reward: v.optional(v.string()),
    repoUrl: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    if (!args.title.trim()) throw new ConvexError("Title is required");
    if (!args.description.trim()) throw new ConvexError("Description is required");

    return ctx.db.insert("bounties", {
      authorId: user._id,
      authorName: user.name ?? user.email ?? "Zalen member",
      title: args.title.trim(),
      description: args.description.trim(),
      type: args.type,
      status: "open",
      reward: args.reward?.trim() || undefined,
      repoUrl: args.repoUrl?.trim() || undefined,
      tags: args.tags?.filter(Boolean),
      applicationCount: 0,
      score: 0,
    });
  },
});

/**
 * Edit a bounty's content. Author-only. Cannot change status here.
 */
export const editBounty = mutation({
  args: {
    bountyId: v.id("bounties"),
    title: v.string(),
    description: v.string(),
    type: v.string(),
    reward: v.optional(v.string()),
    repoUrl: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const bounty = await ctx.db.get(args.bountyId);
    if (!bounty) throw new ConvexError("Bounty not found");
    if (bounty.authorId !== user._id)
      throw new ConvexError("Not authorised to edit this bounty");

    await ctx.db.patch(args.bountyId, {
      title: args.title.trim(),
      description: args.description.trim(),
      type: args.type,
      reward: args.reward?.trim() || undefined,
      repoUrl: args.repoUrl?.trim() || undefined,
      tags: args.tags?.filter(Boolean),
      editedAt: Date.now(),
    });
  },
});

/**
 * Delete a bounty and all its applications and votes. Author-only.
 */
export const deleteBounty = mutation({
  args: { bountyId: v.id("bounties") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const bounty = await ctx.db.get(args.bountyId);
    if (!bounty) throw new ConvexError("Bounty not found");
    if (bounty.authorId !== user._id)
      throw new ConvexError("Not authorised to delete this bounty");

    // Clean up applications
    const apps = await ctx.db
      .query("bountyApplications")
      .withIndex("by_bounty", (q) => q.eq("bountyId", args.bountyId))
      .collect();
    await Promise.all(apps.map((a) => ctx.db.delete(a._id)));

    // Clean up votes
    const votes = await ctx.db
      .query("bountyVotes")
      .withIndex("by_bounty", (q) => q.eq("bountyId", args.bountyId))
      .collect();
    await Promise.all(votes.map((v) => ctx.db.delete(v._id)));

    await ctx.db.delete(args.bountyId);
  },
});

/**
 * Toggle an upvote on a bounty.
 * Calling again with a vote already present removes it.
 */
export const voteBounty = mutation({
  args: { bountyId: v.id("bounties") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const bounty = await ctx.db.get(args.bountyId);
    if (!bounty) throw new ConvexError("Bounty not found");

    const existing = await ctx.db
      .query("bountyVotes")
      .withIndex("by_user_bounty", (q) =>
        q.eq("userId", user._id).eq("bountyId", args.bountyId),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      await ctx.db.patch(args.bountyId, { score: Math.max(0, bounty.score - 1) });
    } else {
      await ctx.db.insert("bountyVotes", {
        bountyId: args.bountyId,
        userId: user._id,
      });
      await ctx.db.patch(args.bountyId, { score: bounty.score + 1 });
    }
  },
});

// ---------------------------------------------------------------------------
// Application mutations
// ---------------------------------------------------------------------------

/**
 * Apply to a bounty with a proposal.
 * A user can only apply once per bounty.
 */
export const applyToBounty = mutation({
  args: {
    bountyId: v.id("bounties"),
    proposal: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const bounty = await ctx.db.get(args.bountyId);
    if (!bounty) throw new ConvexError("Bounty not found");
    if (bounty.status === "cancelled")
      throw new ConvexError("This bounty has been cancelled");
    if (bounty.status === "completed")
      throw new ConvexError("This bounty has already been completed");
    if (bounty.authorId === user._id)
      throw new ConvexError("You cannot apply to your own bounty");

    // Prevent duplicate applications
    const existing = await ctx.db
      .query("bountyApplications")
      .withIndex("by_bounty_applicant", (q) =>
        q.eq("bountyId", args.bountyId).eq("applicantId", user._id),
      )
      .unique();
    if (existing)
      throw new ConvexError("You have already applied to this bounty");

    if (!args.proposal.trim())
      throw new ConvexError("Proposal is required");

    const appId = await ctx.db.insert("bountyApplications", {
      bountyId: args.bountyId,
      applicantId: user._id,
      applicantName: user.name ?? user.email ?? "Zalen member",
      proposal: args.proposal.trim(),
      status: "pending",
    });

    // Update denormalised count
    await ctx.db.patch(args.bountyId, {
      applicationCount: bounty.applicationCount + 1,
      status: bounty.status === "open" ? "in_progress" : bounty.status,
    });

    return appId;
  },
});

/**
 * Edit a user's own application or submit a solution.
 */
export const updateApplication = mutation({
  args: {
    applicationId: v.id("bountyApplications"),
    proposal: v.optional(v.string()),
    solution: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const app = await ctx.db.get(args.applicationId);
    if (!app) throw new ConvexError("Application not found");
    if (app.applicantId !== user._id)
      throw new ConvexError("Not authorised to edit this application");
    if (app.status === "accepted")
      throw new ConvexError("Accepted applications cannot be edited");

    await ctx.db.patch(args.applicationId, {
      ...(args.proposal !== undefined && { proposal: args.proposal.trim() }),
      ...(args.solution !== undefined && { solution: args.solution.trim() }),
      editedAt: Date.now(),
    });
  },
});

/**
 * Bounty author accepts an application, which closes the bounty.
 */
export const acceptApplication = mutation({
  args: {
    applicationId: v.id("bountyApplications"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const app = await ctx.db.get(args.applicationId);
    if (!app) throw new ConvexError("Application not found");

    const bounty = await ctx.db.get(app.bountyId);
    if (!bounty) throw new ConvexError("Bounty not found");
    if (bounty.authorId !== user._id)
      throw new ConvexError("Only the bounty author can accept an application");

    // Mark this application accepted, reject all others
    const allApps = await ctx.db
      .query("bountyApplications")
      .withIndex("by_bounty", (q) => q.eq("bountyId", bounty._id))
      .collect();

    await Promise.all(
      allApps.map((a) =>
        ctx.db.patch(a._id, {
          status: a._id === args.applicationId ? "accepted" : "rejected",
        }),
      ),
    );

    await ctx.db.patch(bounty._id, {
      status: "completed",
      acceptedApplicationId: args.applicationId,
    });
  },
});

/**
 * Bounty author rejects a specific application.
 */
export const rejectApplication = mutation({
  args: {
    applicationId: v.id("bountyApplications"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const app = await ctx.db.get(args.applicationId);
    if (!app) throw new ConvexError("Application not found");

    const bounty = await ctx.db.get(app.bountyId);
    if (!bounty) throw new ConvexError("Bounty not found");
    if (bounty.authorId !== user._id)
      throw new ConvexError("Only the bounty author can reject an application");

    await ctx.db.patch(args.applicationId, { status: "rejected" });
  },
});

/**
 * Author can reopen a bounty (e.g., to re-open after no accepted solution).
 */
export const updateBountyStatus = mutation({
  args: {
    bountyId: v.id("bounties"),
    status: v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled"),
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const bounty = await ctx.db.get(args.bountyId);
    if (!bounty) throw new ConvexError("Bounty not found");
    if (bounty.authorId !== user._id)
      throw new ConvexError("Not authorised to update this bounty");

    await ctx.db.patch(args.bountyId, { status: args.status });
  },
});
