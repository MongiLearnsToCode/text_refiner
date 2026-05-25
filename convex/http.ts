import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { authComponent, createAuth } from "./auth";


const http = httpRouter();

authComponent.registerRoutes(http, createAuth, { cors: true });

// ─── Health check ────────────────────────────────────────────────────────────────

http.route({
  path: "/health",
  method: "GET",
  handler: httpAction(async () => {
    return new Response(JSON.stringify({ status: "ok", timestamp: Date.now() }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// ─── Polar webhook ─────────────────────────────────────────────────────────────

http.route({
  path: "/polar/webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const body = await req.text();
    const webhookId = req.headers.get("webhook-id") ?? "";
    const webhookTimestamp = req.headers.get("webhook-timestamp") ?? "";
    const webhookSignature = req.headers.get("webhook-signature") ?? "";

    try {
      await ctx.runAction(internal.polarActions.handleWebhook, {
        body,
        webhookId,
        webhookTimestamp,
        webhookSignature,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Webhook error";
      return new Response(message, { status: 400 });
    }

    return new Response(null, { status: 200 });
  }),
});

export default http;
