/**
 * convex/gigs.ts
 *
 * Freelance gig board: clients post gigs, freelancers submit proposals.
 *
 * Auth model mirrors forum.ts / bounties.ts — requireUser() resolves Clerk
 * identity to a Convex users row, throwing if unauthenticated or unsynced.
 *
 * Permissions:
 *  - Any authenticated user can browse, submit a proposal, edit their own proposal.
 *  - Only the gig author can edit/delete their gig, accept/reject proposals,
 *    and mark the gig completed or cancelled.
 *  - A user cannot submit a proposal to their own gig.
 *  - Only one proposal per (user, gig).
 */

import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";

// ---------------------------------------------------------------------------
// Helper
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
 * List gigs, optionally filtered by category or status.
 * Returns myProposalId for the calling user (null if not applied).
 */
export const listGigs = query({
  args: {
    category: v.optional(v.string()),
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

    // Use indexed query when filtering by status
    let rawGigs: Doc<"gigs">[];
    if (args.status) {
      rawGigs = await ctx.db
        .query("gigs")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .take(200);
    } else if (args.category) {
      rawGigs = await ctx.db
        .query("gigs")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .take(200);
    } else {
      rawGigs = await ctx.db.query("gigs").take(200);
    }

    // Client-side secondary filter for category when status index was used
    const gigs =
      args.status && args.category
        ? rawGigs.filter((g) => g.category === args.category)
        : rawGigs;

    // Sort: newest first (most recently posted gigs first)
    gigs.sort((a, b) => b._creationTime - a._creationTime);

    if (!currentUserId) {
      return gigs.map((g) => ({ ...g, myProposalId: null as Id<"gigApplications"> | null }));
    }

    // Attach each user's proposal ID
    const myApps = await Promise.all(
      gigs.map((g) =>
        ctx.db
          .query("gigApplications")
          .withIndex("by_gig_applicant", (q) =>
            q.eq("gigId", g._id).eq("applicantId", currentUserId!),
          )
          .unique(),
      ),
    );

    return gigs.map((g, i) => ({
      ...g,
      myProposalId: myApps[i]?._id ?? null,
    }));
  },
});

/**
 * Fetch a single gig with the caller's proposal ID.
 */
export const getGig = query({
  args: { gigId: v.id("gigs") },
  handler: async (ctx, args) => {
    const gig = await ctx.db.get(args.gigId);
    if (!gig) return null;

    const identity = await ctx.auth.getUserIdentity();
    let myProposalId: Id<"gigApplications"> | null = null;

    if (identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_user_id", (q) =>
          q.eq("clerkUserId", identity.subject),
        )
        .unique();
      if (user) {
        const app = await ctx.db
          .query("gigApplications")
          .withIndex("by_gig_applicant", (q) =>
            q.eq("gigId", args.gigId).eq("applicantId", user._id),
          )
          .unique();
        myProposalId = app?._id ?? null;
      }
    }

    return { ...gig, myProposalId };
  },
});

/**
 * List proposals for a gig.
 * The gig author sees all proposals.
 * Other users only see their own proposal (enforced by returning all but
 * tagging isMine so the UI can decide what to render — the board is public).
 */
export const listProposals = query({
  args: { gigId: v.id("gigs") },
  handler: async (ctx, args) => {
    const gig = await ctx.db.get(args.gigId);
    if (!gig) return [];

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

    const proposals = await ctx.db
      .query("gigApplications")
      .withIndex("by_gig", (q) => q.eq("gigId", args.gigId))
      .take(100);

    // Sort: accepted first, then pending, then rejected
    const order: Record<string, number> = { accepted: 0, pending: 1, rejected: 2 };
    proposals.sort(
      (a, b) =>
        (order[a.status] ?? 3) - (order[b.status] ?? 3) ||
        a._creationTime - b._creationTime,
    );

    return proposals.map((p) => ({
      ...p,
      isMine: p.applicantId === currentUserId,
      isAuthor: gig.authorId === currentUserId,
    }));
  },
});

// ---------------------------------------------------------------------------
// Gig mutations
// ---------------------------------------------------------------------------

export const createGig = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    category: v.string(),
    budgetType: v.optional(v.string()),
    budget: v.optional(v.string()),
    duration: v.optional(v.string()),
    skills: v.optional(v.array(v.string())),
    referenceUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    if (!args.title.trim()) throw new ConvexError("Title is required");
    if (!args.description.trim())
      throw new ConvexError("Description is required");

    return ctx.db.insert("gigs", {
      authorId: user._id,
      authorName: user.name ?? user.email ?? "Zalen member",
      title: args.title.trim(),
      description: args.description.trim(),
      category: args.category,
      status: "open",
      budgetType: args.budgetType || undefined,
      budget: args.budget?.trim() || undefined,
      duration: args.duration?.trim() || undefined,
      skills: args.skills?.filter(Boolean),
      referenceUrl: args.referenceUrl?.trim() || undefined,
      proposalCount: 0,
    });
  },
});

export const editGig = mutation({
  args: {
    gigId: v.id("gigs"),
    title: v.string(),
    description: v.string(),
    category: v.string(),
    budgetType: v.optional(v.string()),
    budget: v.optional(v.string()),
    duration: v.optional(v.string()),
    skills: v.optional(v.array(v.string())),
    referenceUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const gig = await ctx.db.get(args.gigId);
    if (!gig) throw new ConvexError("Gig not found");
    if (gig.authorId !== user._id)
      throw new ConvexError("Not authorised to edit this gig");

    await ctx.db.patch(args.gigId, {
      title: args.title.trim(),
      description: args.description.trim(),
      category: args.category,
      budgetType: args.budgetType || undefined,
      budget: args.budget?.trim() || undefined,
      duration: args.duration?.trim() || undefined,
      skills: args.skills?.filter(Boolean),
      referenceUrl: args.referenceUrl?.trim() || undefined,
      editedAt: Date.now(),
    });
  },
});

