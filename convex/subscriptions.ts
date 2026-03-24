import { v } from "convex/values";
import { internalMutation, internalQuery, query } from "./_generated/server";

// ─── Public queries ────────────────────────────────────────────────────────────

export const getUserPlan = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { plan: "free" as const };

    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", identity.tokenIdentifier))
      .unique();

    if (!sub || sub.plan !== "pro") return { plan: "free" as const };

    return {
      plan: "pro" as const,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    };
  },
});

// ─── Internal queries (used by polar actions) ──────────────────────────────────

export const getByUserId = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
  },
});

// ─── Internal mutations (called from polar webhook action) ─────────────────────

export const upsertSubscription = internalMutation({
  args: {
    userId: v.string(),
    plan: v.union(v.literal("free"), v.literal("pro")),
    polarCustomerId: v.optional(v.string()),
    polarSubscriptionId: v.optional(v.string()),
    cancelAtPeriodEnd: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        plan: args.plan,
        ...(args.polarCustomerId !== undefined && { polarCustomerId: args.polarCustomerId }),
        ...(args.polarSubscriptionId !== undefined && { polarSubscriptionId: args.polarSubscriptionId }),
        ...(args.cancelAtPeriodEnd !== undefined && { cancelAtPeriodEnd: args.cancelAtPeriodEnd }),
      });
    } else {
      await ctx.db.insert("subscriptions", {
        userId: args.userId,
        plan: args.plan,
        polarCustomerId: args.polarCustomerId,
        polarSubscriptionId: args.polarSubscriptionId,
        cancelAtPeriodEnd: args.cancelAtPeriodEnd,
      });
    }
  },
});
