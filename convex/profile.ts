/**
 * convex/profile.ts
 *
 * Public API for the onboarding and profile system.
 * All mutations require the Clerk user to be authenticated and already synced
 * into the `users` table (call `users.store` after sign-in first).
 */

import { ConvexError, v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/**
 * Resolves the current Clerk identity and returns the matching `users` row.
 * Throws a ConvexError when the user is not authenticated or not yet synced.
 */
async function requireUser(
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError("Not authenticated");
  }

  // `identity.subject` is the Clerk user ID (stable, unique per user)
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_user_id", (q) =>
      q.eq("clerkUserId", identity.subject),
    )
    .unique();

  if (!user) {
    throw new ConvexError(
      "User record not found — call users.store after sign-in",
    );
  }

  return user;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Returns the full profile bundle for the currently signed-in user, or null
 * when the user is not authenticated.
 *
 * Shape: { profile, roleDetails, skills, projects, achievements, onboarding }
 */
export const getMyProfile = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) =>
        q.eq("clerkUserId", identity.subject),
      )
      .unique();

    if (!user) {
      return null;
    }

    const userId = user._id;

    // Fetch all related records in parallel
    const [profile, roleDetailsList, skills, projects, achievements, onboarding] =
      await Promise.all([
        ctx.db
          .query("profiles")
          .withIndex("by_user_id", (q) => q.eq("userId", userId))
          .unique(),
        ctx.db
          .query("roleDetails")
          .withIndex("by_user_id", (q) => q.eq("userId", userId))
          .take(20), // at most one row per role type
        ctx.db
          .query("userSkills")
          .withIndex("by_user_id", (q) => q.eq("userId", userId))
          .take(200),
        ctx.db
          .query("portfolioProjects")
          .withIndex("by_user_id_and_sortOrder", (q) => q.eq("userId", userId))
          .take(200),
        ctx.db
          .query("achievements")
          .withIndex("by_user_id", (q) => q.eq("userId", userId))
          .take(200),
        ctx.db
          .query("onboardingProgress")
          .withIndex("by_user_id", (q) => q.eq("userId", userId))
          .unique(),
      ]);

    return {
      user,
      profile,
      roleDetails: roleDetailsList,
      skills,
      projects,
      achievements,
      onboarding,
    };
  },
});

/**
 * Returns the onboarding progress record for the current user, or null if
 * the user is not authenticated / has not started onboarding.
 */
export const getOnboardingStatus = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) =>
        q.eq("clerkUserId", identity.subject),
      )
      .unique();

    if (!user) {
      return null;
    }

    return ctx.db
      .query("onboardingProgress")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .unique();
  },
});

// ---------------------------------------------------------------------------
// Profile mutations
// ---------------------------------------------------------------------------

/**
 * Saves (upserts) basic contact / bio information for the current user.
 */
export const saveBasicInfo = mutation({
  args: {
    phone: v.optional(v.string()),
    phoneCountryCode: v.optional(v.string()),
    bio: v.optional(v.string()),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        phone: args.phone,
        phoneCountryCode: args.phoneCountryCode,
        bio: args.bio,
        location: args.location,
      });
      return existing._id;
    }

    return ctx.db.insert("profiles", {
      userId: user._id,
      phone: args.phone,
      phoneCountryCode: args.phoneCountryCode,
      bio: args.bio,
      location: args.location,
    });
  },
});

/**
 * Saves the user's primary and secondary role selections.
 * Creates the profiles record if it doesn't exist yet.
 */
export const saveRoleSelection = mutation({
  args: {
    primaryRole: v.string(),
    secondaryRoles: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        primaryRole: args.primaryRole,
        secondaryRoles: args.secondaryRoles,
      });
      return existing._id;
    }

    return ctx.db.insert("profiles", {
      userId: user._id,
      primaryRole: args.primaryRole,
      secondaryRoles: args.secondaryRoles,
    });
  },
});

/**
 * Upserts role-specific extended data for the current user.
 * One row per (user, role) pair.
 */
export const saveRoleDetails = mutation({
  args: {
    role: v.string(),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    // Find an existing roleDetails row for this specific role
    const rows = await ctx.db
      .query("roleDetails")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .take(20);

    const existing = rows.find((r) => r.role === args.role);

    if (existing) {
      await ctx.db.patch(existing._id, { data: args.data });
      return existing._id;
    }

    return ctx.db.insert("roleDetails", {
      userId: user._id,
      role: args.role,
      data: args.data,
    });
  },
});

/**
 * Replaces all skills for the current user with the supplied list.
 * Deletes existing rows and re-inserts — this keeps the list authoritative
 * without needing per-skill IDs on the client.
 */
