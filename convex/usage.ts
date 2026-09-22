import { mutation, query } from "./_generated/server";

const FREE_TIER_LIMIT = 20;

function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

async function isUserPro(ctx: any, userId: string): Promise<boolean> {
  const sub = await ctx.db
    .query("subscriptions")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .unique();
  const plan = sub?.isDeveloper ? sub.developerOverride ?? sub.plan : sub?.plan;
  return plan === "pro";
}

export const checkAndIncrement = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const userId = identity.tokenIdentifier;
    const monthKey = currentMonthKey();
    const pro = await isUserPro(ctx, userId);

    const existing = await ctx.db
      .query("usage")
      .withIndex("by_userId_and_month", (q) =>
        q.eq("userId", userId).eq("monthKey", monthKey)
      )
      .unique();

    const currentCount = existing?.count ?? 0;

    if (!pro && currentCount >= FREE_TIER_LIMIT) {
      throw new Error(`USAGE_LIMIT_EXCEEDED:${FREE_TIER_LIMIT}`);
    }

    if (existing) {
      await ctx.db.patch(existing._id, { count: currentCount + 1 });
    } else {
      await ctx.db.insert("usage", { userId, monthKey, count: 1 });
    }

    return { count: currentCount + 1, limit: pro ? null : FREE_TIER_LIMIT };
  },
});

export const getUsage = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { count: 0, limit: FREE_TIER_LIMIT };

    const userId = identity.tokenIdentifier;
    const monthKey = currentMonthKey();

    const [existing, sub] = await Promise.all([
      ctx.db
        .query("usage")
        .withIndex("by_userId_and_month", (q) =>
          q.eq("userId", userId).eq("monthKey", monthKey)
        )
        .unique(),
      ctx.db
        .query("subscriptions")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .unique(),
    ]);

    const pro = sub?.plan === "pro";

    return {
      count: existing?.count ?? 0,
      limit: pro ? null : FREE_TIER_LIMIT,
    };
  },
});
