import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ---------------------------------------------------------------------------
  // Core user mirror — synced from Clerk on sign-in (see users.ts / SyncUser)
  // ---------------------------------------------------------------------------
  users: defineTable({
    clerkUserId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  }).index("by_clerk_user_id", ["clerkUserId"]),

  // Example table — replace with your own domain models.
  tasks: defineTable({
    userId: v.id("users"),
    title: v.string(),
    completed: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_user_completed", ["userId", "completed"]),

  // ---------------------------------------------------------------------------
  // Onboarding & profile tables
  // ---------------------------------------------------------------------------

  /**
   * Public profile information for a user.
   * One record per user (upserted via profile.ts mutations).
   */
  profiles: defineTable({
    userId: v.id("users"),
    phone: v.optional(v.string()),
    phoneCountryCode: v.optional(v.string()),
    bio: v.optional(v.string()),
    /** Free-text "city, state/country" */
    location: v.optional(v.string()),
    /** Storage ID for the uploaded avatar image */
    avatarStorageId: v.optional(v.id("_storage")),
    /**
     * Primary role — one of:
     * "student" | "graduate" | "founder" | "recruiter" |
     * "business" | "freelancer" | "mentor" | "institution"
     */
    primaryRole: v.optional(v.string()),
    secondaryRoles: v.optional(v.array(v.string())),
    /** Defaults to true semantically; explicit false means private profile */
    isPublic: v.optional(v.boolean()),
  }).index("by_user_id", ["userId"]),

  /**
   * Tracks which step of the multi-step onboarding flow the user is on,
   * and whether they have finished.
   */
  onboardingProgress: defineTable({
    userId: v.id("users"),
    /** Current active step, 1–6 */
    currentStep: v.number(),
    completed: v.boolean(),
    /** Partial form data keyed by step number, stored as a flexible JSON blob */
    stepData: v.optional(v.any()),
    /** Unix timestamp (ms) set when completed === true */
    completedAt: v.optional(v.number()),
  }).index("by_user_id", ["userId"]),

  /**
   * Role-specific extended profile data.
   * Flexible `data` field holds a JSON object whose shape depends on `role`.
   * One record per (user, role) pair.
   */
  roleDetails: defineTable({
    userId: v.id("users"),
    role: v.string(),
    /** Flexible role-specific data — shape varies per role */
    data: v.any(),
  }).index("by_user_id", ["userId"]),

  /**
   * Skills the user has declared on their profile.
   * Stored as individual rows so they can be queried, filtered, and replaced.
   */
  userSkills: defineTable({
    userId: v.id("users"),
    name: v.string(),
    category: v.optional(v.string()),
    /** "beginner" | "intermediate" | "advanced" | "expert" */
    proficiency: v.optional(v.string()),
  }).index("by_user_id", ["userId"]),

  /**
   * Portfolio / project showcase entries.
   */
  portfolioProjects: defineTable({
    userId: v.id("users"),
    title: v.string(),
    summary: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    /** Skill tags associated with this project */
    skills: v.optional(v.array(v.string())),
    /** The user's role in this project */
    role: v.optional(v.string()),
    /** "completed" | "in_progress" | "archived" */
    status: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    liveUrl: v.optional(v.string()),
    repoUrl: v.optional(v.string()),
    coverImageStorageId: v.optional(v.id("_storage")),
    /** "public" | "private" */
    visibility: v.optional(v.string()),
    /** Explicit ordering value; lower = shown first */
    sortOrder: v.optional(v.number()),
  })
    .index("by_user_id", ["userId"])
    .index("by_user_id_and_sortOrder", ["userId", "sortOrder"]),

  /**
   * Awards, certifications, publications, and other achievements.
   */
  achievements: defineTable({
    userId: v.id("users"),
    title: v.string(),
    /**
     * "competition" | "award" | "certification" | "research" |
     * "publication" | "leadership" | "other"
     */
    category: v.optional(v.string()),
    issuingOrg: v.optional(v.string()),
    dateAchieved: v.optional(v.string()),
    description: v.optional(v.string()),
    credentialUrl: v.optional(v.string()),
    certificateStorageId: v.optional(v.id("_storage")),
    /** "public" | "private" */
    visibility: v.optional(v.string()),
  }).index("by_user_id", ["userId"]),
});
