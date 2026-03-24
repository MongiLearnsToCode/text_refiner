"use node";
import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Polar } from "@polar-sh/sdk";
import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks";

function polar() {
  const token = process.env.POLAR_ACCESS_TOKEN;
  if (!token) throw new Error("POLAR_ACCESS_TOKEN is not set in Convex environment variables.");
  const server = process.env.POLAR_SERVER as "sandbox" | "production" | undefined ?? "sandbox";
  return new Polar({ accessToken: token, server });
}

// ─── Public actions ────────────────────────────────────────────────────────────

export const createCheckoutSession = action({
  args: {},
  handler: async (ctx): Promise<{ url: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const productId = process.env.POLAR_PRODUCT_ID;
    if (!productId) throw new Error("POLAR_PRODUCT_ID is not set in Convex environment variables.");

    const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";

    const checkout = await polar().checkouts.create({
      products: [productId],
      successUrl: `${siteUrl}?upgraded=true`,
      customerEmail: identity.email ?? undefined,
      externalCustomerId: identity.tokenIdentifier,
    });

    if (!checkout.url) throw new Error("Failed to create Polar checkout session.");
    return { url: checkout.url };
  },
});

/** Cancels the user's subscription at period end. */
export const cancelSubscription = action({
  args: {},
  handler: async (ctx): Promise<void> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const sub = await ctx.runQuery(internal.subscriptions.getByUserId, {
      userId: identity.tokenIdentifier,
    });
    if (!sub?.polarSubscriptionId) throw new Error("No active subscription found.");

    await polar().subscriptions.update({
      id: sub.polarSubscriptionId,
      subscriptionUpdate: { cancelAtPeriodEnd: true },
    });
  },
});

// ─── Internal webhook action ───────────────────────────────────────────────────

export const handleWebhook = internalAction({
  args: {
    body: v.string(),
    webhookId: v.string(),
    webhookTimestamp: v.string(),
    webhookSignature: v.string(),
  },
  handler: async (ctx, args): Promise<void> => {
    const secret = process.env.POLAR_WEBHOOK_SECRET;
    if (!secret) throw new Error("POLAR_WEBHOOK_SECRET is not set.");

    let event: ReturnType<typeof validateEvent>;
    try {
      event = validateEvent(args.body, {
        "webhook-id": args.webhookId,
        "webhook-timestamp": args.webhookTimestamp,
        "webhook-signature": args.webhookSignature,
      }, secret);
    } catch (err) {
      if (err instanceof WebhookVerificationError) {
        throw new Error("Polar webhook signature verification failed.");
      }
      throw err;
    }

    const data = event.data as any;
    // Polar puts the userId in the customer's externalId field
    const userId: string | undefined =
      data?.customer?.externalId ?? data?.externalCustomerId;

    if (!userId) return;

    switch (event.type) {
      case "subscription.active":
        await ctx.runMutation(internal.subscriptions.upsertSubscription, {
          userId,
          plan: "pro",
          polarCustomerId: data.customerId ?? data.customer?.id,
          polarSubscriptionId: data.id,
          cancelAtPeriodEnd: data.cancelAtPeriodEnd ?? false,
        });
        break;

      case "subscription.updated":
        await ctx.runMutation(internal.subscriptions.upsertSubscription, {
          userId,
          plan: data.status === "active" ? "pro" : "free",
          polarSubscriptionId: data.id,
          cancelAtPeriodEnd: data.cancelAtPeriodEnd ?? false,
        });
        break;

      case "subscription.canceled":
      case "subscription.revoked":
        await ctx.runMutation(internal.subscriptions.upsertSubscription, {
          userId,
          plan: "free",
          polarSubscriptionId: data.id,
          cancelAtPeriodEnd: false,
        });
        break;
    }
  },
});
