import type { RefineOptions } from "./groqService";

export function buildVariantsPrompt(
  originalInput: string,
  currentOutput: string,
  options: RefineOptions,
  count = 2
): string {
  return `You are an expert editor. Below is an original text and one refined version of it.

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
}

export function parseVariantsResponse(raw: string, count: number, fallback: string): string[] {
  const parts = raw.split("---VARIANT---").map((s) => s.trim()).filter(Boolean);
  if (parts.length >= count) return parts.slice(0, count);
  return [...parts, ...Array(count - parts.length).fill(fallback)];
}
