import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { opportunities } from "../lib/demo-data";
import { directory } from "../lib/hub-data";
import { demoAuthors, demoBounties, demoCommunity, demoGigs, demoThreads } from "./demoSeedData";

const countFields = {
  users: v.number(), profiles: v.number(), onboardingProgress: v.number(), roleDetails: v.number(), userSkills: v.number(), portfolioProjects: v.number(),
  sampleOpportunities: v.number(), directoryEntries: v.number(), bounties: v.number(), bountyApplications: v.number(), bountyVotes: v.number(),
  gigs: v.number(), gigApplications: v.number(), forumPosts: v.number(), forumComments: v.number(), forumVotes: v.number(), communityPosts: v.number(), communityComments: v.number(), communityLikes: v.number(),
};

/** Admin-only, additive demo seed. Never edits an existing user's profile or deletes records. */
export const presentable = internalMutation({
  args: {},
  returns: v.object({ inserted: v.object(countFields), label: v.string() }),
  handler: async ctx => {
    const inserted = { users: 0, profiles: 0, onboardingProgress: 0, roleDetails: 0, userSkills: 0, portfolioProjects: 0, sampleOpportunities: 0, directoryEntries: 0, bounties: 0, bountyApplications: 0, bountyVotes: 0, gigs: 0, gigApplications: 0, forumPosts: 0, forumComments: 0, forumVotes: 0, communityPosts: 0, communityComments: 0, communityLikes: 0 };
    const authors = {} as Record<typeof demoAuthors[number]["slug"], { id: Id<"users">; name: string }>;
    for (const author of demoAuthors) {
      const clerkUserId = `demo:zalen:v1:${author.slug}`;
      const existing = await ctx.db.query("users").withIndex("by_clerk_user_id", q => q.eq("clerkUserId", clerkUserId)).unique();
      const userId = existing?._id ?? await ctx.db.insert("users", { clerkUserId, name: author.name });
      if (!existing) inserted.users++;
      authors[author.slug] = { id: userId, name: author.name };
      if (!await ctx.db.query("profiles").withIndex("by_user_id", q => q.eq("userId", userId)).unique()) {
        await ctx.db.insert("profiles", { userId, bio: author.bio, location: author.location, primaryRole: author.role, isPublic: true }); inserted.profiles++;
      }
      if (!await ctx.db.query("onboardingProgress").withIndex("by_user_id", q => q.eq("userId", userId)).unique()) {
        await ctx.db.insert("onboardingProgress", { userId, currentStep: 6, completed: true, completedAt: Date.now() }); inserted.onboardingProgress++;
      }
      if (!(await ctx.db.query("roleDetails").withIndex("by_user_id", q => q.eq("userId", userId)).take(10)).some(item => item.role === author.role)) {
        await ctx.db.insert("roleDetails", { userId, role: author.role, data: { demonstration: "Fictional project profile", workMode: author.location === "Remote" ? "Remote" : "Hybrid" } }); inserted.roleDetails++;
      }
      const skills = await ctx.db.query("userSkills").withIndex("by_user_id", q => q.eq("userId", userId)).take(100);
      for (const name of author.skills) if (!skills.some(item => item.name === name)) { await ctx.db.insert("userSkills", { userId, name, proficiency: "Intermediate" }); inserted.userSkills++; }
      const projects = await ctx.db.query("portfolioProjects").withIndex("by_user_id", q => q.eq("userId", userId)).take(100);
      const title = `Demo project: ${author.slug === "builder" ? "Local business prospecting map" : author.slug === "orbit" ? "Team onboarding prototype" : author.slug === "layer" ? "Accessible dashboard component kit" : "Small business sales insights"}`;
      if (!projects.some(item => item.title === title)) { await ctx.db.insert("portfolioProjects", { userId, title, summary: "Fictional portfolio example for the Zalen demonstration. Includes a clear brief, responsive layouts, and documented handoff decisions.", category: "Demo project", skills: [...author.skills], role: author.role, status: "completed", visibility: "public", sortOrder: 0 }); inserted.portfolioProjects++; }
    }
    for (const { id: slug, ...item } of opportunities) if (!await ctx.db.query("sampleOpportunities").withIndex("by_slug", q => q.eq("slug", slug)).unique()) { await ctx.db.insert("sampleOpportunities", { slug, ...item }); inserted.sampleOpportunities++; }
    for (const { id: slug, ...item } of directory) {
      if (item.kind === "freelancer") continue;
      if (!await ctx.db.query("directoryEntries").withIndex("by_slug", q => q.eq("slug", slug)).unique()) { await ctx.db.insert("directoryEntries", { ...item, kind: item.kind, slug }); inserted.directoryEntries++; }
    }
    const builder = authors.builder;
    for (const item of demoBounties) {
      const author = authors[item.author];
      const existing = (await ctx.db.query("bounties").withIndex("by_author", q => q.eq("authorId", author.id)).take(100)).find(row => row.title === item.title);
      const bountyId = existing?._id ?? await ctx.db.insert("bounties", { authorId: author.id, authorName: author.name, title: item.title, description: `${item.description}\n\nFictional demo brief. The reward is illustrative and is not a funding or payment offer.`, type: item.type, status: item.status, reward: item.reward, tags: [...item.tags], applicationCount: 0, score: 0 });
      if (!existing) inserted.bounties++;
      if (!await ctx.db.query("bountyApplications").withIndex("by_bounty_applicant", q => q.eq("bountyId", bountyId).eq("applicantId", builder.id)).unique()) {
        const accepted = item.status === "completed";
        const id = await ctx.db.insert("bountyApplications", { bountyId, applicantId: builder.id, applicantName: builder.name, proposal: "Demo proposal: I would confirm the scope, deliver a small working version, and review accessibility and edge cases before the handoff.", status: accepted ? "accepted" : "pending", ...(accepted ? { solution: "Demo solution: a documented prototype with keyboard checks, responsive layouts, and a concise handoff." } : {}) });
        const current = await ctx.db.get(bountyId);
        await ctx.db.patch(bountyId, { applicationCount: (current?.applicationCount ?? 0) + 1, ...(accepted ? { acceptedApplicationId: id } : {}) }); inserted.bountyApplications++;
      }
      if (!await ctx.db.query("bountyVotes").withIndex("by_user_bounty", q => q.eq("userId", builder.id).eq("bountyId", bountyId)).unique()) {
        await ctx.db.insert("bountyVotes", { bountyId, userId: builder.id }); const current = await ctx.db.get(bountyId); await ctx.db.patch(bountyId, { score: (current?.score ?? 0) + 1 }); inserted.bountyVotes++;
      }
    }
    for (const item of demoGigs) {
      const author = authors[item.author];
      const existing = (await ctx.db.query("gigs").withIndex("by_author", q => q.eq("authorId", author.id)).take(100)).find(row => row.title === item.title);
      const gigId = existing?._id ?? await ctx.db.insert("gigs", { authorId: author.id, authorName: author.name, title: item.title, description: `${item.description}\n\nFictional demo listing. The budget is illustrative; no client or payment commitment is represented.`, category: item.category, status: item.status, budgetType: "fixed", budget: item.budget, duration: item.duration, skills: [...item.skills], proposalCount: 0 });
      if (!existing) inserted.gigs++;
      if (!await ctx.db.query("gigApplications").withIndex("by_gig_applicant", q => q.eq("gigId", gigId).eq("applicantId", builder.id)).unique()) {
        const accepted = item.status === "hired" || item.status === "completed";
        const id = await ctx.db.insert("gigApplications", { gigId, applicantId: builder.id, applicantName: builder.name, coverLetter: "Demo proposal: I would begin with a scope review, agree on milestones, and include testing and handoff documentation. This is a fictional proposal for presentation purposes.", proposedRate: item.budget, status: accepted ? "accepted" : "pending" });
        const current = await ctx.db.get(gigId); await ctx.db.patch(gigId, { proposalCount: (current?.proposalCount ?? 0) + 1, ...(accepted ? { acceptedProposalId: id } : {}) }); inserted.gigApplications++;
      }
    }
    for (const item of demoThreads) {
      const author = authors[item.author];
      const existing = (await ctx.db.query("forumPosts").withIndex("by_author", q => q.eq("authorId", author.id)).take(100)).find(row => row.title === item.title);
      const postId = existing?._id ?? await ctx.db.insert("forumPosts", { authorId: author.id, authorName: author.name, title: item.title, category: item.category, body: `${item.body}\n\nFictional demonstration discussion.`, score: 0, commentCount: 0 });
      if (!existing) inserted.forumPosts++;
      const commenter = item.author === "builder" ? authors.layer : builder;
      if (!(await ctx.db.query("forumComments").withIndex("by_post", q => q.eq("postId", postId)).take(100)).some(row => row.authorId === commenter.id)) {
        await ctx.db.insert("forumComments", { postId, authorId: commenter.id, authorName: commenter.name, body: "Demo reply: Start with the problem and constraints, show one important decision, and explain how you checked the result. A short handoff example is helpful too." }); const current = await ctx.db.get(postId); await ctx.db.patch(postId, { commentCount: (current?.commentCount ?? 0) + 1 }); inserted.forumComments++;
      }
      if (!await ctx.db.query("forumVotes").withIndex("by_user_post", q => q.eq("userId", commenter.id).eq("postId", postId)).unique()) {
        await ctx.db.insert("forumVotes", { postId, userId: commenter.id, direction: 1 }); const current = await ctx.db.get(postId); await ctx.db.patch(postId, { score: (current?.score ?? 0) + 1 }); inserted.forumVotes++;
      }
    }
    for (const item of demoCommunity) {
      const author = authors[item.author];
      const existing = (await ctx.db.query("communityPosts").withIndex("by_author", q => q.eq("authorId", author.id)).take(100)).find(row => row.body === item.body);
      const postId = existing?._id ?? await ctx.db.insert("communityPosts", { authorId: author.id, authorName: author.name, body: item.body, media: [], likeCount: 0, commentCount: 0 });
      if (!existing) inserted.communityPosts++;
      const commenter = item.author === "builder" ? authors.layer : builder;
      if (!(await ctx.db.query("communityComments").withIndex("by_post", q => q.eq("postId", postId)).take(100)).some(row => row.authorId === commenter.id)) {
        await ctx.db.insert("communityComments", { postId, authorId: commenter.id, authorName: commenter.name, body: "Demo feedback: The clear scope and testing notes make this easier to review. A before-and-after example would be a useful next addition." }); const current = await ctx.db.get(postId); await ctx.db.patch(postId, { commentCount: (current?.commentCount ?? 0) + 1 }); inserted.communityComments++;
      }
      if (!await ctx.db.query("communityLikes").withIndex("by_user_post", q => q.eq("userId", commenter.id).eq("postId", postId)).unique()) {
        await ctx.db.insert("communityLikes", { postId, userId: commenter.id }); const current = await ctx.db.get(postId); await ctx.db.patch(postId, { likeCount: (current?.likeCount ?? 0) + 1 }); inserted.communityLikes++;
      }
    }
    return { inserted, label: "Zalen fictional demo data v1" };
  },
});
