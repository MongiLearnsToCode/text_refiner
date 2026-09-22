import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";

const planValidator = v.union(v.literal("free"), v.literal("pro"));

// ─── Public queries ────────────────────────────────────────────────────────────

export const getUserPlan = query({
  args: {},
  returns: v.object({
    plan: planValidator,
    cancelAtPeriodEnd: v.optional(v.boolean()),
    isDeveloper: v.boolean(),
  }),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { plan: "free" as const, isDeveloper: false };

    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", identity.tokenIdentifier))
      .unique();

    const isDeveloper = sub?.isDeveloper ?? false;
    // Developer accounts start on Pro and can explicitly switch to either
    // plan using `developerOverride`. Their provider subscription is ignored.
    const plan = isDeveloper
      ? sub?.developerOverride ?? "pro"
      : sub?.plan ?? "free";

    return {
      plan,
      isDeveloper,
      ...(plan === "pro" && sub?.cancelAtPeriodEnd !== undefined
        ? { cancelAtPeriodEnd: sub.cancelAtPeriodEnd }
        : {}),
    };
  },
});

/**
 * Lets a configured developer test either entitlement without creating or
 * changing a real subscription. Authorization is enforced by the backend.
 */
export const setDeveloperPlan = mutation({
  args: { plan: planValidator },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", identity.tokenIdentifier))
      .unique();

    if (!existing?.isDeveloper) {
      throw new Error("Developer plan controls are not available for this account.");
    }

    await ctx.db.patch(existing._id, { developerOverride: args.plan });

    return null;
  },
});

/** Called only by the action that reads the deployment's developer allow-list. */
export const setDeveloperAccess = internalMutation({
  args: { userId: v.string(), isDeveloper: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { isDeveloper: args.isDeveloper });
    } else {
      await ctx.db.insert("subscriptions", {
        userId: args.userId,
        plan: "free",
        isDeveloper: args.isDeveloper,
      });
    }

    return null;
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
