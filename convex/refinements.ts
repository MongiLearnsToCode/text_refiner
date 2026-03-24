import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";

export const save = mutation({
  args: {
    label: v.string(),
    inputText: v.string(),
    outputText: v.string(),
    processingMode: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    return await ctx.db.insert("refinements", {
      userId: identity.tokenIdentifier,
      label: args.label,
      inputText: args.inputText,
      outputText: args.outputText,
      processingMode: args.processingMode,
    });
  },
});

export const list = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { page: [], isDone: true, continueCursor: "" };
    return await ctx.db
      .query("refinements")
      .withIndex("by_userId_and_creationTime", (q) =>
        q.eq("userId", identity.tokenIdentifier)
      )
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const remove = mutation({
  args: { id: v.id("refinements") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const doc = await ctx.db.get(args.id);
    if (!doc || doc.userId !== identity.tokenIdentifier) {
      throw new Error("Not found");
    }
    await ctx.db.delete(args.id);
  },
});

export const updateLabel = mutation({
  args: { id: v.id("refinements"), label: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const doc = await ctx.db.get(args.id);
    if (!doc || doc.userId !== identity.tokenIdentifier) {
      throw new Error("Not found");
    }
    await ctx.db.patch(args.id, { label: args.label });
  },
});
