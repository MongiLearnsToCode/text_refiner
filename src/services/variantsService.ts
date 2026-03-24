import Groq from "groq-sdk";
import type { RefineOptions } from "./geminiService";

const ai = new Groq({ apiKey: import.meta.env.VITE_GROQ_API_KEY, dangerouslyAllowBrowser: true });
const MODEL = "llama-3.3-70b-versatile";

export async function generateVariants(
  originalInput: string,
  currentOutput: string,
  options: RefineOptions,
  count = 2
): Promise<string[]> {
  const prompt = `You are an expert editor. Below is an original text and one refined version of it.

Original text:
<original>
${originalInput}
</original>

Current refined version:
<current>
${currentOutput}
</current>

Your task: produce ${count} ALTERNATIVE refined versions of the original text. Each alternative should achieve the same goals as the current version but differ meaningfully in sentence structure, phrasing, level of detail, or paragraph organisation.

Context: ${options.context}
Tone: ${options.tone ?? "Professional"}

Format your response as exactly ${count} versions separated by the delimiter "---VARIANT---". Output only the variant text — no labels, numbering, or commentary.`;

  const response = await ai.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = response.choices[0]?.message?.content ?? "";
  const parts = raw.split("---VARIANT---").map((s) => s.trim()).filter(Boolean);

  if (parts.length >= count) return parts.slice(0, count);
  return [...parts, ...Array(count - parts.length).fill(currentOutput)];
}
