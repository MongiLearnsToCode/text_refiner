import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const save = mutation({
  args: {
    name: v.string(),
    inputText: v.string(),
    preset: v.string(),
    structureGenerator: v.boolean(),
    optimizationPass: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    return await ctx.db.insert("promptTemplates", {
      userId: identity.tokenIdentifier,
      name: args.name,
      inputText: args.inputText,
      preset: args.preset,
      structureGenerator: args.structureGenerator,
      optimizationPass: args.optimizationPass,
    });
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    return await ctx.db
      .query("promptTemplates")
      .withIndex("by_userId", (q) => q.eq("userId", identity.tokenIdentifier))
      .order("desc")
      .collect();
  },
});

export const remove = mutation({
  args: { id: v.id("promptTemplates") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const doc = await ctx.db.get(args.id);
    if (!doc || doc.userId !== identity.tokenIdentifier) throw new Error("Not found");
    await ctx.db.delete(args.id);
  },
});

export const rename = mutation({
  args: { id: v.id("promptTemplates"), name: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const doc = await ctx.db.get(args.id);
    if (!doc || doc.userId !== identity.tokenIdentifier) throw new Error("Not found");
    await ctx.db.patch(args.id, { name: args.name });
  },
});
