"use node";
import { v } from "convex/values";
import { action } from "./_generated/server";

// Groq retired `llama-3.3-70b-versatile` for developer/free-tier projects on
// August 16, 2026. Keep this aligned with a currently supported model.
const MODEL = "openai/gpt-oss-120b";
const GROQ_API_BASE = "https://api.groq.com/openai/v1";

async function callGroq(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set in Convex environment variables.");
  }

  const response = await fetch(`${GROQ_API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Groq API error (${response.status}): ${body}`);
  }

  const data = await response.json() as { choices: Array<{ message: { content: string } }> };
  return data.choices[0]?.message?.content ?? "";
}

export const refine = action({
  args: {
    prompt: v.string(),
    optimizationPrompt: v.optional(v.string()),
  },
  returns: v.string(),
  handler: async (_, args) => {
    const refinedText = await callGroq(args.prompt);
    if (!args.optimizationPrompt) return refinedText;
    return await callGroq(args.optimizationPrompt);
  },
});

export const generateVariants = action({
  args: {
    prompt: v.string(),
  },
  returns: v.array(v.string()),
  handler: async (_, args) => {
    const raw = await callGroq(args.prompt);
    return raw.split("---VARIANT---").map((s) => s.trim()).filter(Boolean);
  },
});
