import { v } from "convex/values";
import { query } from "./_generated/server";
import schema from "./schema";

export const listOpportunities = query({
  args: {},
  returns: v.array(schema.doc("sampleOpportunities")),
  handler: async ctx => ctx.db.query("sampleOpportunities").withIndex("by_slug").take(100),
});

export const listDirectory = query({
  args: { kind: v.union(v.literal("investor"), v.literal("business")) },
  returns: v.array(schema.doc("directoryEntries")),
  handler: async (ctx, args) => ctx.db.query("directoryEntries").withIndex("by_kind", q => q.eq("kind", args.kind)).take(100),
});