export const saveSkills = mutation({
  args: {
    skills: v.array(
      v.object({
        name: v.string(),
        category: v.optional(v.string()),
        proficiency: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    // Delete all existing skill rows for this user
    const existing = await ctx.db
      .query("userSkills")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .take(200);

    await Promise.all(existing.map((row) => ctx.db.delete(row._id)));

    // Insert the new skill set
    await Promise.all(
      args.skills.map((skill) =>
        ctx.db.insert("userSkills", {
          userId: user._id,
          name: skill.name,
          category: skill.category,
          proficiency: skill.proficiency,
        }),
      ),
    );
  },
});

// ---------------------------------------------------------------------------
// Portfolio project mutations
// ---------------------------------------------------------------------------

/**
 * Creates a new portfolio project or patches an existing one.
 * Pass `projectId` to update; omit or pass undefined to insert.
 */
export const upsertPortfolioProject = mutation({
  args: {
    // Optional: provide to update an existing project
    projectId: v.optional(v.id("portfolioProjects")),
    title: v.string(),
    summary: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    skills: v.optional(v.array(v.string())),
    role: v.optional(v.string()),
    status: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    liveUrl: v.optional(v.string()),
    repoUrl: v.optional(v.string()),
    coverImageStorageId: v.optional(v.id("_storage")),
    visibility: v.optional(v.string()),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const { projectId, ...fields } = args;

    if (projectId !== undefined) {
      // Update path — verify ownership first
      const project = await ctx.db.get(projectId);
      if (!project) {
        throw new ConvexError("Project not found");
      }
      if (project.userId !== user._id) {
        throw new ConvexError("Not authorized to edit this project");
      }
      await ctx.db.patch(projectId, fields);
      return projectId;
    }

    // Insert path
    return ctx.db.insert("portfolioProjects", {
      userId: user._id,
      ...fields,
    });
  },
});

/**
 * Deletes a portfolio project after verifying ownership.
 */
export const deletePortfolioProject = mutation({
  args: { projectId: v.id("portfolioProjects") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new ConvexError("Project not found");
    }
    if (project.userId !== user._id) {
      throw new ConvexError("Not authorized to delete this project");
    }

    await ctx.db.delete(args.projectId);
  },
});

// ---------------------------------------------------------------------------
// Achievement mutations
// ---------------------------------------------------------------------------

/**
 * Creates a new achievement or patches an existing one.
 * Pass `achievementId` to update; omit or pass undefined to insert.
 */
export const upsertAchievement = mutation({
  args: {
    // Optional: provide to update an existing achievement
    achievementId: v.optional(v.id("achievements")),
    title: v.string(),
    category: v.optional(v.string()),
    issuingOrg: v.optional(v.string()),
    dateAchieved: v.optional(v.string()),
    description: v.optional(v.string()),
    credentialUrl: v.optional(v.string()),
    certificateStorageId: v.optional(v.id("_storage")),
    visibility: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const { achievementId, ...fields } = args;

    if (achievementId !== undefined) {
      // Update path — verify ownership first
      const achievement = await ctx.db.get(achievementId);
      if (!achievement) {
        throw new ConvexError("Achievement not found");
      }
      if (achievement.userId !== user._id) {
        throw new ConvexError("Not authorized to edit this achievement");
      }
      await ctx.db.patch(achievementId, fields);
      return achievementId;
    }

    // Insert path
    return ctx.db.insert("achievements", {
      userId: user._id,
      ...fields,
    });
  },
});

/**
 * Deletes an achievement after verifying ownership.
 */
export const deleteAchievement = mutation({
  args: { achievementId: v.id("achievements") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const achievement = await ctx.db.get(args.achievementId);
    if (!achievement) {
      throw new ConvexError("Achievement not found");
    }
    if (achievement.userId !== user._id) {
      throw new ConvexError("Not authorized to delete this achievement");
    }

    await ctx.db.delete(args.achievementId);
  },
});

// ---------------------------------------------------------------------------
// Onboarding mutations
// ---------------------------------------------------------------------------

/**
 * Records progress through the onboarding wizard.
 * Upserts the onboardingProgress row and stores per-step form data.
 */
export const advanceOnboardingStep = mutation({
  args: {
    step: v.number(),
    stepData: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const existing = await ctx.db
      .query("onboardingProgress")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        currentStep: args.step,
        stepData: args.stepData,
      });
      return existing._id;
    }

    return ctx.db.insert("onboardingProgress", {
      userId: user._id,
      currentStep: args.step,
      completed: false,
      stepData: args.stepData,
    });
  },
});

/**
 * Marks onboarding as completed.
 *
 * Validates that a profile with a primaryRole exists before allowing completion.
 * Throws a ConvexError with a user-facing message if the profile is not ready.
 */
export const completeOnboarding = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    // Backend validation — profile must exist and have a primaryRole set
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .unique();

    if (!profile) {
      throw new ConvexError(
        "Cannot complete onboarding: profile not found. Complete the profile steps first.",
      );
    }
    if (!profile.primaryRole) {
      throw new ConvexError(
        "Cannot complete onboarding: primary role has not been selected.",
      );
    }

    const existing = await ctx.db
      .query("onboardingProgress")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .unique();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        completed: true,
        completedAt: now,
      });
      return existing._id;
    }

    // Edge case: completing onboarding without prior step advancement
    return ctx.db.insert("onboardingProgress", {
      userId: user._id,
      currentStep: 6,
      completed: true,
      completedAt: now,
    });
  },
});
