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

function isDeveloperEmail(email: string | undefined): boolean {
  const developerEmails = (process.env.DEVELOPER_ACCOUNT_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return email !== undefined && developerEmails.includes(email.toLowerCase());
}

// ─── Public actions ────────────────────────────────────────────────────────────

/** Synchronizes the authenticated account with the deployment's allow-list. */
export const syncDeveloperAccess = action({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    await ctx.runMutation(internal.subscriptions.setDeveloperAccess, {
      userId: identity.tokenIdentifier,
      isDeveloper: isDeveloperEmail(identity.email),
    });

    return null;
  },
});

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

/** Resumes a subscription that was set to cancel at period end. */
export const resumeSubscription = action({
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
      subscriptionUpdate: { cancelAtPeriodEnd: false },
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

      case "subscription.updated": {
        const stillPro = data.status === "active" || (data.status === "canceled" && data.cancelAtPeriodEnd);
        await ctx.runMutation(internal.subscriptions.upsertSubscription, {
          userId,
          plan: stillPro ? "pro" : "free",
          polarSubscriptionId: data.id,
          cancelAtPeriodEnd: data.cancelAtPeriodEnd ?? false,
        });
        break;
      }

      case "subscription.canceled":
        // cancelAtPeriodEnd means still active until the billing period ends
        await ctx.runMutation(internal.subscriptions.upsertSubscription, {
          userId,
          plan: data.cancelAtPeriodEnd ? "pro" : "free",
          polarSubscriptionId: data.id,
          cancelAtPeriodEnd: data.cancelAtPeriodEnd ?? false,
        });
        break;

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
