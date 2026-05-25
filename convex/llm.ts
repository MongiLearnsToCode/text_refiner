"use node";
import { v } from "convex/values";
import { action } from "./_generated/server";
import Groq from "groq-sdk";

const MODEL = "llama-3.3-70b-versatile";

function getGroq() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not set in Convex environment variables.");
  return new Groq({ apiKey, maxRetries: 2, timeout: 30000 });
}

export const refine = action({
  args: {
    prompt: v.string(),
    optimizationPrompt: v.optional(v.string()),
  },
  handler: async (_, args) => {
    const groq = getGroq();
    const response = await groq.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: args.prompt }],
    });

    let refinedText = response.choices[0]?.message?.content || "";

    if (args.optimizationPrompt) {
      const optResponse = await groq.chat.completions.create({
        model: MODEL,
        messages: [{ role: "user", content: args.optimizationPrompt }],
      });
      refinedText = optResponse.choices[0]?.message?.content || refinedText;
    }

    return refinedText;
  },
});

export const generateVariants = action({
  args: {
    prompt: v.string(),
  },
  handler: async (_, args) => {
    const groq = getGroq();
    const response = await groq.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: args.prompt }],
    });

    const raw = response.choices[0]?.message?.content ?? "";
    return raw.split("---VARIANT---").map((s) => s.trim()).filter(Boolean);
  },
});
