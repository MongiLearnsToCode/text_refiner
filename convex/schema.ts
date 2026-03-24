import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  refinements: defineTable({
    userId: v.string(), // tokenIdentifier from ctx.auth.getUserIdentity()
    label: v.string(),
    inputText: v.string(),
    outputText: v.string(),
    processingMode: v.string(),
  }).index("by_userId_and_creationTime", ["userId"]),

  usage: defineTable({
    userId: v.string(),
    monthKey: v.string(), // "YYYY-MM"
    count: v.number(),
  }).index("by_userId_and_month", ["userId", "monthKey"]),

  promptTemplates: defineTable({
    userId: v.string(),
    name: v.string(),
    inputText: v.string(),
    preset: v.string(),
    structureGenerator: v.boolean(),
    optimizationPass: v.boolean(),
  }).index("by_userId", ["userId"]),

  subscriptions: defineTable({
    userId: v.string(),
    plan: v.union(v.literal("free"), v.literal("pro")),
    polarCustomerId: v.optional(v.string()),
    polarSubscriptionId: v.optional(v.string()),
    cancelAtPeriodEnd: v.optional(v.boolean()),
  })
    .index("by_userId", ["userId"])
    .index("by_polarSubscriptionId", ["polarSubscriptionId"]),
});