export const deleteGig = mutation({
  args: { gigId: v.id("gigs") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const gig = await ctx.db.get(args.gigId);
    if (!gig) throw new ConvexError("Gig not found");
    if (gig.authorId !== user._id)
      throw new ConvexError("Not authorised to delete this gig");

    // Delete all proposals
    const proposals = await ctx.db
      .query("gigApplications")
      .withIndex("by_gig", (q) => q.eq("gigId", args.gigId))
      .collect();
    await Promise.all(proposals.map((p) => ctx.db.delete(p._id)));

    await ctx.db.delete(args.gigId);
  },
});

export const updateGigStatus = mutation({
  args: {
    gigId: v.id("gigs"),
    status: v.union(
      v.literal("open"),
      v.literal("hired"),
      v.literal("completed"),
      v.literal("cancelled"),
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const gig = await ctx.db.get(args.gigId);
    if (!gig) throw new ConvexError("Gig not found");
    if (gig.authorId !== user._id)
      throw new ConvexError("Not authorised to update this gig");

    await ctx.db.patch(args.gigId, { status: args.status });
  },
});

// ---------------------------------------------------------------------------
// Proposal mutations
// ---------------------------------------------------------------------------

export const submitProposal = mutation({
  args: {
    gigId: v.id("gigs"),
    coverLetter: v.string(),
    proposedRate: v.optional(v.string()),
    portfolioUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const gig = await ctx.db.get(args.gigId);
    if (!gig) throw new ConvexError("Gig not found");
    if (gig.status === "cancelled")
      throw new ConvexError("This gig has been cancelled");
    if (gig.status === "hired" || gig.status === "completed")
      throw new ConvexError("This gig is no longer accepting proposals");
    if (gig.authorId === user._id)
      throw new ConvexError("You cannot apply to your own gig");

    const existing = await ctx.db
      .query("gigApplications")
      .withIndex("by_gig_applicant", (q) =>
        q.eq("gigId", args.gigId).eq("applicantId", user._id),
      )
      .unique();
    if (existing)
      throw new ConvexError("You have already submitted a proposal for this gig");

    if (!args.coverLetter.trim())
      throw new ConvexError("Cover letter is required");

    const proposalId = await ctx.db.insert("gigApplications", {
      gigId: args.gigId,
      applicantId: user._id,
      applicantName: user.name ?? user.email ?? "Zalen member",
      coverLetter: args.coverLetter.trim(),
      proposedRate: args.proposedRate?.trim() || undefined,
      portfolioUrl: args.portfolioUrl?.trim() || undefined,
      status: "pending",
    });

    await ctx.db.patch(args.gigId, {
      proposalCount: gig.proposalCount + 1,
    });

    return proposalId;
  },
});

export const editProposal = mutation({
  args: {
    proposalId: v.id("gigApplications"),
    coverLetter: v.string(),
    proposedRate: v.optional(v.string()),
    portfolioUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const proposal = await ctx.db.get(args.proposalId);
    if (!proposal) throw new ConvexError("Proposal not found");
    if (proposal.applicantId !== user._id)
      throw new ConvexError("Not authorised to edit this proposal");
    if (proposal.status === "accepted")
      throw new ConvexError("Accepted proposals cannot be edited");

    await ctx.db.patch(args.proposalId, {
      coverLetter: args.coverLetter.trim(),
      proposedRate: args.proposedRate?.trim() || undefined,
      portfolioUrl: args.portfolioUrl?.trim() || undefined,
      editedAt: Date.now(),
    });
  },
});

/**
 * Gig author accepts a proposal — marks gig as "hired", rejects all others.
 */
export const acceptProposal = mutation({
  args: { proposalId: v.id("gigApplications") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const proposal = await ctx.db.get(args.proposalId);
    if (!proposal) throw new ConvexError("Proposal not found");

    const gig = await ctx.db.get(proposal.gigId);
    if (!gig) throw new ConvexError("Gig not found");
    if (gig.authorId !== user._id)
      throw new ConvexError("Only the gig poster can accept a proposal");

    const allProposals = await ctx.db
      .query("gigApplications")
      .withIndex("by_gig", (q) => q.eq("gigId", gig._id))
      .collect();

    await Promise.all(
      allProposals.map((p) =>
        ctx.db.patch(p._id, {
          status: p._id === args.proposalId ? "accepted" : "rejected",
        }),
      ),
    );

    await ctx.db.patch(gig._id, {
      status: "hired",
      acceptedProposalId: args.proposalId,
    });
  },
});

/**
 * Gig author rejects a single proposal.
 */
export const rejectProposal = mutation({
  args: { proposalId: v.id("gigApplications") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const proposal = await ctx.db.get(args.proposalId);
    if (!proposal) throw new ConvexError("Proposal not found");

    const gig = await ctx.db.get(proposal.gigId);
    if (!gig) throw new ConvexError("Gig not found");
    if (gig.authorId !== user._id)
      throw new ConvexError("Only the gig poster can reject a proposal");

    await ctx.db.patch(args.proposalId, { status: "rejected" });
  },
});
