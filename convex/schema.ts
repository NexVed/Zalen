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

  // ---------------------------------------------------------------------------
  // Forum tables (Reddit-style: posts, votes, comments)
  // ---------------------------------------------------------------------------

  /**
   * A public forum post. Any authenticated user can create one.
   * Score is kept denormalised on the document for fast listing sorts.
   */
  forumPosts: defineTable({
    authorId: v.id("users"),
    authorName: v.string(),
    /** "Questions" | "Feedback" | "Build logs" | "Resources" */
    category: v.string(),
    title: v.string(),
    body: v.string(),
    /** Denormalised: upvotes minus downvotes, updated by vote mutations */
    score: v.number(),
    /** Denormalised comment count, updated by comment mutations */
    commentCount: v.number(),
    /** Up to 4 Convex storage IDs for attached images */
    imageStorageIds: v.optional(v.array(v.id("_storage"))),
    /** Optional external link attached to the post */
    linkUrl: v.optional(v.string()),
    /** Display title for the link (falls back to the URL if absent) */
    linkTitle: v.optional(v.string()),
    /** Unix ms timestamp of last edit, absent if never edited */
    editedAt: v.optional(v.number()),
  })
    .index("by_category", ["category"])
    .index("by_score", ["score"]),

  /**
   * One vote per (user, post) pair.
   * direction: 1 = upvote, -1 = downvote.
   */
  forumVotes: defineTable({
    postId: v.id("forumPosts"),
    userId: v.id("users"),
    /** 1 (up) or -1 (down) */
    direction: v.number(),
  })
    .index("by_post", ["postId"])
    .index("by_user_post", ["userId", "postId"]),

  /**
   * Comments on a forum post. Flat (no threading) for simplicity.
   */
  forumComments: defineTable({
    postId: v.id("forumPosts"),
    authorId: v.id("users"),
    authorName: v.string(),
    body: v.string(),
    /** Unix ms timestamp of last edit, absent if never edited */
    editedAt: v.optional(v.number()),
  }).index("by_post", ["postId"]),

  // ---------------------------------------------------------------------------
  // Bounties tables (GitHub-Issues-style crowdsourced bounty board)
  // ---------------------------------------------------------------------------

  /**
   * A bounty posted by any authenticated user.
   *
   * Types: "bug" | "feature" | "code_review" | "design" | "docs" | "other"
   * Status: "open" | "in_progress" | "completed" | "cancelled"
   */
  bounties: defineTable({
    authorId: v.id("users"),
    authorName: v.string(),
    title: v.string(),
    description: v.string(),
    /**
     * "bug" | "feature" | "code_review" | "design" | "docs" | "research" | "other"
     */
    type: v.string(),
    /** "open" | "in_progress" | "completed" | "cancelled" */
    status: v.string(),
    /** Reward string (freeform: "$50", "500 USDC", "open source credit", …) */
    reward: v.optional(v.string()),
    /** Optional repo URL, issue link, or reference URL */
    repoUrl: v.optional(v.string()),
    /** Skill tags e.g. ["TypeScript","React","Convex"] */
    tags: v.optional(v.array(v.string())),
    /** Denormalised application count for fast display */
    applicationCount: v.number(),
    /** Denormalised upvote score for sorting */
    score: v.number(),
    /** Unix ms timestamp of last edit */
    editedAt: v.optional(v.number()),
    /** Id of the accepted application (set when status → completed) */
    acceptedApplicationId: v.optional(v.id("bountyApplications")),
  })
    .index("by_author", ["authorId"])
    .index("by_status", ["status"])
    .index("by_score", ["score"]),

  /**
   * An application / solution submission for a bounty.
   * Users apply describing how they'll solve it; they can later submit a solution.
   *
   * Status: "pending" | "accepted" | "rejected"
   */
  bountyApplications: defineTable({
    bountyId: v.id("bounties"),
    applicantId: v.id("users"),
    applicantName: v.string(),
    /** Short description of approach or why the applicant is a good fit */
    proposal: v.string(),
    /** Optional solution text / links once work is done */
    solution: v.optional(v.string()),
    /** "pending" | "accepted" | "rejected" */
    status: v.string(),
    /** Unix ms timestamp of last edit */
    editedAt: v.optional(v.number()),
  })
    .index("by_bounty", ["bountyId"])
    .index("by_applicant", ["applicantId"])
    .index("by_bounty_applicant", ["bountyId", "applicantId"]),

  /**
   * One upvote per (user, bounty) pair.
   * Only upvotes (no downvotes) to keep the UX simple.
   */
  bountyVotes: defineTable({
    bountyId: v.id("bounties"),
    userId: v.id("users"),
  })
    .index("by_bounty", ["bountyId"])
    .index("by_user_bounty", ["userId", "bountyId"]),

  // ---------------------------------------------------------------------------
  // Gigs tables (freelance / paid-project board)
  // ---------------------------------------------------------------------------

  /**
   * A gig posted by a client looking to hire a freelancer.
   *
   * category: "development" | "design" | "writing" | "marketing" | "video" |
   *           "data" | "consulting" | "other"
   * status:   "open" | "hired" | "completed" | "cancelled"
   * budgetType: "fixed" | "hourly"
   */
  gigs: defineTable({
    authorId: v.id("users"),
    authorName: v.string(),
    title: v.string(),
    description: v.string(),
    /** "development" | "design" | "writing" | "marketing" | "video" | "data" | "consulting" | "other" */
    category: v.string(),
    /** "open" | "hired" | "completed" | "cancelled" */
    status: v.string(),
    /** "fixed" | "hourly" */
    budgetType: v.optional(v.string()),
    /** Human-readable budget string e.g. "$500", "₹10,000", "$25/hr" */
    budget: v.optional(v.string()),
    /** Duration string e.g. "1 week", "1 month", "ongoing" */
    duration: v.optional(v.string()),
    /** Required skills / tags */
    skills: v.optional(v.array(v.string())),
    /** Optional repo/reference URL */
    referenceUrl: v.optional(v.string()),
    /** Denormalised proposal count */
    proposalCount: v.number(),
    /** Unix ms of last edit */
    editedAt: v.optional(v.number()),
    /** Id of the accepted proposal when status → hired */
    acceptedProposalId: v.optional(v.id("gigApplications")),
  })
    .index("by_author", ["authorId"])
    .index("by_status", ["status"])
    .index("by_category", ["category"]),

  /**
   * A freelancer's proposal on a gig.
   * status: "pending" | "accepted" | "rejected"
   */
  gigApplications: defineTable({
    gigId: v.id("gigs"),
    applicantId: v.id("users"),
    applicantName: v.string(),
    /** Cover note / pitch */
    coverLetter: v.string(),
    /** Optional rate / quote from the freelancer */
    proposedRate: v.optional(v.string()),
    /** Link to portfolio, LinkedIn, GitHub, etc. */
    portfolioUrl: v.optional(v.string()),
    /** "pending" | "accepted" | "rejected" */
    status: v.string(),
    editedAt: v.optional(v.number()),
  })
    .index("by_gig", ["gigId"])
    .index("by_applicant", ["applicantId"])
    .index("by_gig_applicant", ["gigId", "applicantId"]),
});
