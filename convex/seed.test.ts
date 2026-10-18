/// <reference types="vite/client" />
import { describe, expect, test } from "vitest";
import { convexTest } from "convex-test";
import { makeFunctionReference } from "convex/server";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");
const seed = makeFunctionReference<"mutation">("seed:presentable");

describe("demo seed", () => {
  test("populates public pages, keeps related counters accurate, and is safe to rerun", async () => {
    const t = convexTest(schema, modules);
    const first = await t.mutation(seed, {});
    expect(first.inserted).toMatchObject({ users: 4, bounties: 8, gigs: 8, forumPosts: 6, communityPosts: 6, sampleOpportunities: 6, directoryEntries: 6 });
    const second = await t.mutation(seed, {});
    expect(Object.values(second.inserted).every(value => value === 0)).toBe(true);
    await t.run(async ctx => {
      const bounties = await ctx.db.query("bounties").take(20);
      for (const bounty of bounties) {
        const applications = await ctx.db.query("bountyApplications").withIndex("by_bounty", q => q.eq("bountyId", bounty._id)).take(20);
        expect(bounty.applicationCount).toBe(applications.length);
        if (bounty.status === "completed") expect(applications.find(item => item._id === bounty.acceptedApplicationId)?.status).toBe("accepted");
      }
      for (const post of await ctx.db.query("communityPosts").take(20)) {
        expect(post.commentCount).toBe((await ctx.db.query("communityComments").withIndex("by_post", q => q.eq("postId", post._id)).take(20)).length);
        expect(post.likeCount).toBe((await ctx.db.query("communityLikes").withIndex("by_post", q => q.eq("postId", post._id)).take(20)).length);
      }
    });
  });
  test("preserves an existing account, profile, project, and listing", async () => {
    const t = convexTest(schema, modules);
    const ids = await t.run(async ctx => {
      const userId = await ctx.db.insert("users", { clerkUserId: "test-existing-user", name: "Existing account" });
      const profileId = await ctx.db.insert("profiles", { userId, bio: "Keep my profile.", location: "Existing location" });
      const projectId = await ctx.db.insert("portfolioProjects", { userId, title: "Keep my work" });
      const bountyId = await ctx.db.insert("bounties", { authorId: userId, authorName: "Existing account", title: "Keep my bounty", description: "Existing content", type: "feature", status: "open", score: 9, applicationCount: 0 });
      return { userId, profileId, projectId, bountyId };
    });
    await t.mutation(seed, {});
    await t.run(async ctx => {
      expect((await ctx.db.get(ids.profileId))?.bio).toBe("Keep my profile.");
      expect((await ctx.db.get(ids.projectId))?.title).toBe("Keep my work");
      expect((await ctx.db.get(ids.bountyId))?.score).toBe(9);
      expect((await ctx.db.query("portfolioProjects").withIndex("by_user_id", q => q.eq("userId", ids.userId)).take(20)).length).toBe(1);
    });
  });
});
