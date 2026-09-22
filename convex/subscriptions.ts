import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";

const planValidator = v.union(v.literal("free"), v.literal("pro"));

function isDeveloperEmail(email: string | undefined): boolean {
  const developerEmails = (process.env.DEVELOPER_ACCOUNT_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return email !== undefined && developerEmails.includes(email.toLowerCase());
}

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

    const isDeveloper = isDeveloperEmail(identity.email);
    const plan = isDeveloper && sub?.developerOverride
      ? sub.developerOverride
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
    if (!isDeveloperEmail(identity.email)) {
      throw new Error("Developer plan controls are not available for this account.");
    }

    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", identity.tokenIdentifier))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { developerOverride: args.plan });
    } else {
      await ctx.db.insert("subscriptions", {
        userId: identity.tokenIdentifier,
        plan: "free",
        developerOverride: args.plan,
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
